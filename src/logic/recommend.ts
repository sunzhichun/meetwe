import type { CandidateMetrics, MeetWeComputationResult, MeetWeSession } from '../types';
import { centroid, haversineKm } from './geo';
import { geocodeAddress, searchPoiByText } from '../services/amapClient';
import { arithmeticMean, populationVariance } from './stats';
import { rankCandidatesWithTieBreaker } from './applyTieBreaker';
import { eventTypeToAmapKeyword, matchesEventTypeByPoiType, normalizeAmapPoi } from './poiMapper';
import type { MockPlace } from '../types';
import { estimateRealCommuteMinutes } from './realCommute';

function scorePoiMatch(candidateText: string, poi: { name?: string; address?: string }) {
  const normalizedCandidate = candidateText.replace(/[（(].*?[）)]/g, '').trim();
  const haystack = `${poi.name ?? ''} ${poi.address ?? ''}`.replace(/[（(].*?[）)]/g, '').trim();
  if (!normalizedCandidate || !haystack) return 0;
  if (haystack.includes(normalizedCandidate)) return 1000;

  const tokens = normalizedCandidate
    .split(/[\s,，·\-_/]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? token.length : 0), 0);
}

async function geocodeWithFallback(addressText: string) {
  const trimmed = addressText.trim();
  const parts = trimmed.split('·').map((x) => x.trim()).filter(Boolean);
  const rightPart = parts.length >= 2 ? parts[parts.length - 1] : '';
  const stripParens = (text: string) => text.replace(/[（(].*?[）)]/g, '').trim();
  const looksLikePoiLabel = parts.length >= 2 || /[（(].*?[）)]/.test(trimmed);

  const poiAttempts = [trimmed, stripParens(trimmed), rightPart, stripParens(rightPart)].filter(
    (x, idx, arr) => x.length > 0 && arr.indexOf(x) === idx
  );

  // 对“名称 · 地址”这类展示文案，POI 搜索通常比 geocode 更稳。
  if (looksLikePoiLabel) {
    for (const candidate of poiAttempts) {
      const poiResp = await searchPoiByText(candidate, undefined, undefined, {
        timeoutMs: 5000,
        retryTimes: 0,
      });
      const bestPoi = [...(poiResp.pois ?? [])]
        .filter((poi) => typeof poi.location === 'string' && poi.location.trim().length > 0)
        .sort((a, b) => scorePoiMatch(candidate, b) - scorePoiMatch(candidate, a))[0];
      if (bestPoi?.location) {
        return {
          first: {
            location: bestPoi.location,
            citycode: bestPoi.citycode,
            adcode: bestPoi.adcode,
          },
          resolvedText: candidate,
          source: 'poi-search' as const,
        };
      }
    }
  }

  // 注意：不要把左半段“POI 名称”单独拿去 geocode，
  // 否则像“人民公园游乐园”这类通用名称可能误命中外地同名点。
  const geocodeAttempts = [rightPart, stripParens(rightPart), trimmed, stripParens(trimmed)].filter(
    (x, idx, arr) => x.length > 0 && arr.indexOf(x) === idx
  );

  for (const candidate of geocodeAttempts) {
    const geo = await geocodeAddress(candidate);
    const first = geo.geocodes?.[0];
    if (first?.location) {
      return { first, resolvedText: candidate, source: 'geocode' as const };
    }
  }

  for (const candidate of poiAttempts) {
    const poiResp = await searchPoiByText(candidate, undefined, undefined, {
      timeoutMs: 5000,
      retryTimes: 0,
    });
    const bestPoi = [...(poiResp.pois ?? [])]
      .filter((poi) => typeof poi.location === 'string' && poi.location.trim().length > 0)
      .sort((a, b) => scorePoiMatch(candidate, b) - scorePoiMatch(candidate, a))[0];
    if (bestPoi?.location) {
      return {
        first: {
          location: bestPoi.location,
          citycode: bestPoi.citycode,
          adcode: bestPoi.adcode,
        },
        resolvedText: candidate,
        source: 'poi-search' as const,
      };
    }
  }

  throw new Error(`地理编码失败：${addressText}`);
}

/**
 * MeetWe 推荐主流程（MVP：真实地理 + POI + 先用 mock 通勤时间跑通 UI 结构）
 *
 * 注意：本函数已改为异步以接入高德 REST（geocode + POI search）。
 * 后续待办会把 `estimateCommuteMinutes` 替换为真实路径规划（realCommute）。
 */
export type ComputeRecommendationOptions = {
  minRating?: number;
};

type CandidateSearchLimits = {
  poiCandidateLimit: number;
  commuteCandidateLimit: number;
};

const DEFAULT_LIMITS: CandidateSearchLimits = {
  poiCandidateLimit: 30,
  commuteCandidateLimit: 18,
};

const BUS_FALLBACK_LIMITS: CandidateSearchLimits = {
  poiCandidateLimit: 45,
  commuteCandidateLimit: 24,
};

async function computeRecommendationRound(
  session: MeetWeSession,
  participantMetas: Array<{
    participantId: string;
    addressText: string;
    coordinate: { lat: number; lng: number };
    cityCode?: string;
    adCode?: string;
    source?: 'selected' | 'geocode' | 'poi-search';
    resolvedText?: string;
  }>,
  options: ComputeRecommendationOptions | undefined,
  limits: CandidateSearchLimits
) {
  const participantCoords = participantMetas.map(({ participantId, addressText, coordinate, source, resolvedText }) => ({
    participantId,
    addressText,
    coordinate,
    source,
    resolvedText,
  }));

  const center = centroid(participantCoords.map((x) => x.coordinate));
  const searchCity = participantMetas[0]?.adCode ?? participantMetas[0]?.cityCode;

  const keyword = eventTypeToAmapKeyword(session.eventType);
  const poiResp = await searchPoiByText(keyword, center, searchCity);
  const pois = poiResp.pois ?? [];

  const normalizedPois = pois
    .map((poi) => normalizeAmapPoi(poi))
    .filter((p) => p.rating !== null)
    .filter((p) => matchesEventTypeByPoiType(session.eventType, p.category))
    .filter((p) => (options?.minRating ? (p.rating as number) >= options.minRating : true));

  const sortedRatedPois = [...normalizedPois].sort((a, b) => {
    const byRating = (b.rating as number) - (a.rating as number);
    if (Math.abs(byRating) > 1e-9) return byRating > 0 ? 1 : -1;

    const da = haversineKm(center, a.coordinate);
    const db = haversineKm(center, b.coordinate);
    const byDistance = da - db;
    if (Math.abs(byDistance) > 1e-9) return byDistance > 0 ? 1 : -1;
    return 0;
  });

  const limitedPois = sortedRatedPois.slice(0, limits.poiCandidateLimit);

  const places: Array<{ place: MockPlace; rating: number }> = limitedPois.map((p) => ({
    place: {
      id: p.id,
      name: p.name,
      category: p.category ?? '未知',
      coordinate: p.coordinate,
    },
    rating: p.rating as number,
  }));

  const commuteCandidates = [...places]
    .map((x) => {
      const proxyKm = arithmeticMean(
        session.participants.map((_p, idx) => haversineKm(participantCoords[idx].coordinate, x.place.coordinate))
      );
      return { ...x, proxyKm };
    })
    .sort((a, b) => a.proxyKm - b.proxyKm)
    .slice(0, limits.commuteCandidateLimit);

  const candidates: CandidateMetrics[] = [];
  let routeFailCount = 0;
  let missingCityCodeCount = 0;
  let firstRouteError: string | undefined;
  for (const { place, rating } of commuteCandidates) {
    try {
      const timesMinutes: number[] = [];
      for (let idx = 0; idx < session.participants.length; idx++) {
        const p = session.participants[idx]!;
        const from = participantCoords[idx]!.coordinate;
        const cityCode = participantMetas[idx]?.cityCode;
        if (p.transport === 'bus' && !cityCode) {
          missingCityCodeCount += 1;
        }
        // 串行算路：减少瞬时并发，降低 QPS 超限概率（尤其是 Web 端）
        const t = await estimateRealCommuteMinutes(from, place.coordinate, p.transport, { cityCode });
        timesMinutes.push(t);
      }

      const variance = populationVariance(timesMinutes);
      const meanMinutes = arithmeticMean(timesMinutes);

      candidates.push({
        place,
        timesMinutes,
        variance,
        meanMinutes,
        rating,
      });
    } catch (e) {
      routeFailCount += 1;
      if (!firstRouteError) {
        firstRouteError = e instanceof Error ? e.message : String(e);
      }
      continue;
    }
  }

  return {
    recommendations: rankCandidatesWithTieBreaker(candidates),
    participantCoords,
    debugStats: {
      rawPois: pois.length,
      ratedPois: sortedRatedPois.length,
      routeCandidates: commuteCandidates.length,
      finalCandidates: candidates.length,
      routeFailCount,
      missingCityCodeCount,
      firstRouteError,
      participantModes: session.participants.map((p) => p.transport),
    },
  };
}

export async function computeMeetWeRecommendations(
  session: MeetWeSession,
  options?: ComputeRecommendationOptions
): Promise<MeetWeComputationResult> {
  // 1) 文本地址 -> 真实坐标（地理编码）
  const participantMetas = await Promise.all(
    session.participants.map(async (p) => {
      // 若参与者已从 POI 联想中选中坐标，优先复用，避免“展示文案地址”再次 geocode 失败
      if (p.selectedCoordinate) {
        let cityCode = p.selectedCityCode;
        let adCode = p.selectedAdCode;

        // 公交/城市约束仍需要 city/ad 编码：若 POI 未返回，则补做一次 geocode
        if (!cityCode || !adCode) {
          const { first: fallback } = await geocodeWithFallback(p.addressText);
          cityCode = cityCode ?? fallback?.citycode;
          adCode = adCode ?? fallback?.adcode;
        }

        return {
          participantId: p.id,
          addressText: p.addressText,
          coordinate: p.selectedCoordinate,
          cityCode,
          adCode,
          source: 'selected' as const,
          resolvedText: p.addressText,
        };
      }

      const { first, source, resolvedText } = await geocodeWithFallback(p.addressText);
      const loc = first.location;

      const [lonS, latS] = loc.split(',');
      const lon = Number.parseFloat(lonS);
      const lat = Number.parseFloat(latS);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        throw new Error(`地理编码坐标无效：${p.addressText}`);
      }
      return {
        participantId: p.id,
        addressText: p.addressText,
        coordinate: { lat, lng: lon },
        cityCode: first.citycode,
        adCode: first.adcode,
        source,
        resolvedText,
      };
    })
  );

  let roundResult = await computeRecommendationRound(session, participantMetas, options, DEFAULT_LIMITS);
  const hasBusParticipant = session.participants.some((p) => p.transport === 'bus');
  if (hasBusParticipant && roundResult.recommendations.length === 0) {
    roundResult = await computeRecommendationRound(session, participantMetas, options, BUS_FALLBACK_LIMITS);
  }

  return {
    recommendations: roundResult.recommendations,
    participantCoords: roundResult.participantCoords,
    debugStats: roundResult.debugStats,
    computedAt: Date.now(),
  };
}

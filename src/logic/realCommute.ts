import type { LatLng, TransportMode } from '../types';
import { planRouteSimple, planTransitIntegrated } from '../services/amapClient';

const commuteCache = new Map<string, number>();

function cacheKey(params: {
  from: LatLng;
  to: LatLng;
  mode: TransportMode;
  cityCode?: string;
}): string {
  const { from, to, mode, cityCode } = params;
  // 用固定精度避免浮点 key 漂移
  const fmt = (n: number) => n.toFixed(5);
  return `${mode}|${fmt(from.lat)},${fmt(from.lng)}|${fmt(to.lat)},${fmt(to.lng)}|${cityCode ?? ''}`;
}

function parseSeconds(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'string' ? Number.parseFloat(raw) : raw;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function secondsToMinutesRounded1(sec: number): number {
  return Math.round((sec / 60) * 10) / 10;
}

async function estimateDrivingWalkingCyclingMinutes(
  from: LatLng,
  to: LatLng,
  mode: 'car' | 'walk' | 'bike' | 'ebike'
): Promise<number> {
  const apiMode = mode === 'car' ? 'driving' : mode === 'walk' ? 'walking' : mode === 'bike' ? 'bicycling' : 'electrobike';
  const resp = await planRouteSimple(apiMode, from, to);
  if (String((resp as any)?.status) !== '1') {
    throw new Error(`${mode}路径规划失败：${(resp as any)?.info ?? 'unknown'}`);
  }

  // v5/direction/* 返回结构可能因 mode/show_fields 差异而变化，做多路径兼容提取
  const routeAny = resp.route as any;
  const p0 = routeAny?.paths?.[0];
  const durationSeconds =
    p0?.duration ??
    p0?.cost?.duration ??
    routeAny?.duration ??
    routeAny?.cost?.duration;
  const sec = parseSeconds(durationSeconds);
  if (!sec) {
    const routeKeys = routeAny && typeof routeAny === 'object' ? Object.keys(routeAny).join(',') : 'none';
    const p0Keys = p0 && typeof p0 === 'object' ? Object.keys(p0).join(',') : 'none';
    throw new Error(`路径规划耗时缺失：${mode}; routeKeys=${routeKeys}; path0Keys=${p0Keys}`);
  }
  return secondsToMinutesRounded1(sec);
}

function extractTransitDurationsSeconds(resp: any): number[] {
  const route = resp?.route;
  const transits = route?.transits;
  const durations: number[] = [];

  const transitList = Array.isArray(transits) ? transits : transits ? [transits] : [];

  for (const t of transitList) {
    // 1) 常见直接字段
    const direct =
      parseSeconds(t?.duration) ??
      parseSeconds(t?.cost?.duration) ??
      parseSeconds(t?.transit_fee?.duration);
    if (direct) durations.push(direct);

    // 2) transit 里包含换乘方案数组/对象
    const transit = t?.transit;
    if (Array.isArray(transit)) {
      for (const tt of transit) {
        const d =
          parseSeconds(tt?.duration) ??
          parseSeconds(tt?.cost?.duration);
        if (d) durations.push(d);
      }
    } else {
      const d =
        parseSeconds(transit?.duration) ??
        parseSeconds(transit?.cost?.duration);
      if (d) durations.push(d);
    }

    // 3) 进一步尝试 segment/segments 级别的 cost.duration 聚合
    const segments = Array.isArray(t?.segments) ? t.segments : t?.segments ? [t.segments] : [];
    const segmentDurations = segments
      .map((seg: any) => parseSeconds(seg?.cost?.duration) ?? parseSeconds(seg?.duration))
      .filter((x: number | null): x is number => x !== null);
    if (segmentDurations.length > 0) {
      const sum = segmentDurations.reduce((acc: number, cur: number) => acc + cur, 0);
      durations.push(sum);
    }
  }

  // 兜底：有的响应可能只在 route.duration 给总耗时
  const fallback =
    parseSeconds(route?.duration) ??
    parseSeconds(route?.cost?.duration);
  if (fallback) durations.push(fallback);

  return durations;
}

async function estimateBusMinutes(from: LatLng, to: LatLng, cityCode: string): Promise<number> {
  const resp = await planTransitIntegrated(from, to, cityCode, cityCode);
  if (String((resp as any)?.status) !== '1') {
    throw new Error(`公交路径规划失败：${(resp as any)?.info ?? 'unknown'}`);
  }
  const durations = extractTransitDurationsSeconds(resp);
  if (durations.length === 0) {
    const routeKeys =
      resp?.route && typeof resp.route === 'object' ? Object.keys(resp.route as Record<string, unknown>).join(',') : 'none';
    const firstTransit = Array.isArray((resp as any)?.route?.transits)
      ? (resp as any).route.transits[0]
      : (resp as any)?.route?.transits;
    const transitKeys =
      firstTransit && typeof firstTransit === 'object'
        ? Object.keys(firstTransit as Record<string, unknown>).join(',')
        : 'none';
    const routePreview = JSON.stringify((resp as any)?.route ?? {}).slice(0, 260);
    throw new Error(
      `公交路径规划耗时缺失; routeKeys=${routeKeys}; transitKeys=${transitKeys}; routePreview=${routePreview}`
    );
  }
  const sec = Math.min(...durations);
  return secondsToMinutesRounded1(sec);
}

/**
 * 真实通勤耗时（分钟）
 * - car/walk/bike/ebike：取 paths[0].duration（秒 -> 分钟）
 * - bus：取所有换乘方案里的最短 duration（秒 -> 分钟）
 */
export async function estimateRealCommuteMinutes(
  from: LatLng,
  to: LatLng,
  mode: TransportMode,
  opts?: { cityCode?: string }
): Promise<number> {
  const key = cacheKey({ from, to, mode, cityCode: opts?.cityCode });
  const cached = commuteCache.get(key);
  if (cached !== undefined) return cached;

  if (mode === 'bus') {
    const cityCode = opts?.cityCode;
    if (!cityCode) throw new Error('公交模式需要 cityCode（来自地理编码返回）');
    const v = await estimateBusMinutes(from, to, cityCode);
    commuteCache.set(key, v);
    return v;
  }

  if (mode === 'car' || mode === 'walk' || mode === 'bike' || mode === 'ebike') {
    const v = await estimateDrivingWalkingCyclingMinutes(from, to, mode);
    commuteCache.set(key, v);
    return v;
  }

  // 当前类型里只应存在这些 mode
  const _exhaustive: never = mode;
  return _exhaustive;
}


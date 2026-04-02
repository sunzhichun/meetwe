import { getAmapKey, isAmapConfigured } from '../config/env';
import type { AmapGeocodeResponse, AmapPoiSearchResponse, AmapDrivingWalkingCyclingResponse, AmapTransitIntegratedResponse } from './amapTypes';
import type { LatLng } from '../types';

const AMAP_REST_BASE = 'https://restapi.amap.com';

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const base = `${AMAP_REST_BASE}${path}`;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  // React Native/Expo 环境通常支持 AbortController
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`amap http error ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export type AmapCallOptions = {
  timeoutMs?: number;
  retryTimes?: number;
};

async function callAmapJson<T>(path: string, params: Record<string, string | number | undefined>, opts?: AmapCallOptions): Promise<T> {
  if (!isAmapConfigured()) {
    throw new Error('未配置 EXPO_PUBLIC_AMAP_KEY');
  }
  const key = getAmapKey()!;
  const url = buildUrl(path, { ...params, key, output: 'json' });
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const retryTimes = opts?.retryTimes ?? 1;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retryTimes; attempt++) {
    try {
      return await fetchJsonWithTimeout<T>(url, timeoutMs);
    } catch (e) {
      lastErr = e;
      // 简单退避（避免同步重试撞上限流）
      if (attempt < retryTimes) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('amap request failed');
}

/**
 * 地理编码：地址 -> 坐标
 */
export async function geocodeAddress(address: string, city?: string, opts?: AmapCallOptions): Promise<AmapGeocodeResponse> {
  return callAmapJson<AmapGeocodeResponse>(
    '/v3/geocode/geo',
    {
      address,
      city,
    },
    opts
  );
}

/**
 * POI 搜索（后续会做更精确的 endpoint 选择）
 */
export async function searchPoiByText(
  keyword: string,
  location?: LatLng,
  city?: string,
  opts?: AmapCallOptions
): Promise<AmapPoiSearchResponse> {
  // v3/place/text：MVP 使用 extensions=all 拿评分信息，并限制到指定城市提高稳定性
  return callAmapJson<AmapPoiSearchResponse>(
    '/v3/place/text',
    {
      keywords: keyword,
      location: location ? `${location.lng},${location.lat}` : undefined,
      city,
      citylimit: city ? 'true' : undefined,
      extensions: 'all',
      offset: 25,
      page: 1,
    },
    opts
  );
}

/**
 * 驾车/步行/骑行路线规划（v5/direction/*）
 */
export async function planRouteSimple(
  mode: 'driving' | 'walking' | 'bicycling' | 'electrobike',
  origin: LatLng,
  destination: LatLng,
  opts?: AmapCallOptions
): Promise<AmapDrivingWalkingCyclingResponse> {
  const path = mode === 'driving' ? '/v5/direction/driving' : mode === 'walking' ? '/v5/direction/walking' : mode === 'bicycling' ? '/v5/direction/bicycling' : '/v5/direction/electrobike';
  return callAmapJson<AmapDrivingWalkingCyclingResponse>(
    path,
    {
      origin: `${origin.lng},${origin.lat}`,
      destination: `${destination.lng},${destination.lat}`,
      show_fields: 'cost',
    },
    opts
  );
}

/**
 * 公交路线规划（v5/direction/transit/integrated）
 */
export async function planTransitIntegrated(
  origin: LatLng,
  destination: LatLng,
  city1: string,
  city2: string,
  opts?: AmapCallOptions
): Promise<AmapTransitIntegratedResponse> {
  return callAmapJson<AmapTransitIntegratedResponse>(
    '/v5/direction/transit/integrated',
    {
      origin: `${origin.lng},${origin.lat}`,
      destination: `${destination.lng},${destination.lat}`,
      city1,
      city2,
      strategy: 0,
      AlternativeRoute: 3,
      nightflag: 0,
      show_fields: 'cost',
    },
    opts
  );
}


import type { EventType, LatLng } from '../types';
import type { AmapPoi, NormalizedAmapPoi } from '../services/amapTypes';

/**
 * MeetWe EventType -> 高德关键词（先用“可用且低成本”的映射，后续可按真实类目精细化）
 */
export function eventTypeToAmapKeyword(eventType: EventType): string {
  switch (eventType) {
    case 'food':
      return '美食';
    case 'shopping':
      return '购物';
    case 'movie':
      return '电影院';
    case 'leisure':
      return '休闲';
    case 'sightseeing':
      return '景点';
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = eventType;
      return '美食';
    }
  }
}

const ALLOW_KEYWORDS_BY_EVENT_TYPE: Record<EventType, readonly string[]> = {
  food: ['餐饮服务', '中餐厅', '外国餐厅', '快餐厅', '咖啡厅', '茶艺馆', '甜品店', '蛋糕店', '美食广场'],
  shopping: ['购物服务', '商场', '商城', '超市', '特色商业街', '服饰鞋包', '数码电子'],
  movie: ['电影院', '影城'],
  leisure: ['休闲娱乐', 'KTV', '剧本杀', '密室', '游戏厅', '棋牌室', '酒吧', '生活服务'],
  sightseeing: ['风景名胜', '旅游景点', '公园', '公园广场', '植物园', '动物园', '水族馆', '展览馆', '博物馆', '纪念馆', '教堂', '寺庙', '古迹', '游乐园'],
};

const DENY_KEYWORDS_BY_EVENT_TYPE: Record<EventType, readonly string[]> = {
  food: ['生活服务', '购物服务', '商务住宅', '公司企业'],
  shopping: ['生活服务', '餐饮服务', '公司企业', '商务住宅'],
  movie: ['生活服务', '购物服务', '餐饮服务', '公司企业'],
  leisure: ['公司企业', '商务住宅'],
  sightseeing: ['生活服务', '购物服务', '餐饮服务', '商务住宅', '公司企业'],
};

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * 基于高德返回的 poi.type 做本地事件类型过滤。
 *
 * MVP 规则：
 * - 先命中 deny 则过滤
 * - 再命中 allow 则保留
 * - 其余暂时丢弃（后续若需要可加入“可放宽保留”fallback）
 */
export function matchesEventTypeByPoiType(eventType: EventType, poiType: string | null | undefined): boolean {
  const type = (poiType ?? '').trim();
  if (!type) return false;

  const deny = DENY_KEYWORDS_BY_EVENT_TYPE[eventType];
  if (includesAny(type, deny)) return false;

  const allow = ALLOW_KEYWORDS_BY_EVENT_TYPE[eventType];
  return includesAny(type, allow);
}

function parseLonLat(location?: string): LatLng | null {
  if (!location) return null;
  const parts = location.split(',');
  if (parts.length !== 2) return null;
  const lon = Number.parseFloat(parts[0]!.trim());
  const lat = Number.parseFloat(parts[1]!.trim());
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return { lat, lng: lon };
}

function parseRatingNumber(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'string' ? Number.parseFloat(raw) : (raw as number);
  if (!Number.isFinite(n)) return null;
  // Amap rating 通常是 0~5 或 0~1（看字段定义）。这里只做“可用性”判断：
  // - 不依赖具体上限，要求是正数（<=0 视为不可用）
  if (n <= 0) return null;
  return Math.round(n * 10) / 10;
}

function extractBizExtRating(bizExt: unknown): unknown {
  if (!bizExt) return null;
  if (typeof bizExt === 'string') {
    try {
      const parsed = JSON.parse(bizExt) as { rating?: unknown };
      return parsed.rating;
    } catch {
      return null;
    }
  }
  if (typeof bizExt === 'object' && bizExt !== null && 'rating' in (bizExt as Record<string, unknown>)) {
    return (bizExt as Record<string, unknown>).rating;
  }
  return null;
}

/**
 * 将高德 POI 归一化到 MeetWe 需要的最小字段。
 * - 无法解析坐标或无评分：rating=null（后续将被直接过滤出候选池）
 */
export function normalizeAmapPoi(poi: AmapPoi): NormalizedAmapPoi {
  const coordinate = parseLonLat(poi.location);
  const rating = parseRatingNumber(
    poi.rating ?? poi.overall_rating ?? extractBizExtRating(poi.biz_ext)
  );
  return {
    id: poi.id ?? `${poi.name ?? 'poi'}|${poi.location ?? ''}`,
    name: poi.name ?? '未知地点',
    coordinate: coordinate ?? { lat: 0, lng: 0 },
    rating,
    category: poi.type ?? null,
  };
}


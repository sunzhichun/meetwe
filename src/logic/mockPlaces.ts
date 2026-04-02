import { EVENT_TYPE_PRIORITY, type EventType, type LatLng, type MockPlace } from '../types';
import { hashString, hashToUnit } from './hash';

/**
 * 模拟候选地点生成器
 *
 * 思路：
 * - 在参与者坐标质心附近生成一批候选点
 * - 每个点带有确定性「内在约会类型」intrinsicEventType（模拟 POI 归类）
 * - 先筛出与当前用户选择一致的点；若未命中（0 条），方案 A：退回全量候选，并按当前约会类型统一展示命名/类别
 */

export const MOCK_PLACE_COUNT = 40;

const NAME_PREFIX: Record<EventType, string> = {
  food: '暖食',
  shopping: '轻生活',
  movie: '星光',
  leisure: '趣玩',
  sightseeing: '漫行',
};

const CATEGORY_LABEL: Record<EventType, string> = {
  food: '美食',
  shopping: '商城购物',
  movie: '电影',
  leisure: '休闲玩乐',
  sightseeing: '景点',
};

type InternalPlace = {
  coordinate: LatLng;
  intrinsicEventType: EventType;
};

function generateAllInternal(center: LatLng, seed: string): InternalPlace[] {
  const list: InternalPlace[] = [];
  for (let i = 0; i < MOCK_PLACE_COUNT; i++) {
    const h = hashString(`${seed}|place|${i}`);
    const h2 = hashString(`${seed}|place2|${i}`);
    const uAngle = hashToUnit(h);
    const uRadius = hashToUnit(h2);
    const angle = uAngle * Math.PI * 2;
    const radiusDeg = 0.015 + uRadius * 0.085;
    const lat = center.lat + Math.cos(angle) * radiusDeg * 0.75;
    const lng = center.lng + Math.sin(angle) * radiusDeg;
    const typeIdx = Math.abs(h) % EVENT_TYPE_PRIORITY.length;
    const intrinsicEventType = EVENT_TYPE_PRIORITY[typeIdx]!;
    list.push({ coordinate: { lat, lng }, intrinsicEventType });
  }
  return list;
}

export function generateMockPlaces(params: {
  center: LatLng;
  eventType: EventType;
  seed: string;
}): MockPlace[] {
  const { center, eventType, seed } = params;
  const all = generateAllInternal(center, seed);
  const matched = all.filter((p) => p.intrinsicEventType === eventType);
  const useFallback = matched.length === 0;
  const source = useFallback ? all : matched;
  const prefix = NAME_PREFIX[eventType];
  const displayCategory = CATEGORY_LABEL[eventType];

  return source.map((p, idx) => {
    const id = `place_${eventType}_${idx}_${hashString(`${seed}|id|${idx}`).toString(16)}`;
    const cat = useFallback ? displayCategory : CATEGORY_LABEL[p.intrinsicEventType];
    return {
      id,
      name: `${prefix}聚点 ${idx + 1}号`,
      category: cat,
      coordinate: p.coordinate,
    };
  });
}

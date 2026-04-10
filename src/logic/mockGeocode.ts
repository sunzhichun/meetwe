import type { LatLng } from '../types';
import { hashString, hashToUnit } from './hash';

/**
 * 模拟地理编码：把用户输入的文本地址映射为“稳定不变”的经纬度。
 *
 * 重要说明（给产品/非研发同学）：
 * - 这不是真实地图地理编码；不会联网、也不会保证地址语义正确
 * - 目的：让 MVP 在没有地图 Key 的情况下，也能跑通算法与 UI
 * - “同一文本”每次得到相同坐标：便于复现与排查问题
 */

/** 默认模拟城市中心：北京天安门附近（仅作坐标系锚点） */
const MOCK_CITY_CENTER: LatLng = { lat: 39.9042, lng: 116.4074 };

/** 生成随机偏移的最大范围（单位：度）。约 0.12° 纬度 ~ 13km 量级（粗略） */
const MAX_OFFSET_DEG = 0.12;

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * 将文本地址映射为模拟坐标。
 * - 空字符串也会映射到固定点（由 hash("") 决定），保证逻辑可运行
 */
export function mockGeocodeToCoordinate(addressText: string): LatLng {
  const key = normalizeText(addressText);
  const h1 = hashString(`geo|${key}`);
  const h2 = hashString(`geo2|${key}`);

  const u1 = hashToUnit(h1);
  const u2 = hashToUnit(h2);

  // 映射到以城市中心为圆心的近似“方形区域”
  const dLat = (u1 * 2 - 1) * MAX_OFFSET_DEG;
  const dLng = (u2 * 2 - 1) * MAX_OFFSET_DEG;

  return {
    lat: MOCK_CITY_CENTER.lat + dLat,
    lng: MOCK_CITY_CENTER.lng + dLng,
  };
}

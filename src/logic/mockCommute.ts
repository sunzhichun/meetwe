import type { LatLng, TransportMode } from '../types';
import { haversineKm } from './geo';
import { hashString, hashToUnit } from './hash';

/**
 * 模拟通勤时间
 *
 * 说明：
 * - 用直线距离（球面距离）近似路程，再除以“模式速度”得到时间
 * - 给不同交通方式加固定成本：停车/等车/换乘等（仍然很粗糙，但足以驱动 MVP）
 * - 噪声是确定性的：同一参与者 + 同一地点 + 同一交通方式 -> 同一噪声
 */

function transportKmh(mode: TransportMode): number {
  switch (mode) {
    case 'car':
      return 28;
    case 'bus':
      return 16;
    case 'walk':
      return 4.5;
    case 'ebike':
      return 22;
    case 'bike':
      return 14;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function transportFixedMinutes(mode: TransportMode): number {
  switch (mode) {
    case 'car':
      return 6; // 停车/找车位等
    case 'bus':
      return 10; // 等车/换乘等
    case 'walk':
      return 0;
    case 'ebike':
      return 2;
    case 'bike':
      return 1;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/**
 * 计算从 from -> to 的模拟通勤时间（分钟）
 * @param noiseKey 噪声种子（建议使用 participantId + placeId + transport）
 */
export function estimateCommuteMinutes(
  from: LatLng,
  to: LatLng,
  mode: TransportMode,
  noiseKey: string
): number {
  const km = haversineKm(from, to);
  const kmh = transportKmh(mode);
  const movingMinutes = (km / kmh) * 60;
  const fixed = transportFixedMinutes(mode);

  const h = hashString(`commuteNoise|${noiseKey}`);
  // 噪声范围约 [-3.5, +3.5] 分钟：增加“真实感”，但不破坏可复现性
  const noise = (hashToUnit(h) * 2 - 1) * 3.5;

  const total = movingMinutes + fixed + noise;
  // 通勤时间不应为负（极端情况直接截断）
  return Math.max(0, Math.round(total * 10) / 10);
}

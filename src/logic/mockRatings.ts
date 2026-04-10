import type { EventType } from '../types';
import { hashString, hashToUnit } from './hash';

/**
 * 模拟地点评分（3.5 ~ 5.0）
 *
 * 说明：
 * - 这不是真实点评数据；用于验证“tie-breaker 评分排序”的产品逻辑
 * - 评分由 placeId + eventType 决定：同一会话内稳定
 */

export function mockRating(placeId: string, eventType: EventType): number {
  const h = hashString(`rating|${eventType}|${placeId}`);
  const t = hashToUnit(h);
  const value = 3.5 + t * 1.5;
  return Math.round(value * 10) / 10;
}

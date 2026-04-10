import type { CandidateMetrics } from '../types';

/**
 * 公平性排序（主排序）
 *
 * 规则来自产品定义：
 * 1) 通勤时间方差越小越公平（优先）
 * 2) 方差相同/接近时，再看平均通勤时间（越短越好）
 *
 * 注意：这里的“接近”不在这里处理；接近区间与评分 tie-breaker 在 `applyTieBreaker.ts`
 */

export function compareByCommuteFairness(a: CandidateMetrics, b: CandidateMetrics): number {
  // 先比较方差（浮点用一个小 epsilon，避免 UI 模拟中的舍入误差导致不稳定）
  const dv = a.variance - b.variance;
  if (Math.abs(dv) > 1e-9) return dv > 0 ? 1 : -1;

  const dm = a.meanMinutes - b.meanMinutes;
  if (Math.abs(dm) > 1e-9) return dm > 0 ? 1 : -1;

  return 0;
}

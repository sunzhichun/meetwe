import type { CandidateMetrics, Recommendation } from '../types';
import { compareByCommuteFairness } from './fairnessRanking';

/**
 * 评分 tie-breaker（决胜）
 *
 * 产品规则：
 * - 先按通勤公平性（方差优先、均值次之）排序
 * - 仅当候选点处于“离最优解足够接近”的区间时，才允许用评分改变顺序
 *
 * 默认阈值（来自计划）：
 * - 方差相对差 <= 10%
 * - 平均通勤与参考最优均值差 <= 5 分钟
 */

const VAR_REL_TOL = 0.10;
const MEAN_ABS_TOL_MIN = 5;

function nearlyEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

function computeBestReference(candidates: CandidateMetrics[]): { vmin: number; mref: number } {
  const vmin = Math.min(...candidates.map((c) => c.variance));
  const atBestVariance = candidates.filter((c) => nearlyEqual(c.variance, vmin));
  const mref = Math.min(...atBestVariance.map((c) => c.meanMinutes));
  return { vmin, mref };
}

function isInTieBreakerTier(c: CandidateMetrics, vmin: number, mref: number): boolean {
  const rel = (c.variance - vmin) / Math.max(vmin, 1e-6);
  return rel <= VAR_REL_TOL && Math.abs(c.meanMinutes - mref) <= MEAN_ABS_TOL_MIN;
}

/**
 * 将候选集转换为最终推荐列表（已排序）
 */
export function rankCandidatesWithTieBreaker(candidates: CandidateMetrics[]): Recommendation[] {
  if (candidates.length === 0) return [];

  const { vmin, mref } = computeBestReference(candidates);

  const sorted = [...candidates].sort((a, b) => {
    const aTier = isInTieBreakerTier(a, vmin, mref);
    const bTier = isInTieBreakerTier(b, vmin, mref);

    // 关键：只有两者都在“接近最优”的区间里，评分才参与比较
    if (aTier && bTier) {
      if (b.rating !== a.rating) {
        return b.rating - a.rating; // 评分高的优先
      }
    }

    return compareByCommuteFairness(a, b);
  });

  return sorted.map((c) => ({
    ...c,
    tieBreakerApplied: isInTieBreakerTier(c, vmin, mref),
  }));
}

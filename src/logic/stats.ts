/**
 * 基础统计：均值与方差
 * MeetWe 的“公平”核心指标使用人口方差（除以 n）。
 */

export function arithmeticMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 人口方差：Var = sum((x-mean)^2)/n */
export function populationVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const m = arithmeticMean(values);
  const s = values.reduce((acc, v) => acc + (v - m) * (v - m), 0);
  return s / values.length;
}

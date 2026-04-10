/**
 * 确定性哈希工具：用于“模拟随机但可复现”的场景。
 * - 同一输入字符串 -> 同一输出数字
 * - 不依赖 Math.random()，避免每次打开 App 结果飘移
 */

/** FNV-1a 32-bit：实现简单、足够用于 UI 模拟 */
export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** 将哈希映射到 [0, 1) 区间 */
export function hashToUnit(h: number): number {
  // 16777216 = 2^24，足够细分且避免除零
  return (h % 16777216) / 16777216;
}

/** 组合多个种子，生成新的哈希（用于“参与者+地点”这类复合键） */
export function hashCombine(parts: string[]): number {
  return hashString(parts.join('|'));
}

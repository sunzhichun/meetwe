/**
 * 集中管理外部服务 Key（仅在本地/客户端侧读取）。
 *
 * 说明：
 * - 本项目采用“仅客户端 + 高德 REST Web 服务”策略，因此 Key 会出现在客户端代码中。
 * - 个人自用场景可接受；若要隐藏 Key，需要后续引入最小后端代理。
 */

const getEnv = (name: string): string | undefined => {
  // Expo/React Native 在构建时注入 process.env.EXPO_PUBLIC_* 到代码中。
  const v = process.env[name];
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
};

export function getAmapKey(): string | null {
  // 建议你在 .env 中配置 EXPO_PUBLIC_AMAP_KEY=xxxx
  return getEnv('EXPO_PUBLIC_AMAP_KEY') ?? null;
}

export function isAmapConfigured(): boolean {
  return Boolean(getAmapKey());
}


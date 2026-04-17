/**
 * 集中管理外部服务 Key（仅在本地/客户端侧读取）。
 *
 * 说明：
 * - 本项目采用“仅客户端 + 高德 REST Web 服务”策略，因此 Key 会出现在客户端代码中。
 * - 个人自用场景可接受；若要隐藏 Key，需要后续引入最小后端代理。
 */

const normalizeEnv = (v: string | undefined): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length ? trimmed : undefined;
};

/**
 * 注意：Expo 仅会在构建期静态注入 `process.env.EXPO_PUBLIC_*` 的“直写访问”。
 * 不能使用 `process.env[name]` 这种动态索引，否则在导出静态站后拿不到值。
 */
const getAmapKeyEnv = () => normalizeEnv(process.env.EXPO_PUBLIC_AMAP_KEY);
const getAmapWebJsKeyEnv = () => normalizeEnv(process.env.EXPO_PUBLIC_AMAP_WEB_JS_KEY);
const getAmapWebSecurityCodeEnv = () => normalizeEnv(process.env.EXPO_PUBLIC_AMAP_WEB_SECURITY_JS_CODE);

export function getAmapKey(): string | null {
  // 建议你在 .env 中配置 EXPO_PUBLIC_AMAP_KEY=xxxx
  return getAmapKeyEnv() ?? null;
}

export function getAmapWebJsKey(): string | null {
  return getAmapWebJsKeyEnv() ?? getAmapKey();
}

export function getAmapWebSecurityJsCode(): string | null {
  return getAmapWebSecurityCodeEnv() ?? null;
}

export function isAmapConfigured(): boolean {
  return Boolean(getAmapKey());
}


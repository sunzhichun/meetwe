/**
 * React Navigation 路由参数类型
 *
 * MVP 设计：
 * - `Results` 不通过 params 传大数据结构，统一从 Context 读取 `lastResult`
 *   （避免序列化/导航参数过大，也便于后续做“从通知回到结果页”等扩展）
 */

export type RootStackParamList = {
  Home: undefined;
  GroupSetup: undefined;
  Results: undefined;
  PlanList: undefined;
};

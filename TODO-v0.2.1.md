# v0.2.1 待办

相对 v0.2 主线（首页、约会类型、2–6 人、结果页模块、Slider、原生地图、PlanList 与结果卡片一致等）的后续迭代清单。

## P0

- [ ] **推荐列表：前 8 条 + 查看更多**  
  - 现状：`ResultsScreen.tsx` 使用 `filteredRecs.slice(0, 8)`，超出 8 条不可见。  
  - 目标：支持「加载更多 / 展开全部 / 无限滚动」等任一策略，使用户能访问全部 `filteredRecs`（或产品规定的上限）。  
  - 代码：`src/screens/ResultsScreen.tsx`（列表映射处）。

- [ ] **Web 端地图与原生一致**  
  - 现状：`src/components/resultsMap/ResultsMapSection.web.tsx` 为占位，与 iOS/Android 不一致。  
  - 目标：Web 上地图与筛选/推荐联动；若短期不可行，需在 PRD 中写明等价方案（例如静态图 + 列表）。

## P1（依赖地图 SDK / 上架前）

- [ ] **位置：地址联想 / 选点（POI）**  
  - 现状：参与者地址为文本输入 + `src/logic/mockGeocode.ts` 确定性伪坐标；`src/components/ParticipantEditor.tsx` 等。  
  - 目标：接入地图服务后，选点写入结构化地址与坐标，并与会话模型对齐。

## P2（可选增强，原 v0.2 范围外）

- [ ] **PlanList「最终选中」**  
  - 现状：`src/screens/PlanListScreen.tsx` 仅有「加入计划」列表。  
  - 目标：若产品需要「本场唯一确定地点」：单选、视觉区分、是否与分享/回顾联动——需先定产品规则再开发。

## 排期提示

| 项 | 依赖 |
|----|------|
| P0「查看更多」 | 可独立发版 |
| P0 Web 地图 | 与 P1 地图方案可合并规划 |
| P1 POI | 第三方账号、合规、密钥配置 |
| P2 最终选中 | 无算法强依赖，按产品优先级插入 |

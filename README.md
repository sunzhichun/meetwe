# MeetWe（MVP / 模拟数据）

MeetWe 是一款面向 2~6 人聚会的“公平约会地点”效能工具。当前仓库实现的是 **Expo SDK 54 + React Native** 的 MVP（与 **Expo Go 54.x** 匹配；若你使用 iOS Expo Go 54.0.2，请保持本项目的 `expo` 为 54 系列）：

- **模拟地理编码**：文本地址 → 确定性伪坐标（不调用真实地图）
- **模拟通勤时间**：按交通方式估算 + 确定性噪声
- **公平性排序**：通勤时间方差优先、均值次之
- **评分 tie-breaker**：仅当通勤指标足够接近最优时才用评分决胜
- **Firebase 匿名登录（可选）**：不配环境变量也不影响本地计算

## 环境要求

- Node.js（建议 LTS）
- 手机安装 **Expo Go**（或 Android Studio / Xcode 模拟器）

## 安装与启动

在项目根目录执行：

```bash
npm install
npm run start
```

然后用 Expo Go 扫码，或在模拟器里打开。

> Windows PowerShell 若遇到 `npm.ps1` 脚本执行策略问题，可用 `cmd` 运行 `npm.cmd`，或执行 `npm.cmd run start`。

## Firebase（可选）

1. 复制 `.env.example` 为 `.env`
2. 填入 Firebase Web App 的配置字段（`EXPO_PUBLIC_*`）
3. 在 Firebase Console 启用 **Anonymous** 登录方式

不配 Firebase：首页会提示未配置，但推荐功能仍可用。

## 目录结构（核心）

- `src/screens/*`：页面
- `src/components/*`：UI 组件
- `src/logic/*`：模拟算法与排序
- `src/services/*`：Firebase / 本地存储
- `src/context/MeetWeContext.tsx`：会话状态

# 易宿 (YiSu) - 酒店预订平台

## 📖 项目简介
易宿是一款基于 **Taro 4** + **React 18** 开发的现代化酒店预订应用。项目旨在提供流畅、高效的酒店搜索与预订体验，采用组件化架构设计，支持微信小程序及多端发布。

## 🌟 项目亮点
*   **跨端架构**: 基于 **Taro 4** 开发，一套代码完美支持微信小程序、H5 等多端运行，极大降低维护成本。
*   **现代技术栈**: 使用 **React 18** + **TypeScript** 构建，确保代码的健壮性、可维护性与类型安全。
*   **轻量级状态管理**: 采用 **Zustand** 进行全局状态管理，相比 Redux 更为简洁高效，不仅减少了样板代码，还提升了应用性能。
*   **业务逻辑解耦**: 核心业务逻辑封装在 Custom Hooks (如 `useHomeLogic`) 中，实现了 UI 与逻辑的分离，便于单元测试和复用。
*   **云原生集成**: 集成 **Supabase** 和 **微信云开发 (Cloud Functions)**，构建了弹性的 Serverless 后端架构，支持快速迭代。
*   **极致交互**: 针对移动端优化的交互设计，包含级联城市选择、自定义日期范围选择等原生级体验组件。

## 🛠 技术栈
*   **核心框架**: [Taro 4.x](https://docs.taro.zone/)
*   **UI 库**: [React 18](https://react.dev/)
*   **组件库**: [NutUI React](https://nutui.jd.com/#/) (移动端组件库)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **样式预处理**: SCSS (Sass)
*   **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
*   **日期处理**: [Day.js](https://day.js.org/)
*   **后端服务**: Supabase, WeChat Cloud Functions

## 📅 项目进度
目前项目处于 **开发初期 (Phase 1)**，核心的 **搜索页 (首页)** 功能已构建完成。

| 模块/页面 | 状态 | 路径/说明 |
| :--- | :---: | :--- |
| **搜索页 (首页)** | ✅ **已完成** | `src/pages/home` <br> 含城市/日期选择、标签筛选、搜索联动 |
| **搜索结果列表** | 🚧 开发中 | `src/packages/search` (已预留分包) |
| **酒店详情页** | 📅 计划中 | `src/packages/hotel` (已预留分包) |
| **下单页** | 📅 计划中 | 待开发 |
| **登录/注册** | 📅 计划中 | `src/packages/auth` (已预留分包) |
| **个人中心** | 📅 计划中 | `src/pages/user` (基础路由已配置) |

### 🔍 已完成功能细节 (搜索页)
*   **城市定位与选择**: 集成腾讯地图数据，支持自动定位及级联城市选择 (`HomeHeader`)。
*   **日期范围选择**: 支持入住/离店日期的跨月选择与校验 (`DateSelector`)。
*   **多维度筛选**: 支持“官方直营”、“特价房”等快捷标签筛选 (`FilterBar`)。
*   **逻辑复用**: 搜索状态（城市、日期、关键词、标签）统一由 `useHomeLogic` 钩子管理。

## 📂 目录结构
```bash
src/
├── components/       # 公共组件库
│   └── home/         # 首页专用业务组件 (耦合度较高)
├── hooks/            # 自定义 Hooks (逻辑层)
│   └── home/         # 首页逻辑封装
├── packages/         # 分包页面 (优化小程序主包体积)
│   ├── search/       # 搜索业务包
│   ├── hotel/        # 酒店业务包
│   └── auth/         # 认证业务包
├── pages/            # 主包页面 (Tab页)
│   ├── home/         # 首页
│   └── user/         # 个人中心
├── store/            # 全局状态 (Zustand)
├── utils/            # 工具库 (路由、地图、Supabase)
└── app.config.ts     # 全局配置
```

## 🚀 快速开始

1.  **安装依赖**
    ```bash
    pnpm install
    ```

2.  **启动开发环境 (微信小程序)**
    ```bash
    pnpm run dev:weapp
    ```
    *请使用微信开发者工具导入 `dist` 目录进行预览*

3.  **构建生产版本**
    ```bash
    pnpm run build:weapp
    ```

---
> 文档生成时间: 2026-02-17

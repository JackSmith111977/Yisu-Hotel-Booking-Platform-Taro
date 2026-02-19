/**
 * 路由路径常量
 * @description 使用 const object 代替 enum 以避免 Webpack 循环依赖初始化问题
 */
export const RoutePath = {
  // 主包
  Home: "/pages/home/index",
  User: "/pages/user/index",

  // 搜索分包
  SearchList: "/packages/search/pages/list/index",

  // 酒店分包

  // 认证分包
} as const;

// 导出类型，保持对 utils/router.ts 的兼容性
export type RoutePath = (typeof RoutePath)[keyof typeof RoutePath];

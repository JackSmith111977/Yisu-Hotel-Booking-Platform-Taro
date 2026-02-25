export default defineAppConfig({
  // 主包页面
  pages: ["pages/home/index", "pages/user/index", "pages/hotel_test/index"],
  // 分包配置
  subPackages: [
    // 搜索分包
    {
      root: "packages/search",
      pages: ["pages/list/index"],
    },
    // 酒店分包
    {
      root: "packages/hotel",
      pages: [
        "pages/index",
        "pages/order/index"
      ],
    },
    // 认证分包
    {
      root: "packages/auth",
      pages: ["pages/index", "pages/edit/index"],
    },
    // 用户分包
    {
      root: "packages/user",
      pages: ["pages/order-list/index", "pages/order-detail/index"],
    },
  ],
  // 3. TabBar 配置
  tabBar: {
    color: "#999",
    selectedColor: "#fa2c19",
    backgroundColor: "#fff",
    list: [
      {
        pagePath: "pages/home/index",
        text: "首页",
        // iconPath: ...
      },
      {
        pagePath: "pages/user/index",
        text: "我的",
        // iconPath: ...
      },
      {
        pagePath: "pages/hotel_test/index",
        text: "酒店详情页测试入口",
        // iconPath: ...
      },
    ],
  },
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  permission: {
    "scope.userLocation": {
      desc: "你的信息将用于为你推荐附近的酒店",
    },
  },
  requiredPrivateInfos: ["getLocation"],
});

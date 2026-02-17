import { PropsWithChildren } from "react";
import Taro, { useLaunch } from "@tarojs/taro";

import "./app.scss";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log("App launched.");

    // 云环境逻辑初始化
    if (!Taro.cloud) {
      console.warn("当前环境不支持云开发");
    } else {
      try {
        Taro.cloud.init({
          env: "cloudbase-8gxsjvyg256c9566",
          traceUser: true,
        });
      } catch (error) {
        console.error("初始化云环境失败", error);
      }
    }
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;

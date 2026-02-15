// Router 工具

import { RoutePath } from "@/constants/route";
import Taro from "@tarojs/taro";

/**
 * 路由参数类型
 */
export type RouteParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/**
 * 序列化路由参数
 * @function 将对象 {id: 1, name: '张三'} 转换为查询字符串 '?id=1&name=张三'
 * @param params 路由参数对象
 * @returns 序列化后的查询字符串
 */
function toQueryString(params?: RouteParams): string {
  if (!params) {
    return "";
  }

  const queryParts: string[] = [];

  Object.keys(params).forEach((key) => {
    // 获取对象每个键的值
    const value = params[key];

    // 过滤掉值为 null 或 undefined 的键值对，保留 0
    if (value !== null && value !== undefined) {
      // encodeURIComponent 对查询字符串进行编码，确保特殊字符被正确处理，防止截断
      queryParts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  });

  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

/**
 * 导航到指定路由
 * @function 封装 Taro.navigateTo，支持参数序列化
 * @param url 路由路径
 * @param params 路由参数对象
 */
export function navigateTo(url: RoutePath, params?: RouteParams) {
  const queryString = toQueryString(params);
  const fullPath = `${url}${queryString}`;

  Taro.navigateTo({
    url: fullPath,
    fail: (res) => {
      console.log("[Router] 跳转失败", res);
    },
  });
}

/**
 * 重定向到指定路由
 * @function 封装 Taro.redirectTo，支持参数序列化
 * @param url 路由路径
 * @param params 路由参数对象
 */
export function redirectTo(url: RoutePath, params?: RouteParams) {
  const queryString = toQueryString(params);
  const fullPath = `${url}${queryString}`;

  Taro.redirectTo({
    url: fullPath,
    fail: (res) => {
      console.log("[Router] 重定向失败", res);
    },
  });
}

/**
 * 获取当前路由参数
 * @function 封装 Taro.useRouter().params，返回路由参数对象
 * @returns 当前路由参数对象
 */
export function useRouteParams<T = RouteParams>() {
  const instance = Taro.useRouter();
  return (instance.params || {}) as T;
}

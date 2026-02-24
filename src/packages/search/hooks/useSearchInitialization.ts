import { useEffect, useState, useRef } from "react";
import Taro from "@tarojs/taro";
import { useSearchStore } from "@/store/searchStore";
import { SearchUrlParams } from "@/types/search";

/**
 * useSearchInitialization Hook
 * @description 初始化搜索状态 Hook
 * 主要功能：从路由参数 (URL Query) 中解析搜索条件，并同步到全局 Store
 *
 * @returns {boolean} isInitialized - 是否完成初始化
 */
export const useSearchInitialization = (): boolean => {
  // --- 依赖引入 ---
  const router = Taro.useRouter();
  // 使用 Zustand 的 selector 获取 setParams，避免不必要的重渲染
  const setParams = useSearchStore((state) => state.setParams);

  // --- 状态定义 ---
  // 用于向组件报告初始化是否完成
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 使用 useRef 记录初始化状态，防止 React StrictMode 下重复执行 (防御性编程)
  const hasExecutedRef = useRef(false);

  // --- 核心逻辑 ---
  useEffect(() => {
    // 避免重复执行初始化逻辑
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const params = router.params as SearchUrlParams;

    console.log("[useSearchInitialization] Router Params:", params);

    // Step 1: 判断有效性
    // 检查是否存在关键搜索字段，只有当 URL 携带了有效参数时才覆盖 Store
    // 这里的关键字段包括: city, keyword, checkInDate
    const hasKeyFields =
      Boolean(params.city) ||
      Boolean(params.keyword) ||
      Boolean(params.checkInDate);

    if (hasKeyFields) {
      // Step 2: 构造更新对象 & 类型转换
      // 定义一个临时对象用于收集更新
      const updates: any = {};

      // 1. City: URL 解码
      if (params.city) {
        updates.city = decodeURIComponent(params.city);
      }

      // 2. Keyword: URL 解码
      if (params.keyword) {
        updates.keyword = decodeURIComponent(params.keyword);
      }

      // 3. Dates: 统一 URL 解码 (修复用户反馈的日期 URL 编码问题)
      if (params.checkInDate) {
        try {
          updates.checkInDate = decodeURIComponent(params.checkInDate);
        } catch {
          updates.checkInDate = params.checkInDate;
        }
      }
      if (params.checkOutDate) {
        try {
          updates.checkOutDate = decodeURIComponent(params.checkOutDate);
        } catch {
          updates.checkOutDate = params.checkOutDate;
        }
      }

      // 4. Tags: 特殊处理 (解码 + 分割字符串)
      if (params.tags) {
        try {
          // 先解码，处理可能存在的 URL 编码字符
          const decodedTags = decodeURIComponent(params.tags);
          // 按逗号分割，并过滤空字符串
          updates.tags = decodedTags.split(",").filter(Boolean);
        } catch (error) {
          console.warn("[useSearchInitialization] Tags parsing failed:", error);

          // 容错处理：确保 params.tags 是字符串再处理
          // 防御性编程：避免 catch 块中因类型问题导致二次崩溃
          if (typeof params.tags === "string") {
            updates.tags = params.tags.split(",").filter(Boolean);
          } else {
            console.error(
              "[useSearchInitialization] Invalid tags format:",
              params.tags,
            );
            updates.tags = []; // 降级为空数组
          }
        }
      }

      // Step 3: 同步到 Store
      console.log("[useSearchInitialization] Syncing to store:", updates);
      setParams(updates);
    } else {
      console.log(
        "[useSearchInitialization] No valid params found, keeping store state.",
      );
    }

    // Step 4: 信号 - 设置初始化完成
    setIsInitialized(true);
  }, [
    // 依赖项解释：
    // 1. router.params: 确保获取到路由参数后执行
    // 2. setParams: Store 的 action，通常是稳定的
    router.params,
    setParams,
  ]);

  return isInitialized;
};

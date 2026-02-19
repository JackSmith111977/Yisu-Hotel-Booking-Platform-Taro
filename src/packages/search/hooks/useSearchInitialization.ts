import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { useSearchStore } from "@/store/searchStore";
import { SearchUrlParams } from "@/types/search";

/**
 * 搜索初始化 Hook
 * @description 从 URL 参数中恢复搜索状态到全局 Store，确保页面刷新或分享进入时状态正确
 * @returns {boolean} initialized - 是否已完成参数同步
 */
export const useSearchInitialization = (): boolean => {
  const router = Taro.useRouter();
  const params = router.params as SearchUrlParams;
  const setParams = useSearchStore((state) => state.setParams);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 标记是否已处理过，避免重复执行
    // 在 React 18+ 的 StrictMode 下，useEffect 会执行两次，这里依赖 params 变化是安全的

    // 确保 params 已就绪（Taro 某些场景下 router.params 可能是空对象）
    if (!params) {
      setInitialized(true);
      return;
    }

    // 检查是否有有效参数需要同步
    // 只要有任何一个核心参数存在，就视为需要同步
    const hasValidParams =
      params.city ||
      params.checkInDate ||
      params.checkOutDate ||
      params.keyword ||
      params.tags;

    if (hasValidParams) {
      // 解析 tags: 字符串 "tag1,tag2" -> 数组 ["tag1", "tag2"]
      let parsedTags: string[] = [];
      if (params.tags) {
        try {
          // 处理可能存在的编码问题，如 tags="亲子%2C海景" 或 tags="亲子,海景"
          const decodedTags = decodeURIComponent(params.tags);
          parsedTags = decodedTags.split(",").filter(Boolean);
        } catch (e) {
          console.warn("[useSearchInitialization] tags parse error:", e);
          // 降级处理
          if (params.tags) {
            parsedTags = params.tags.split(",").filter(Boolean);
          }
        }
      }

      // 构造更新对象，过滤掉 undefined 值
      const updates = {
        ...(params.city && { city: decodeURIComponent(params.city) }),
        ...(params.checkInDate && { checkInDate: params.checkInDate }),
        ...(params.checkOutDate && { checkOutDate: params.checkOutDate }),
        ...(params.keyword && { keyword: decodeURIComponent(params.keyword) }),
        ...(parsedTags.length > 0 && { tags: parsedTags }),
      };

      console.log(
        "[useSearchInitialization] Syncing URL params to Store:",
        updates,
      );

      // 同步到 Store
      setParams(updates);
    } else {
      console.log(
        "[useSearchInitialization] No URL params found, using existing Store state.",
      );
    }

    // 标记初始化完成
    setInitialized(true);
  }, [
    params.city,
    params.checkInDate,
    params.checkOutDate,
    params.keyword,
    params.tags,
    setParams,
  ]);

  return initialized;
};

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchHotels,
  getRecommendedHotels,
  SearchHotelsParams,
} from "@/services/hotel";
import { HotelSearchItem } from "@/types/home/search";

// 定义结果类型
export type SearchResultType = "normal" | "mixed" | "empty";

// Hook 配置选项
export interface UseSearchListOptions {
  enabled?: boolean; // 是否启用搜索，默认为 true
}

// 定义 Hook 返回值接口
export interface UseSearchListResult {
  list: HotelSearchItem[];
  recommendations: HotelSearchItem[];
  resultType: SearchResultType;
  loading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
}

// 常量定义
const MIN_THRESHOLD = 5;
const DEFAULT_PAGE_SIZE = 10;

/**
 * useSearchList Hook
 * @description 处理酒店搜索列表逻辑，包括精准搜索、少结果/无结果时的推荐策略
 * @param params 搜索参数
 * @param options 配置选项
 */
export const useSearchList = (
  params: SearchHotelsParams,
  options: UseSearchListOptions = { enabled: true },
): UseSearchListResult => {
  const { enabled = true } = options;

  // --- 状态定义 ---
  const [list, setList] = useState<HotelSearchItem[]>([]);
  const [recommendations, setRecommendations] = useState<HotelSearchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [resultType, setResultType] = useState<SearchResultType>("normal");
  const [error, setError] = useState<Error | null>(null);

  // 分页状态 (内部管理)
  const pageRef = useRef<number>(1);

  // 竞态处理：记录当前请求 ID
  const requestIdRef = useRef<number>(0);

  // --- 核心逻辑 ---

  // 监听 params 变化，执行初始搜索
  useEffect(() => {
    // 如果未启用，则不执行任何操作，直接返回
    if (!enabled) {
      return;
    }

    // 1. 初始化/重置状态
    const currentRequestId = ++requestIdRef.current; // 更新请求 ID
    setLoading(true);
    setList([]);
    setRecommendations([]);
    setHasMore(false);
    setResultType("normal");
    setError(null);
    pageRef.current = 1; // 重置分页

    const fetchInitialData = async () => {
      try {
        // Step 1 (精准搜索)
        // 确保使用第一页
        const searchParams: SearchHotelsParams = {
          ...params,
          page: 1,
          pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
        };

        const res = await searchHotels(searchParams);

        // 竞态检查：如果 ID 不匹配，说明有新请求，丢弃当前结果
        if (currentRequestId !== requestIdRef.current) return;

        const resultCount = res.length;
        const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;

        // Step 2 (决策分支)
        if (resultCount >= MIN_THRESHOLD) {
          // Case A: 结果充足
          setList(res);
          setResultType("normal");
          setHasMore(resultCount >= pageSize);
          setLoading(false); // 这种情况下流程结束
        } else {
          // Case B (0 < res < 5) 或 Case C (res === 0)
          // 先设置 list 和 resultType
          if (resultCount > 0) {
            setList(res);
            setResultType("mixed");
          } else {
            setList([]);
            setResultType("empty");
          }
          // hasMore 在 mixed/empty 情况下通常为 false，因为已经进入推荐流程
          setHasMore(false);

          // Step 3 (推荐请求) - 升级后的混合推荐逻辑
          const RECOMMEND_LIMIT = 10;

          try {
            // 准备排除列表：包含主搜索结果中的所有酒店 ID
            const excludeIds = res.map((item) => item.id);
            const finalRecommendations: HotelSearchItem[] = [];

            // Req 1 (同城): 仅当 params.city 存在时发起
            if (params.city) {
              const localResult = await getRecommendedHotels({
                city: params.city,
                limit: RECOMMEND_LIMIT, // 尝试获取足够的同城推荐
                strategy: "same_city_score",
                excludeIds, // 传递需要排除的 ID
              });

              // 竞态检查
              if (currentRequestId !== requestIdRef.current) return;

              // 追加同城结果
              finalRecommendations.push(...localResult.items);

              // 更新排除列表，防止全局搜索重复拉取
              localResult.items.forEach((item) => excludeIds.push(item.id));
            }

            // Req 2 (全局): 如果同城结果不足 RECOMMEND_LIMIT
            if (finalRecommendations.length < RECOMMEND_LIMIT) {
              const needed = RECOMMEND_LIMIT - finalRecommendations.length;

              const globalResult = await getRecommendedHotels({
                limit: needed, // 仅获取缺失的数量
                strategy: "global_popularity",
                excludeIds, // 传递最新的排除列表
              });

              // 竞态检查
              if (currentRequestId !== requestIdRef.current) return;

              // 追加全局结果
              finalRecommendations.push(...globalResult.items);
            }

            // 更新状态
            setRecommendations(finalRecommendations);
          } catch (recError) {
            console.error("Recommendation fetch failed:", recError);
            // 推荐失败不影响主流程，保持 loading false
          } finally {
            if (currentRequestId === requestIdRef.current) {
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Search failed:", error);
        if (currentRequestId === requestIdRef.current) {
          setError(error instanceof Error ? error : new Error("Search failed"));
          setLoading(false);
        }
      }
    };

    fetchInitialData();
  }, [
    // 依赖项解释：
    // 当 params 中的任何搜索条件变化时，触发重新搜索。
    // 注意：如果 params 对象引用频繁变化但内容不变，可能会导致多余请求。
    // 建议调用方使用 useMemo 或确保 params 对象的稳定性，或者在这里展开基本类型依赖。
    // 为了遵循 "params (SearchHotelsParams)" 的输入要求，我们直接依赖 params。
    params,
    enabled, // 增加 enabled 依赖
  ]);

  // --- 加载更多逻辑 ---
  const loadMore = useCallback(async () => {
    // 仅在 enabled 为 true、normal 模式且有更多数据且不处于加载中时执行
    if (!enabled || resultType !== "normal" || !hasMore || loading) return;

    const currentRequestId = requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const nextParams: SearchHotelsParams = {
        ...params,
        page: nextPage,
        pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
      };

      const res = await searchHotels(nextParams);

      if (currentRequestId !== requestIdRef.current) return;

      if (res.length > 0) {
        setList((prev) => [...prev, ...res]);
        pageRef.current = nextPage;
        const pageSize = params.pageSize || DEFAULT_PAGE_SIZE;
        setHasMore(res.length >= pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more failed:", error);
      setError(error instanceof Error ? error : new Error("Load more failed"));
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [params, resultType, hasMore, loading, enabled]);

  return {
    list,
    recommendations,
    resultType,
    loading,
    hasMore,
    error,
    loadMore,
  };
};

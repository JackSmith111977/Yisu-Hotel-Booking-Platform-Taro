import { useState, useEffect, useCallback, useRef } from "react";

export interface PaginationOptions<T, P> {
  fetcher: (params: P & { page: number; pageSize: number }) => Promise<T[]>;
  params: P;
  pageSize?: number;
  initialPage?: number;
}

export interface PaginationResult<T> {
  list: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}

/**
 * 通用分页 Hook
 * @description 处理列表的分页加载、下拉刷新、参数变化重置等逻辑
 * @template T 列表项类型
 * @template P 查询参数类型（不含 page, pageSize）
 */
export function usePagination<T, P>(
  options: PaginationOptions<T, P>,
): PaginationResult<T> {
  const { fetcher, params, pageSize = 10, initialPage = 1 } = options;

  const [list, setList] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 使用 ref 保持最新的 fetcher 和 params 引用，解决闭包问题
  const fetcherRef = useRef(fetcher);
  const paramsRef = useRef(params);

  // 每次渲染更新 ref
  fetcherRef.current = fetcher;
  paramsRef.current = params;

  // 用于解决竞态条件的请求ID
  const currentRequestRef = useRef(0);

  // 数据加载核心逻辑
  // 使用 useCallback 保证引用稳定，且不依赖外部不稳定的 params 对象
  const loadData = useCallback(
    async (targetPage: number, isRefresh: boolean) => {
      // 立即获取当前的 params 和 fetcher
      const currentParams = paramsRef.current;
      const currentFetcher = fetcherRef.current;

      setLoading(true);
      setError(null);

      // 增加请求计数
      const requestId = ++currentRequestRef.current;

      try {
        const res = await currentFetcher({
          ...currentParams,
          page: targetPage,
          pageSize,
        });

        // 竞态检查
        if (requestId !== currentRequestRef.current) return;

        if (isRefresh) {
          setList(res);
        } else {
          setList((prev) => [...prev, ...res]);
        }

        // 判断是否还有更多数据
        setHasMore(res.length >= pageSize);
      } catch (err) {
        if (requestId !== currentRequestRef.current) return;
        setError(err instanceof Error ? err.message : "加载失败");
        // 如果是刷新失败，清空列表或保持原样？这里选择保持原样但显示错误
        if (isRefresh) {
          setList([]);
        }
      } finally {
        if (requestId === currentRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [pageSize],
  );

  // 当 params 变化时（深度比较），重置并重新加载
  // 注意：这里依赖 JSON.stringify(params) 来触发副作用
  useEffect(() => {
    setPage(initialPage);
    setHasMore(true);
    // setList([]); // 可选：清空列表
    loadData(initialPage, true);
  }, [JSON.stringify(params), initialPage, loadData]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  }, [loading, hasMore, page, loadData]);

  // 刷新
  const refresh = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  // 手动重置
  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    setList([]);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  return {
    list,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}

import {
  HotelSearchItem,
  HotelSearchSort,
  RecommendationStrategy,
  RecommendedHotelsParams,
  RecommendedHotelsResult,
} from "@/types/home/search";
import { callSupabase } from "@/utils/supabase";

export interface SearchParams {
  city?: string;
  keyword?: string;
  checkInDate?: string;
  checkOutDate?: string;
  tags?: string[];
}

// 搜索参数接口
export interface SearchHotelsParams {
  city?: string;
  keyword?: string;
  checkInDate?: string; // 预留，暂不通过 hotels 表过滤
  checkOutDate?: string; // 预留
  sort?: HotelSearchSort;
  page?: number;
  pageSize?: number;
}

/**
 * 规范化城市参数
 * @description 处理“省/市/区”并防御性处理乱码
 */
const normalizeCity = (city?: string): string | null => {
  if (
    !city ||
    city === "全部" ||
    city === "定位中..." ||
    city === "请选择城市"
  ) {
    return null;
  }

  let searchCity = city;
  try {
    searchCity = decodeURIComponent(city);
  } catch {
    // 忽略解码错误，使用原始值
    console.warn("[HotelService] 城市解码错误，使用原始值:", searchCity);
  }

  if (searchCity.includes("/")) {
    const parts = searchCity.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.trim()) {
      searchCity = lastPart.trim();
    }
  }

  return searchCity.trim() || null;
};

/**
 * 规范化关键词
 * @description 统一 trim + decode
 */
const normalizeKeyword = (keyword?: string): string | null => {
  if (!keyword?.trim()) return null;

  let kw = keyword.trim();
  try {
    kw = decodeURIComponent(kw);
  } catch {
    // 忽略解码错误，使用原始值
    console.warn("[HotelService] 关键词解码错误，使用原始值:", kw);
  }

  return kw || null;
};

/**
 * 搜索酒店列表 (聚合起价 + 高级排序)
 * @param params 搜索参数
 * @returns Promise<HotelSearchItem[]>
 */
export const searchHotels = async (
  params: SearchHotelsParams,
): Promise<HotelSearchItem[]> => {
  // 解构并设置默认值
  const {
    city,
    keyword,
    sort = "recommended",
    page = 1,
    pageSize = 10,
  } = params;

  // 安全处理分页参数
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;

  // 规范化城市和关键词
  const normalizedCity = normalizeCity(city);
  const normalizedKeyword = normalizeKeyword(keyword);

  // TODO: 学习 Supabase RPC
  // 构建 RPC 参数
  const rpcParams = {
    city: normalizedCity,
    keyword: normalizedKeyword,
    sort,
    page: safePage,
    page_size: safePageSize,
  };

  // 调用 Supabase RPC
  const { data, error } = await callSupabase({
    action: "rpc",
    rpcName: "search_hotels_with_min_price",
    params: rpcParams,
  });

  if (error) {
    console.error("[HotelService] searchHotels rpc error:", error);
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data as HotelSearchItem[];
};

/**
 * 获取推荐酒店列表
 * @description 基于城市或全局热门策略返回推荐酒店列表
 * @param {RecommendedHotelsParams} params - 推荐请求参数
 * @returns {Promise<RecommendedHotelsResult>} 推荐酒店结果
 */
export const getRecommendedHotels = async (
  params: RecommendedHotelsParams,
): Promise<RecommendedHotelsResult> => {
  // 解构并设置默认值
  const { city, excludeIds = [], limit = 5, strategy } = params;

  // 安全处理 limit 参数
  // isFinite 检查是否为有限数字
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 5;

  // 空值合并运算符 ?? ，当 strategy 为 undefined 或 null 时，才取右侧的值
  const resolvedStrategy: RecommendationStrategy =
    strategy ?? (city ? "same_city_score" : "global_popularity");

  // 根据策略选择排序方式
  const resolvedSort: HotelSearchSort =
    resolvedStrategy === "same_city_score" ? "star_desc" : "recommended";

  // 规范化城市
  const normalizedCity = normalizeCity(city);

  // 扩大 RPC 拉取数量，预留排除过滤后的补足空间
  const pageSize = Math.max(safeLimit + excludeIds.length, safeLimit);

  // 组装 RPC 参数
  const rpcParams = {
    city: resolvedStrategy === "same_city_score" ? normalizeCity : null,
    keyword: null,
    sort: resolvedSort,
    page: 1,
    page_size: pageSize,
  };

  // 调用 RPC
  const { data, error } = await callSupabase({
    action: "rpc",
    rpcName: "search_hotels_with_min_price",
    params: rpcParams,
  });

  // 防御性处理
  if (error || !Array.isArray(data)) {
    return { strategy: resolvedStrategy, items: [] };
  }

  // 过滤已经展示过的酒店
  const filtered = excludeIds.length
    ? data.filter((item: HotelSearchItem) => !excludeIds.includes(item.id))
    : data;

  // 截取需要的数量返回
  return {
    strategy: resolvedStrategy,
    items: filtered.slice(0, safeLimit) as HotelSearchItem[],
  };
};

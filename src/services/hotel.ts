import { HotelSearchItem, HotelSearchSort } from "@/types/home/search";
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

  // TODO: 后端 SQL / RPC 实现
  // 伪代码示意:
  // SELECT h.*, MIN(r.price) AS min_price, AVG(reviews.score) AS review_score
  // FROM hotels h
  // LEFT JOIN room_types r ON r.hotel_id = h.id
  // LEFT JOIN reviews ON reviews.hotel_id = h.id
  // WHERE (region ILIKE %city%) AND (name/address matches keyword)
  // GROUP BY h.id
  // ORDER BY (sort strategy)
  // LIMIT pageSize OFFSET (page-1)*pageSize

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

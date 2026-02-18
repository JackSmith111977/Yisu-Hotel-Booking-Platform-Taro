import { HotelType } from "@/types/home/search";
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
  sort?: "recommended" | "star_desc" | "star_asc";
  page?: number;
  pageSize?: number;
}

/**
 * 搜索酒店列表
 * @param params 搜索参数
 * @returns Promise<HotelType[]>
 */
export const searchHotels = async (
  params: SearchHotelsParams,
): Promise<HotelType[]> => {
  const {
    city,
    keyword,
    sort = "recommended",
    page = 1,
    pageSize = 10,
  } = params;

  // 构建查询参数
  const queryParams: Record<string, any> = {};

  // 1. 状态过滤 (只查有效状态，假设不为 'rejected')
  // queryParams.neq = { status: 'rejected' };

  // 2. 城市/地区筛选
  if (
    city &&
    city !== "全部" &&
    city !== "定位中..." &&
    city !== "请选择城市"
  ) {
    // [优化] 处理 city 参数
    let searchCity = city;
    try {
      searchCity = decodeURIComponent(city);
    } catch (e) {
      console.error("[HotelService] searchHotels decodeURIComponent error:", e);
    }

    // 处理 "省/市/区" 格式，取最后一段作为核心关键词
    if (searchCity.includes("/")) {
      const parts = searchCity.split("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.trim()) {
        searchCity = lastPart.trim();
      }
    }

    queryParams.ilike = {
      ...queryParams.ilike,
      region: `%${searchCity}%`,
    };
  }

  // 3. 关键词搜索 (匹配 中文名 或 英文名 或 地址)
  if (keyword?.trim()) {
    // [修复] 先解码 keyword
    let kw = keyword.trim();
    try {
      kw = decodeURIComponent(kw);
    } catch (e) {
      // 忽略错误，使用原始值
    }

    const conditions: string[] = [];

    // (A) 整词匹配
    conditions.push(`name_zh.ilike.%${kw}%`);
    conditions.push(`name_en.ilike.%${kw}%`);
    conditions.push(`address.ilike.%${kw}%`);

    // (B) 拆字匹配 (仅中文和地址，取前5个字)
    const chars = kw
      .split("")
      .filter((c) => c.trim())
      .slice(0, 5);

    if (chars.length > 0) {
      chars.forEach((char) => {
        conditions.push(`name_zh.ilike.%${char}%`);
        conditions.push(`address.ilike.%${char}%`);
      });
    }

    const uniqueConditions = Array.from(new Set(conditions));
    queryParams.or = `(${uniqueConditions.join(",")})`;
  }

  // 4. 排序逻辑
  let orderStr = "id.desc";
  switch (sort) {
    case "star_desc":
      orderStr = "star_rating.desc,id.desc";
      break;
    case "star_asc":
      orderStr = "star_rating.asc,id.desc";
      break;
    case "recommended":
    default:
      // 默认推荐排序：星级高 -> ID大
      orderStr = "star_rating.desc,id.desc";
      break;
  }
  queryParams.order = orderStr;

  // 5. 分页处理
  const from = (page - 1) * pageSize;
  queryParams.limit = pageSize;
  queryParams.offset = from;

  // 6. 调用云函数
  const { data, error } = await callSupabase({
    action: "table",
    table: "hotels",
    method: "select",
    query: "*", // 获取所有字段
    params: queryParams,
  });

  if (error) {
    console.error("[HotelService] searchHotels error:", error);
    return [];
  }

  return (data as HotelType[]) || [];
};

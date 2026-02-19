import { SearchHotelsParams } from "@/services/hotel";

/**
 * 1. 后端 API 接口参数
 * @description 继承自 service 层定义的 SearchHotelsParams，确保与后端接口保持一致
 */
export interface SearchQueryParams extends SearchHotelsParams {
  // 可以根据需要扩展其他后端支持的参数
  // 例如：priceRange, facilities 等
}

/**
 * 2. 前端 Store 使用的全局状态结构
 * @description 定义搜索相关的核心状态，用于 SearchStore
 */
export interface SearchGlobalParams {
  /** 城市名称，默认 '北京' */
  city: string;
  /** 入住日期，格式 'YYYY-MM-DD' */
  checkInDate: string;
  /** 离店日期，格式 'YYYY-MM-DD' */
  checkOutDate: string;
  /** 搜索关键词 */
  keyword: string;
  /** 筛选标签，如 '亲子', '海景' */
  tags: string[];
  /** 排序方式 */
  sort?: SearchQueryParams["sort"];
}

/**
 * 3. 路由跳转时 URL 携带的参数结构
 * @description 所有字段均为 string 类型，用于 URL 查询字符串
 * @note 数字、布尔值、数组等复杂类型需序列化为字符串
 */
export interface SearchUrlParams {
  city?: string;
  checkInDate?: string;
  checkOutDate?: string;
  keyword?: string;
  /** 标签通常以逗号分隔字符串传递，如 "亲子,海景" */
  tags?: string;
  sort?: string;
  [key: string]: string | undefined;
}

/**
 * 4. 参数映射器工具函数类型
 * @description 定义将 URL 参数转换为全局状态参数的函数签名
 * @param urlParams 从路由获取的 URL 参数对象
 * @returns 转换后的全局状态对象，需处理类型转换（如字符串转数字、逗号分隔转数组）
 */
export type ParamsMapper = (urlParams: SearchUrlParams) => SearchGlobalParams;

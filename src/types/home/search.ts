/**
 * 酒店类型
 * @description 定义酒店在系统中的数据结构
 * @property {number} id - 酒店 ID，数据库为 bigint，JS 中 number 安全范围通常够用，超大数值建议用 string
 * @property {string} name_zh - 酒店名称（中文）
 * @property {string} name_en - 酒店名称（英文）
 * @property {string} address - 酒店地址
 * @property {number} star_rating - 酒店星级（smallint）
 * @property {string} opening_date - 酒店开业日期（date string）
 * @property {string} contact_phone - 酒店联系电话
 * @property {string} image - 酒店主图 URL
 * @property {string} status - 酒店状态（not null, e.g., 'active' | 'rejected' | 'pending'）
 * @property {string} merchant_id - 酒店所属商户 ID（UUID string）
 * @property {string} updated_at - 酒店信息最后更新时间（timestamp with time zone）
 * @property {string} rejected_reason - 酒店拒绝原因（text）
 * @property {string} region - 酒店所在城市/地区（text）
 * @property {string[]} album - 酒店相册 URL 数组（text[]）
 */
export interface HotelType {
  id: number; // 数据库为 bigint，JS 中 number 安全范围通常够用，超大数值建议用 string
  name_zh: string | null;
  name_en: string | null;
  address: string | null;
  star_rating: number | null; // smallint
  opening_date: string | null; // date string
  contact_phone: string | null;
  image: string | null; // 主图 URL
  status: string; // not null, e.g., 'active' | 'rejected' | 'pending'
  merchant_id: string | null;
  updated_at: string | null; // timestamp with time zone
  rejected_reason: string | null;
  region: string | null; // 存储城市/地区信息
  album: string[] | null; // text[]
}

/**
 * 搜索排序枚举
 * @description 用于控制列表排序策略
 */
export type HotelSearchSort =
  | "recommended"
  | "star_desc"
  | "star_asc"
  | "price_asc"
  | "price_desc"
  | "score_desc";

/**
 * 搜索结果列表项
 * @description 在 HotelType 基础上增加聚合字段
 * @property {number|null} min_price - 聚合计算得到的最低起价
 * @property {number|null} review_score - 聚合计算得到的评分
 * @property {string[]|null} tags - 标签集合
 * @property {boolean|null} is_sold_out - 售罄状态
 */
export interface HotelSearchItem extends HotelType {
  min_price: number | null;
  review_score: number | null;
  tags: string[] | null;
  is_sold_out: boolean | null;
}

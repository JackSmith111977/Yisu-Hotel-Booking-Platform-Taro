/**
 * 搜索状态
 * @function 搜索状态接口, 用于存储搜索的状态
 * @property {string} city - 城市名称
 * @property {number} latitude - 纬度
 * @property {number} longitude - 经度
 * @property {string} keyword - 搜索关键词
 * @property {string} checkInDate - 入住日期
 * @property {string} checkOutDate - 退房日期
 * @property {string[]} tags - 标签列表
 * @property {[number, number]} priceRange - 价格范围
 * @property {number} starRating - 星级评分
 */
export interface SearchState {
  /**
   * 城市名称
   * @description 搜索的城市名称
   * @type {string}
   */
  city: string;
  /**
   * 纬度
   * @description 搜索的纬度
   * @type {number}
   */
  latitude?: number;
  /**
   * 经度
   * @description 搜索的经度
   * @type {number}
   */
  longitude?: number;
  /**
   * 搜索关键词
   * @description 搜索的关键词
   * @type {string}
   */
  keyword: string;
  /**
   * 入住日期
   * @description 搜索的入住日期
   * @type {string}
   */
  checkInDate: string;
  /**
   * 退房日期
   * @description 搜索的退房日期
   * @type {string}
   */
  checkOutDate: string;
  /**
   * 标签列表
   * @description 搜索的标签列表
   * @type {string[]}
   */
  tags: string[];
  /**
   * 价格范围
   * @description 搜索的价格范围
   * @type {[number, number]}
   */
  priceRange?: [number, number];
  /**
   * 星级评分
   * @description 搜索的星级评分
   * @type {number}
   */
  starRating?: number;
}

/**
 * 快速标签
 * @description 快速搜索的标签
 * @property {string} id - 标签ID
 * @property {string} label - 标签显示名称
 * @property {string} value - 标签值
 */
export interface QuickTag {
  /**
   * 标签ID
   * @description 快速标签的唯一标识符
   * @type {string}
   */
  id: string;
  /**
   * 标签显示名称
   * @description 快速标签的显示名称
   * @type {string}
   */
  label: string;
  /**
   * 标签值
   * @description 快速标签的搜索值
   * @type {string}
   */
  value: string;
}

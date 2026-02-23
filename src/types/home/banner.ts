/**
 * Banner 实体接口
 * @description 对应云函数 get-home-banners 返回的结构
 * @property {number} id - Banner ID
 * @property {number | null} hotelId - 关联酒店 ID (可能为空)
 * @property {string} title - 标题
 * @property {string} imageUrl - 图片链接
 * @property {string | null} targetUrl - 跳转链接
 */
export interface Banner {
  id: number;
  hotelId: number | null;
  title: string;
  imageUrl: string;
  targetUrl: string | null;
  startDate?: string;
  endDate?: string;
}

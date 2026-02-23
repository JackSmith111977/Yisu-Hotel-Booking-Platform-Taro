import { Banner } from "@/types/home/banner";
import Taro from "@tarojs/taro";

/**
 * 获取首页 Banner 列表
 * @description 调用云函数 get-home-banners 获取当前有效广告 (加权随机)
 * @returns Promise<Banner[]>
 */
export const fetchHomeBanners = async (): Promise<Banner[]> => {
  try {
    const { result } = await Taro.cloud.callFunction({
      name: "get-home-banners",
    });

    const res = result as any;
    if (res && res.code === 200) {
      return (res.data as Banner[]) || [];
    } else {
      console.error("[BannerService] 获取 Banner 失败:", res?.message);
      return [];
    }
  } catch (err) {
    console.error("[BannerService] 网络异常:", err);
    return [];
  }
};

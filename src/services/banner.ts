import { Banner } from "@/types/home/banner";
import { callSupabase } from "@/utils/supabase";

/**
 * 获取首页 Banner 列表
 * @description 调用 RPC 函数 get_home_banners 获取当前有效广告
 * @returns Promise<Banner[]>
 */
export const getHomeBanners = async (): Promise<Banner[]> => {
  try {
    const { data, error } = await callSupabase({
      action: "rpc",
      rpcName: "get_home_banners",
    });

    if (error) {
      console.error("[BannerService] 获取 Banner 失败:", error);
      return [];
    }

    return (data as Banner[]) || [];
  } catch (err) {
    console.error("[BannerService] 网络异常:", err);
    return [];
  }
};

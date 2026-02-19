import Taro from "@tarojs/taro";

/**
 * 调用 Supabase 代理云函数
 */
export const callSupabase = async (payload: {
  action: "table" | "rpc" | "auth_check";
  table?: string;
  method?: "select" | "insert" | "update" | "delete";
  query?: string;
  data?: any;
  params?: any;
  rpcName?: string;
}) => {
  try {
    const res = await Taro.cloud.callFunction({
      name: "supabase-proxy", // 云函数名称
      data: payload,
    });

    const result: any = res.result;
    if (!result.success) {
      let errorMessage = "Unknown error in cloud function";
      if (result.error) {
        if (typeof result.error === "string") {
          errorMessage = result.error;
        } else if (typeof result.error === "object") {
          errorMessage = result.error.message || JSON.stringify(result.error);
        }
      }
      throw new Error(errorMessage);
    }

    return { data: result.data, error: null };
  } catch (err) {
    console.error("Cloud Function Error:", err);
    return { data: null, error: err };
  }
};

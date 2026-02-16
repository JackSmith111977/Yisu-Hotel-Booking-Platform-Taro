// cloudfunctions/supabase-proxy/index.js
const cloud = require("wx-server-sdk");
const axios = require("axios");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 请替换为你的 Supabase 项目信息 (无需 https:// 前缀)
// 例如: 'xyz.supabase.co'
const SUPABASE_HOST = process.env.SUPABASE_HOST;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// 检查配置是否存在，方便调试
if (!SUPABASE_HOST || !SUPABASE_KEY) {
  console.error("严重错误: 缺少 SUPABASE_HOST 或 SUPABASE_KEY 环境变量");
}

const SUPABASE_URL = `https://${SUPABASE_HOST}`;

exports.main = async (event, context) => {
  const { action, table, method, data, query, rpcName, params } = event;
  const wxContext = cloud.getWXContext();

  // 构建通用 Headers
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation", // 让 Supabase 返回插入/更新后的数据
  };

  try {
    // --------------------------------------------------
    // 场景 1: 数据库操作 (Table) -> REST API
    // --------------------------------------------------
    if (action === "table") {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      let response;

      if (method === "select") {
        // 处理查询参数
        const queryParams = new URLSearchParams();
        if (query) queryParams.append("select", query);

        // 简单的等于过滤
        if (params && params.eq) {
          Object.keys(params.eq).forEach((key) => {
            queryParams.append(key, `eq.${params.eq[key]}`);
          });
        }

        response = await axios.get(url, { headers, params: queryParams });
      } else if (method === "insert") {
        response = await axios.post(url, data, { headers });
      } else if (method === "update") {
        // update 需要过滤条件，这里简化处理，假设 params.eq 存在
        const queryParams = new URLSearchParams();
        if (params && params.eq) {
          Object.keys(params.eq).forEach((key) => {
            queryParams.append(key, `eq.${params.eq[key]}`);
          });
        }
        response = await axios.patch(url, data, {
          headers,
          params: queryParams,
        });
      }

      return { success: true, data: response.data };
    }

    // --------------------------------------------------
    // 场景 2: RPC -> REST API
    // --------------------------------------------------
    if (action === "rpc") {
      const url = `${SUPABASE_URL}/rest/v1/rpc/${rpcName}`;
      const response = await axios.post(url, params || {}, { headers });
      return { success: true, data: response.data };
    }

    // --------------------------------------------------
    // 场景 3: Auth Check
    // --------------------------------------------------
    if (action === "auth_check") {
      return { success: true, openId: wxContext.OPENID };
    }

    return { success: false, message: "Unknown action" };
  } catch (err) {
    console.error(
      "Supabase HTTP Error:",
      err.response ? err.response.data : err.message,
    );
    return {
      success: false,
      error: err.response ? err.response.data : err.message || "Unknown Error",
    };
  }
};

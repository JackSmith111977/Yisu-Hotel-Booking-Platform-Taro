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
        // 1. 在这里初始化 queryParams，确保后续逻辑都能访问
        const queryParams = new URLSearchParams();

        // 2. 处理 select 参数
        if (query) queryParams.append("select", query);

        // 3. 处理其他 params
        if (params) {
          const operators = [
            "eq",
            "gt",
            "gte",
            "lt",
            "lte",
            "neq",
            "like",
            "ilike",
            "is",
            "in",
            "match", // 正则匹配
            "fts",
            "plfts",
            "phfts",
            "wfts", // 全文搜索相关
            "cs",
            "cd",
            "ov",
            "sl",
            "sr",
            "nxr",
            "nxl",
            "adj", // 范围/数组操作符
          ];

          operators.forEach((op) => {
            if (params[op]) {
              Object.keys(params[op]).forEach((key) => {
                const val = params[op][key];
                // 支持数组（同一字段多个条件）
                if (Array.isArray(val)) {
                  val.forEach((v) => queryParams.append(key, `${op}.${v}`));
                } else {
                  queryParams.append(key, `${op}.${val}`);
                }
              });
            }
          });

          // 支持特殊参数
          if (params.or) queryParams.append("or", params.or);
          if (params.order) queryParams.append("order", params.order);
          if (params.limit) queryParams.append("limit", params.limit);
          if (params.offset) queryParams.append("offset", params.offset);
        }

        // 4. 发起请求
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

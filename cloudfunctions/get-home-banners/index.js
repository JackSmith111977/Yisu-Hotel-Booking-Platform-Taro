// cloudfunctions/get-home-banners/index.js
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

// Supabase REST API URL for RPC
const RPC_URL = `https://${SUPABASE_HOST}/rest/v1/rpc/get_home_banners`;

/**
 * 加权随机选择函数
 * @param {Array} list 候选列表，每个元素必须包含 weight 属性
 * @param {number} count 需要选择的数量
 * @returns {Array} 选中的元素列表
 */
function weightedRandomSelect(list, count) {
  // 如果列表长度不足，直接返回全部
  if (list.length <= count) {
    return list;
  }

  const selected = [];
  const tempList = [...list]; // 复制一份，避免修改原数组

  for (let i = 0; i < count; i++) {
    // 1. 计算总权重
    const totalWeight = tempList.reduce((sum, item) => sum + item.weight, 0);

    // 2. 生成随机数 [0, totalWeight)
    let random = Math.random() * totalWeight;

    // 3. 寻找命中的元素
    for (let j = 0; j < tempList.length; j++) {
      random -= tempList[j].weight;
      if (random < 0) {
        // 命中！添加到结果集
        selected.push(tempList[j]);
        // 从候选池中移除，避免重复选中
        tempList.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    // 1. 调用 RPC 获取所有活跃 Banner (使用 axios)
    const response = await axios.post(
      RPC_URL,
      {}, // RPC 参数为空对象
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const rawBanners = response.data;

    if (!rawBanners || rawBanners.length === 0) {
      return {
        code: 200,
        data: [],
        message: "No active banners found",
      };
    }

    // 2. 计算权重
    const weightedBanners = rawBanners.map((item) => {
      // 基础分
      const baseScore = item.priority || 100;
      // 质量分 (星级 * 10)
      const qualityScore = (item.hotel_star_rating || 0) * 10;

      return {
        ...item,
        weight: baseScore + qualityScore,
      };
    });

    // 3. 加权随机选择 5 个
    const selectedBanners = weightedRandomSelect(weightedBanners, 5);

    // 4. 格式化返回结果 (映射字段)
    const formattedBanners = selectedBanners.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.image_url,
      targetUrl: item.target_url,
      hotelId: item.hotel_id,
      startDate: item.start_time,
      endDate: item.end_time,
    }));

    return {
      code: 200,
      data: formattedBanners,
      message: "success",
    };
  } catch (err) {
    console.error("Function Error:", err);
    // 处理 axios 错误对象
    const errorMessage = err.response
      ? JSON.stringify(err.response.data)
      : err.message || "Internal Server Error";
    return {
      code: 500,
      data: null,
      message: errorMessage,
    };
  }
};

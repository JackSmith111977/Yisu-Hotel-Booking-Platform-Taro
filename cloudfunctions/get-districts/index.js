const cloud = require("wx-server-sdk");
const axios = require("axios");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const QQ_MAP_KEY = process.env.QQ_MAP_KEY;

exports.main = async (event, context) => {
  try {
    const url = `https://apis.map.qq.com/ws/district/v1/list?key=${QQ_MAP_KEY}`;

    const response = await axios.get(url, {
      headers: {
        Referer: "https://servicewechat.com/",
      },
    });
    const resData = response.data;

    if (resData.status === 0) {
      return {
        code: 0,
        data: resData.result,
      };
    } else {
      return {
        code: resData.status,
        msg: resData.message,
      };
    }
  } catch (err) {
    console.error("云函数获取区县列表请求失败:", err);
    return {
      code: 500,
      msg: "Internal Server Error",
      error: err.message,
    };
  }
};

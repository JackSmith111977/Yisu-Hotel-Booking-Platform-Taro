const cloud = require("wx-server-sdk");
const axios = require("axios");

// TODO: 问这个作用
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const QQ_MAP_KEY = process.env.QQ_MAP_KEY;

exports.main = async (event, context) => {
  const { latitude, longitude } = event;

  if (!latitude || !longitude) {
    return {
      code: 400,
      msg: "请提供经纬度",
    };
  }

  try {
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${QQ_MAP_KEY}&get_poi=0`;

    const response = await axios.get(url, {
      headers: {
        Referer: "https://servicewechat.com/",
      },
    });
    const resData = response.data;

    if (resData.status === 0) {
      const { ad_info, address_components } = resData.result;
      const city = ad_info.city || address_components.city;

      return {
        code: 0,
        data: {
          city,
        },
      };
    } else {
      return {
        code: resData.status,
        msg: resData.message,
      };
    }
  } catch (err) {
    return {
      code: 500,
      msg: "Internal Server Error",
      error: err.message,
    };
  }
};

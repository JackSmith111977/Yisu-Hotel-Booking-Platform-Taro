import Taro from "@tarojs/taro";

// 行政区划单元接口
export interface District {
  id: string; // 行政区划代码
  name?: string; // 名称，例如 "海淀区"
  fullname: string; // 全名
  location?: {
    lat: number;
    lng: number;
  };
  cidx?: [number, number]; // 城市索引范围 [start, end]
  pinyin?: string[]; // 拼音
}

// 定义云函数返回的行政区划数据结构
interface CloudDistrictsResponse {
  code: number;
  data?: District[][]; // API 返回的是二维数组：[省列表, 市列表, 区列表]
  msg?: string;
}

// 定义云函数返回的数据结构
interface CloudCityResponse {
  code: number;
  data?: {
    city: string;
  };
  msg?: string;
}

// 引入缓存 Key 和 接口
const CACHE_KEY_DISTRICTS = "hotel_districts_data";
const CACHE_KEY_GEO_CITY = "hotel_current_city";

interface CachedDistricts {
  data: District[][];
  timestamp: number;
}

interface CachedCity {
  city: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * 计算两点之间的距离（单位：公里），用于判断用户位置是否发生显著变化
 * 使用 Haversine 公式
 * @param lat1 纬度1
 * @param lng1 经度1
 * @param lat2 纬度2
 * @param lng2 经度2
 * @returns 距离（单位：公里）
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // 地球半径，单位公里
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 获取行政区划列表
 * @description 已迁移至云函数 get-districts
 */
export const fetchDistricts = async (): Promise<District[][] | null> => {
  // 检查缓存
  try {
    const cached = Taro.getStorageSync(CACHE_KEY_DISTRICTS) as CachedDistricts;
    const now = Date.now();
    // 缓存有效期 24 小时
    if (cached && cached.data && now - cached.timestamp < 24 * 60 * 60 * 1000) {
      console.log("使用缓存的行政区划数据");
      return cached.data;
    }
  } catch (e) {
    console.warn("读取行政区划缓存失败", e);
  }

  console.log("正在通过云函数请求行政区划...");

  if (!Taro.cloud) {
    console.error("当前环境不支持云开发，无法调用云函数");
    return null;
  }

  try {
    // 调用云函数 get-districts
    const res = await Taro.cloud.callFunction({
      name: "get-districts",
      data: {},
    });

    console.log("云函数 get-districts 响应:", res);

    const result = res.result as CloudDistrictsResponse;

    if (result && result.code === 0 && result.data) {
      console.log("获取行政区划成功，数据长度:", result.data.length);

      // 写入缓存
      try {
        Taro.setStorageSync(CACHE_KEY_DISTRICTS, {
          data: result.data,
          timestamp: Date.now(),
        } as CachedDistricts);
      } catch (e) {
        console.warn("写入行政区划缓存失败", e);
      }

      return result.data;
    } else {
      console.error("云函数返回错误:", result?.msg || "未知错误");
      return null;
    }
  } catch (err) {
    console.error("云函数调用失败:", err);
    return null;
  }
};

/**
 * 调用云函数 get-city-name 逆地理编码
 * @description 云函数方式
 * @param latitude  纬度
 * @param longitude 经度
 * @returns 城市名
 */
export const reverseGeocoder = async (latitude: number, longitude: number) => {
  // 检查缓存
  try {
    const cached = Taro.getStorageSync(CACHE_KEY_GEO_CITY) as CachedCity;
    const now = Date.now();
    // 缓存有效期 1 小时
    if (cached && cached.city && now - cached.timestamp < 60 * 60 * 1000) {
      // 检查距离差异
      const distance = calculateDistance(
        latitude,
        longitude,
        cached.latitude,
        cached.longitude,
      );
      // 如果距离小于 1km，则复用缓存
      if (distance < 1) {
        console.log(
          `使用缓存的城市信息: ${cached.city} (距离差异: ${distance.toFixed(
            2,
          )}km)`,
        );
        return cached.city;
      }
    }
  } catch (e) {
    console.warn("读取逆地理编码缓存失败", e);
  }

  console.log("正在通过云函数请求逆地理编码...", { latitude, longitude });

  if (!Taro.cloud) {
    console.error("当前环境下不支持云开发，无法调用云函数");
    return null;
  }

  try {
    const res = await Taro.cloud.callFunction({
      name: "get-city-name",
      data: {
        latitude,
        longitude,
      },
    });

    console.log("云函数逆地理编码响应:", res);

    const result = res.result as CloudCityResponse;

    if (result && result.code === 0 && result.data && result.data.city) {
      console.log("云函数逆地理编码获取到的城市:", result.data.city);

      // 2. 写入缓存
      try {
        Taro.setStorageSync(CACHE_KEY_GEO_CITY, {
          city: result.data.city,
          latitude,
          longitude,
          timestamp: Date.now(),
        } as CachedCity);
      } catch (e) {
        console.warn("写入逆地理编码缓存失败", e);
      }

      return result.data.city;
    } else {
      console.error("云函数逆地理编码返回错误:", result.msg || "未知错误");
      return null;
    }
  } catch (e) {
    console.error("云函数逆地理编码请求失败:", e);
    return null;
  }
};

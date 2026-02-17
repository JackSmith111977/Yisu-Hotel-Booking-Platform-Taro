import { useCallback, useState } from "react";
import { SearchState } from "../../../types/home/types";
import dayjs from "dayjs";
import Taro from "@tarojs/taro";
import { navigateTo } from "@/utils/router";
import { RoutePath } from "@/constants/route";
import { reverseGeocoder } from "@/utils/map";

/**
 * 获取当前日期
 * @description 获取当前日期的字符串表示，格式为 "YYYY-MM-DD"
 * @returns {string} 当前日期的字符串表示
 */
const getToday = () => dayjs().format("YYYY-MM-DD");

/**
 * 获取明天日期
 * @description 获取明天日期的字符串表示，格式为 "YYYY-MM-DD"
 * @returns {string} 明天日期的字符串表示
 */
const getTomorrow = () => dayjs().add(1, "day").format("YYYY-MM-DD");

/**
 * 首页逻辑钩子
 * @description 提供首页相关的状态管理和逻辑处理
 * @returns {object} 包含搜索状态、设置搜索状态、初始化定位、处理日期确认、处理搜索的方法
 */
export const useHomeLogic = () => {
  // 初始化搜索状态
  const [searchState, setSearchState] = useState<SearchState>({
    city: "定位中...",
    keyword: "",
    checkInDate: getToday(),
    checkOutDate: getTomorrow(),
    tags: [],
  });

  /**
   * 初始化定位
   * @description 调用 Taro.getLocation 获取用户当前位置的经纬度，并将其转换为城市名称
   */
  const initLocation = useCallback(async () => {
    try {
      // 获取经纬度
      const res = await Taro.getLocation({
        type: "wgs84",
      });
      console.log("获取到的经纬度:", res);

      // 调用逆地理编码接口
      const cityName = await reverseGeocoder(res.latitude, res.longitude);

      if (cityName) {
        setSearchState((prev) => ({
          ...prev,
          city: cityName,
          latitude: res.latitude,
          longitude: res.longitude,
        }));
      } else {
        setSearchState((prev) => ({
          ...prev,
          city: "定位失败",
        }));
      }
    } catch (e) {
      console.log("定位失败：", e);
      setSearchState((prev) => ({
        ...prev,
        city: "请选择地区",
      }));

      Taro.showToast({
        title: "定位失败，请手动选择",
        icon: "none",
        duration: 2000,
      });
    }
  }, []);

  /**
   * 处理日期确认
   * @description 当用户确认选择入住日期和退房日期时，更新搜索状态
   * @param {string} start - 入住日期的字符串表示，格式为 "YYYY-MM-DD"
   * @param {string} end - 退房日期的字符串表示，格式为 "YYYY-MM-DD"
   */
  const handleDateConfirm = (start: string, end: string) => {
    setSearchState((prev) => ({
      ...prev,
      checkInDate: start,
      checkOutDate: end,
    }));
  };

  /**
   * 处理搜索
   * @description 当用户点击搜索按钮时，根据搜索状态进行搜索
   */
  const handleSearch = () => {
    const { keyword, checkInDate, checkOutDate, city, tags } = searchState;

    // 基础校验
    if (!city || city === "定位中..." || city === "请选择城市") {
      Taro.showToast({
        title: "请选择城市",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 跳转并携带参数
    navigateTo(RoutePath.SearchList, {
      keyword,
      checkInDate,
      checkOutDate,
      tags: tags.join(","),
      city,
    });
  };

  // 导出状态和方法
  return {
    searchState,
    setSearchState,
    initLocation,
    handleDateConfirm,
    handleSearch,
  };
};

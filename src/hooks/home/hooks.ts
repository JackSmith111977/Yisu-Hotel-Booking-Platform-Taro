import { useCallback } from "react";
import Taro from "@tarojs/taro";
import { navigateTo } from "@/utils/router";
import { RoutePath } from "@/constants/route";
import { reverseGeocoder } from "@/utils/map";
import { useSearchStore } from "@/store/searchStore";

/**
 * 首页逻辑钩子
 * @description 提供首页相关的状态管理和逻辑处理
 * @returns {object} 包含搜索状态、设置搜索状态、初始化定位、处理日期确认、处理搜索的方法
 */
export const useHomeLogic = () => {
  // 引入 useSearchStore
  const { params, setParams, addHistory } = useSearchStore();

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
        setParams({
          city: cityName,
        });
      } else {
        // 定位成功但解析失败，通常不覆盖默认值，或者设置为“定位失败”
        // 这里保持 params 不变或仅提示
        Taro.showToast({
          title: "定位解析失败",
          icon: "none",
        });
      }
    } catch (e) {
      console.log("定位失败：", e);
      // 定位失败不强制覆盖 city，保持默认值 '北京' 或用户已选值
      // 仅提示用户
      Taro.showToast({
        title: "定位失败，请手动选择",
        icon: "none",
        duration: 2000,
      });
    }
  }, [setParams]);

  /**
   * 处理日期确认
   * @description 当用户确认选择入住日期和退房日期时，更新搜索状态
   * @param {string} start - 入住日期的字符串表示，格式为 "YYYY-MM-DD"
   * @param {string} end - 退房日期的字符串表示，格式为 "YYYY-MM-DD"
   */
  const handleDateConfirm = (start: string, end: string) => {
    setParams({
      checkInDate: start,
      checkOutDate: end,
    });
  };

  /**
   * 处理搜索
   * @description 当用户点击搜索按钮时，根据搜索状态进行搜索
   */
  const handleSearch = () => {
    const { keyword, checkInDate, checkOutDate, city, tags } = params;

    // 基础校验
    if (!city || city === "定位中..." || city === "请选择城市") {
      Taro.showToast({
        title: "请选择城市",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 如果有 keyword，调用 addHistory(keyword)
    if (keyword && keyword.trim()) {
      addHistory(keyword);
    }

    // 跳转并携带参数 (将对象转为 URL query string)
    // 注意：tags 数组需要转换为逗号分隔字符串
    navigateTo(RoutePath.SearchList, {
      city,
      keyword,
      checkInDate,
      checkOutDate,
      tags: tags.join(","),
    });
  };

  // 导出状态和方法
  // 保持原有接口兼容，searchState 对应 params, setSearchState 对应 setParams
  return {
    searchState: params,
    setSearchState: setParams,
    initLocation,
    handleDateConfirm,
    handleSearch,
  };
};

import React, { useState, useEffect, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import {
  SearchBar,
  ConfigProvider,
  Calendar,
  Cascader,
  Popup,
} from "@nutui/nutui-react-taro";
import { ArrowLeft, ArrowDown } from "@nutui/icons-react-taro";
import Taro from "@tarojs/taro";
import dayjs from "dayjs";
import { useSearchStore } from "@/store/searchStore";
import { fetchDistricts } from "@/utils/map";
import "./index.scss";

interface SearchHeaderProps {
  keyword?: string; // 保留 props 兼容性，虽然主要依赖 store
  onSearch?: (val: string) => void;
}

// 选项数据接口
interface AddressOption {
  value: string | number;
  text: string;
  children?: AddressOption[];
}

// 原始行政区划数据接口
interface DistrictRawItem {
  id: string | number;
  fullname: string;
  cidx?: [number, number];
}

// 自定义主题
const customTheme = {
  // 搜索框相关
  nutuiSearchbarPadding: "0",
  nutuiSearchbarInputBackground: "#f7f8fa",
  nutuiSearchbarInputHeight: "36px",
  nutuiSearchbarFontSize: "14px",
  nutuiSearchbarInputBorderRadius: "18px",
  // 增加清空按钮大小设置，与 HomeHeader 保持一致
  nutuiSearchbarClearIconSize: "20px",
  nutuiSearchbarClearIconWidth: "32px",
  nutuiSearchbarClearIconHeight: "32px",

  // 地址选择相关 (同步 HomeHeader)
  nutuiPopupTitleFontSize: "16px",
  nutuiTabsTitlesFontSize: "12px",
  nutuiCascaderItemFontSize: "16px",
  nutuiCascaderItemHeight: "40px",
  nutuiCascaderPaneHeight: "400px",
};

/**
 * 将腾讯地图行政区划数据转换为 NutUI Address 组件需要的级联数据
 * @description 复用主页逻辑，保持一致
 */
const convertToTree = (data: DistrictRawItem[][]): AddressOption[] => {
  if (!data || data.length < 2) return [];
  const [provinces, cities, districts] = data;

  return provinces.map((prov) => {
    let cityChildren: AddressOption[] = [];
    if (prov.cidx) {
      const [start, end] = prov.cidx;
      if (cities && start >= 0 && end < cities.length) {
        const citySlice = cities.slice(start, end + 1);

        cityChildren = citySlice.map((city: DistrictRawItem) => {
          // 这里可以根据需求决定是否需要第三级（区县）
          // HomeHeader 中包含了区县，为了保持一致性，这里也加上
          let districtChildren: AddressOption[] = [];
          if (city.cidx && districts) {
            const [dStart, dEnd] = city.cidx;
            if (districts && dStart >= 0 && dEnd < districts.length) {
              const distSlice = districts.slice(dStart, dEnd + 1);
              districtChildren = distSlice.map((dist) => ({
                value: dist.id,
                text: dist.fullname,
              }));
            }
          }

          return {
            value: city.id,
            text: city.fullname,
            children:
              districtChildren.length > 0 ? districtChildren : undefined,
          };
        });
      }
    }
    return {
      value: prov.id,
      text: prov.fullname,
      children: cityChildren.length > 0 ? cityChildren : undefined,
    };
  });
};

const SearchHeader: React.FC<SearchHeaderProps> = ({ onSearch }) => {
  // 1. 数据绑定：从 store 获取数据
  const { params, setParams } = useSearchStore();
  const { city, checkInDate, checkOutDate, keyword } = params;

  // 2. 本地状态
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [cityOptions, setCityOptions] = useState<AddressOption[]>([]);
  // 级联选择器的值，由于 store 只存了 city 名称，这里如果不匹配 id 可能无法回显选中态
  // 简化处理：仅用于展示选项，选中后更新 store
  const [cascaderValue, setCascaderValue] = useState<(string | number)[]>([]);

  // 3. 初始化加载行政区划数据
  useEffect(() => {
    const loadDistricts = async () => {
      const data = await fetchDistricts();
      if (data) {
        const options = convertToTree(data);
        setCityOptions(options);
      }
    };
    loadDistricts();
  }, []);

  // 4. 计算天数
  const nights = useMemo(() => {
    return dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
  }, [checkInDate, checkOutDate]);

  // 5. 交互处理
  const handleBackAction = () => {
    Taro.navigateBack();
  };

  const handleSearchAction = () => {
    if (onSearch) {
      onSearch(keyword);
    }
  };

  const handleKeywordChange = (val: string) => {
    setParams({ keyword: val });
  };

  const handleDateConfirm = (param: unknown) => {
    console.log("SearchHeader Calendar confirm param:", JSON.stringify(param));

    try {
      if (Array.isArray(param) && param.length >= 2) {
        const startItem = param[0];
        const endItem = param[1];

        // 兼容处理：startItem 可能是 string 或 [year, month, day, dateStr, ...]
        // NutUI Calendar 在不同版本或配置下返回格式不同，这里做防御性解析
        const start = Array.isArray(startItem)
          ? String(startItem[3])
          : String(startItem);
        const end = Array.isArray(endItem)
          ? String(endItem[3])
          : String(endItem);

        if (start && end && start !== "undefined" && end !== "undefined") {
          // 格式化日期确保一致性
          const formattedStart = dayjs(start).format("YYYY-MM-DD");
          const formattedEnd = dayjs(end).format("YYYY-MM-DD");

          setParams({
            checkInDate: formattedStart,
            checkOutDate: formattedEnd,
          });
        } else {
          console.warn("SearchHeader 解析出的日期无效:", start, end);
        }
      } else {
        console.warn("SearchHeader 日期参数格式不符合预期:", param);
      }
    } catch (error) {
      console.error("SearchHeader 处理日期确认时发生错误:", error);
    } finally {
      // 无论成功与否都关闭弹窗
      setShowCalendar(false);
    }
  };

  const handleCityChange = (value: (string | number)[], options: any[]) => {
    // 获取选中的选项文本
    if (options && options.length > 0) {
      // 找到层级中的城市节点（通常是第二级，但为了通用性，我们取倒数第二个或根据层级判断）
      // 在 convertToTree 中，结构是 省 -> 市 -> 区
      // 如果选中了区，options 长度为 3；如果只选中市，长度为 2

      // 策略：优先取城市级别的名称。
      // 如果 options 长度 >= 2，则 options[1] 是城市
      let selectedCity = "";

      if (options.length >= 2) {
        selectedCity = options[1].text;
      } else {
        // 兜底：取最后一个
        selectedCity = options[options.length - 1].text;
      }

      setParams({ city: selectedCity });
      setCascaderValue(value);
    }
    setShowCitySelector(false);
  };

  // 格式化日期显示 (MM.DD)
  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format("MM.DD");
  };

  return (
    <View className="search-header-container">
      <ConfigProvider theme={customTheme}>
        {/* 第一行：城市与日期 */}
        <View className="header-row-top">
          {/* 城市选择 */}
          <View
            className="city-selector"
            onClick={() => setShowCitySelector(true)}
          >
            <Text className="city-text">{city || "选择城市"}</Text>
            <ArrowDown size={12} color="#333" />
          </View>

          {/* 日期展示 */}
          <View className="date-display" onClick={() => setShowCalendar(true)}>
            <Text className="date-text">
              {formatDate(checkInDate)} - {formatDate(checkOutDate)}
            </Text>
            <Text className="nights-text">{nights}晚</Text>
            <ArrowDown size={10} color="#999" style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* 第二行：搜索框 */}
        <View className="header-row-bottom">
          {/* 左侧：返回按钮 */}
          <View className="back-icon-wrapper" onClick={handleBackAction}>
            <ArrowLeft size={18} color="#333" />
          </View>

          {/* 中间：搜索框 */}
          <View className="search-bar-wrapper">
            <SearchBar
              value={keyword}
              onChange={handleKeywordChange}
              onSearch={handleSearchAction}
              placeholder="搜索酒店/地名/关键词"
              shape="round"
              clearable
            />
          </View>

          {/* 右侧：搜索按钮 */}
          <View className="search-action-btn" onClick={handleSearchAction}>
            <Text>搜索</Text>
          </View>
        </View>

        {/* 日期选择弹窗 */}
        <Calendar
          visible={showCalendar}
          defaultValue={[checkInDate, checkOutDate]}
          type="range"
          startDate={checkInDate}
          onClose={() => setShowCalendar(false)}
          onConfirm={(param: any) => handleDateConfirm(param)}
        />

        {/* 城市选择弹窗 - 复用 HomeHeader 样式结构 */}
        <Popup
          visible={showCitySelector}
          position="bottom"
          round
          closeable
          onClose={() => setShowCitySelector(false)}
          title="选择城市"
          lockScroll={false}
          destroyOnClose
          style={{ height: "60vh" }}
        >
          <View style={{ height: "100%", width: "100%", overflow: "hidden" }}>
            <Cascader
              visible={showCitySelector}
              options={cityOptions}
              value={cascaderValue}
              title="选择城市"
              closeable={false} // 使用 Popup 的关闭按钮
              onClose={() => setShowCitySelector(false)}
              onChange={handleCityChange}
              popupProps={{
                lockScroll: false,
              }}
            />
          </View>
        </Popup>
      </ConfigProvider>
    </View>
  );
};

export default SearchHeader;

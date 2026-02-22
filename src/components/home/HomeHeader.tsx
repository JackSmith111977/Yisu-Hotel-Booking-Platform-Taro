import { fetchDistricts } from "@/utils/map";
import {
  Cascader,
  ConfigProvider,
  Image,
  Popup,
  SearchBar,
} from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import { useEffect, useState } from "react";

interface Props {
  city: string;
  keyword: string;
  onKeywordChange: (val: string) => void;
  onCitySelected: (city: string) => void;
}

// 定义选项数据的接口，避免使用 any
interface AddressOption {
  value: string | number;
  text: string;
  children?: AddressOption[];
}

// 原始行政区划数据接口 (Tencent Map API)
// 根据 convertToTree 中的使用情况定义
interface DistrictRawItem {
  id: string | number;
  fullname: string;
  cidx?: [number, number]; // 也就是 start, end 索引
}

const addressTheme = {
  nutuiPopupTitleFontSize: "16px", // 弹窗标题字体大小
  nutuiTabsTitlesFontSize: "12px", // 选项卡字体大小
  nutuiCascaderItemFontSize: "16px", // 级联选择器字体大小
  nutuiCascaderItemHeight: "40px", // 级联选择器选项高度
  nutuiCascaderPaneHeight: "400px", // 级联选择器弹窗高度
  // 覆盖 popup 遮罩层默认的阻止滚动行为
  // 注意：ConfigProvider 的 theme 是 CSS 变量映射，不是 props
  // 这种用法其实不对，ConfigProvider 只能改样式变量。
  // 但是 NutUI 有时会读取 context 里的配置。
  // 真正的解法还是在组件 props 上。
};

/**
 * 辅助函数：根据选中的值数组，在选项树中递归查找对应的文本
 * @param values 选中的值数组 (e.g. ["210000", "210200", "210213"])
 * @param options 选项树数据
 */
const findTextsByValues = (
  values: (string | number)[],
  options: AddressOption[],
): string[] => {
  const texts: string[] = [];
  let currentOptions = options;

  for (const val of values) {
    // 使用 loose equality (==) 比较，以兼容 value 是数字而 options 中是字符串的情况（或反之）
    // 这是一个防御性编程习惯，处理后端数据类型不一致的问题
    const found = currentOptions.find((opt: AddressOption) => opt.value == val);

    if (found) {
      texts.push(found.text);
      // 如果有子节点，继续在子节点中查找下一个值
      currentOptions = found.children || [];
    } else {
      // 如果某一层没找到，提前结束（可能是数据不匹配）
      console.warn(
        `[HomeHeader] Warning: Could not find option for value: ${val}`,
      );
      break;
    }
  }
  return texts;
};

/**
 * 将腾讯地图行政区划数据转换为 NutUI Address 组件需要的级联数据
 */
const convertToTree = (data: DistrictRawItem[][]): AddressOption[] => {
  if (!data || data.length < 2) return [];
  const [provinces, cities, districts] = data;

  return provinces.map((prov) => {
    let cityChildren: AddressOption[] = [];
    if (prov.cidx) {
      const [start, end] = prov.cidx;
      // 这里的 cidx 是在 cities 数组中的下标范围
      // 注意防御性编程，防止越界
      if (cities && start >= 0 && end < cities.length) {
        const citySlice = cities.slice(start, end + 1);

        cityChildren = citySlice.map((city: DistrictRawItem) => {
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

// 定义自定义主题变量
const customTheme = {
  nutuiSearchbarPadding: "0",
  nutuiSearchbarInputBackground: "#f7f8fa",
  nutuiSearchbarInputHeight: "48px", // 对应 72rpx (Taro 会处理 px 转 rpx，或者根据项目配置)
  nutuiSearchbarFontSize: "18px",
  nutuiSearchbarInputBorderRadius: "18px", // 高度的一半
  nutuiSearchbarInputPadding: "0 0 0 12px",
  nutuiIconWidth: "16px",
  nutuiIconHeight: "16px",
  nutuiIconLineHeight: "16px",
};

// 3. 定义定位图标的 SVG Base64 (纯黑色通用图标)
const LOCATION_ICON_SRC =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzMzMzMzMyI+PHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==";

/**
 * 首页标题栏组件
 * @description 显示城市选择和搜索框
 */
export const HomeHeader = ({
  city,
  keyword,
  onKeywordChange,
  onCitySelected,
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<AddressOption[]>([
    {
      value: "Beijing",
      text: "北京",
      children: [
        { value: "Chaoyang", text: "朝阳区" },
        { value: "Haidian", text: "海淀区" },
        { value: "Shijingshan", text: "石景山区" },
        { value: "Xicheng", text: "西城区" },
        { value: "Dongcheng", text: "东城区" },
      ],
    },
    {
      value: "Shanghai",
      text: "上海",
      children: [
        { value: "Pudong", text: "浦东新区" },
        { value: "Xuhui", text: "徐汇区" },
        { value: "Jingan", text: "静安区" },
        { value: "Songjiang", text: "松江区" },
        { value: "Yangpu", text: "杨浦区" },
      ],
    },
    {
      value: "Guangdong",
      text: "广东",
      children: [
        { value: "Guangzhou", text: "广州市" },
        { value: "Shenzhen", text: "深圳市" },
        { value: "Foshan", text: "佛山市" },
      ],
    },
  ]);

  // 尝试加载远程数据
  useEffect(() => {
    const loadCityData = async () => {
      try {
        console.log("正在尝试加载腾讯地图行政区划数据...");
        const data = await fetchDistricts();
        console.log("腾讯地图行政区划原始数据:", data);

        if (data) {
          console.time("CityDataConvert");
          const tree = convertToTree(data);
          console.timeEnd("CityDataConvert");

          if (tree.length > 0) {
            console.log("成功加载并转换行政区划数据，覆盖默认数据");
            setOptions(tree);
          }
        }
      } catch (err) {
        console.error("加载行政区划数据失败，回退到静态数据", err);
      }
    };

    // 只有在非开发环境或者明确开启时才加载，避免频繁消耗 API 配额或开发环境报错
    // 这里为了演示默认开启
    loadCityData();
  }, []);

  // 打开城市选择弹窗
  const openAddress = () => {
    setIsVisible(true);
  };
  // 关闭城市选择弹窗
  const closeAddress = () => {
    setIsVisible(false);
  };

  /**
   * 处理地址选择变化
   * @param val 选中的值数组 (e.g. ["210000", "210200", "210213"])
   * @param selectedOptions (可选) 某些版本的组件库可能会作为第二个参数传入选中项对象
   */
  const handleChange = (val: (string | number)[], selectedOptions?: any[]) => {
    console.log("Address onChange value:", val);

    let selectedText = "";

    // 策略 A: 如果组件库直接返回了选中项对象（第二个参数），优先使用它
    if (
      Array.isArray(selectedOptions) &&
      selectedOptions.length > 0 &&
      selectedOptions[0]?.text
    ) {
      selectedText = selectedOptions.map((opt) => opt.text).join("/");
    }
    // 策略 B: 如果只有值数组（当前情况），则手动查找对应的文本
    else if (Array.isArray(val) && val.length > 0) {
      const texts = findTextsByValues(val, options);
      selectedText = texts.join("/");
    }

    console.log("Resolved Selected Text:", selectedText);

    if (selectedText) {
      onCitySelected(selectedText);
    } else {
      console.error(
        "[HomeHeader] Error: Failed to resolve address text from values",
        val,
      );
    }

    closeAddress();
  };

  return (
    <View className="home-header">
      {/* 城市选择 */}
      <View className="location-box" onClick={openAddress}>
        <Image
          className="location-icon"
          src={LOCATION_ICON_SRC}
          style={{
            width: "18px",
            height: "18px",
            marginRight: "4px",
            flexShrink: 0, // 防止被压缩
          }}
        />
        <Text className="city-name">{city}</Text>
      </View>

      {/* 搜索框 */}
      <View className="search-box">
        <ConfigProvider theme={customTheme}>
          <SearchBar
            value={keyword}
            onChange={onKeywordChange}
            placeholder="搜索酒店/地名/关键词"
            shape="round"
          />
        </ConfigProvider>
      </View>
      <ConfigProvider theme={addressTheme}>
        {/* NutUI Cascader 组件 + Popup 手动实现 */}
        <Popup
          visible={isVisible}
          position="bottom"
          round
          closeable
          onClose={closeAddress}
          title="选择城市"
          lockScroll={false} // 👈 关键：解锁背景滚动拦截
          destroyOnClose
          style={{ height: "60vh" }} // 确保弹窗有高度
        >
          <View style={{ height: "100%", width: "100%", overflow: "hidden" }}>
            <Cascader
              visible={isVisible}
              options={options}
              value={[]} // 每次打开重置或传入当前值
              onClose={closeAddress}
              onChange={handleChange}
              title="选择城市"
              closeable={false} // 使用 Popup 的关闭按钮
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

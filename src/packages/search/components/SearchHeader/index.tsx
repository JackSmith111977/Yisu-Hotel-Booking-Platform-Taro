import React, { useState, useEffect, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import { SearchBar, ConfigProvider } from "@nutui/nutui-react-taro";
import { ArrowLeft } from "@nutui/icons-react-taro";
import Taro from "@tarojs/taro";
import "./index.scss";

/**
 * SearchHeader Props 接口定义
 * @description 定义组件输入的参数，确保类型安全
 */
interface SearchHeaderProps {
  /**
   * 搜索关键词初始值
   * @description 用于初始化搜索框内容
   */
  keyword: string;

  /**
   * 搜索触发回调
   * @param newKeyword 用户输入的关键词
   */
  onSearch: (newKeyword: string) => void;

  /**
   * 返回按钮点击回调
   * @description 默认行为是 Taro.navigateBack()
   */
  onBack?: () => void;
}

/**
 * 自定义主题配置
 * @description 覆盖 NutUI SearchBar 的部分默认样式
 */
const customTheme = {
  nutuiSearchbarPadding: "0",
  nutuiSearchbarInputBackground: "#f7f8fa",
  nutuiSearchbarInputHeight: "36px",
  nutuiSearchbarFontSize: "14px",
  nutuiSearchbarInputBorderRadius: "18px",
  nutuiSearchbarInputPadding: "0 0 0 12px",
};

/**
 * 搜索头部组件
 * @description
 * 用于搜索页面的顶部导航栏，包含返回按钮、搜索输入框和搜索确认按钮。
 * 内部维护输入状态，支持受控与非受控模式的混合使用。
 */
const SearchHeader: React.FC<SearchHeaderProps> = ({
  keyword,
  onSearch,
  onBack,
}) => {
  // 内部维护输入框状态
  const [inputValue, setInputValue] = useState(keyword);

  // 监听外部 keyword 变化，同步更新内部状态 (处理外部重置或 URL 参数变化)
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  // 处理输入变化
  const handleChange = useCallback((val: string) => {
    setInputValue(val);
  }, []);

  // 处理搜索触发 (点击右侧按钮或键盘确认)
  const handleSearchAction = useCallback(() => {
    // 这里的 trim() 是为了防止用户输入纯空格
    const trimmedValue = inputValue.trim();
    // 即使是空字符串也允许搜索（代表清除搜索条件），具体业务由父组件决定
    onSearch(trimmedValue);
  }, [inputValue, onSearch]);

  // 处理返回点击
  const handleBackAction = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      // 默认返回上一页
      const pages = Taro.getCurrentPages();
      if (pages.length > 1) {
        Taro.navigateBack();
      } else {
        // 如果没有上一页，通常跳转到首页
        Taro.switchTab({ url: "/pages/index/index" });
      }
    }
  }, [onBack]);

  return (
    <View className="search-header-container">
      {/* 左侧：返回按钮 */}
      <View
        className="back-icon-wrapper"
        onClick={handleBackAction}
        aria-role="button"
        aria-label="返回"
      >
        <ArrowLeft size={18} color="#333" />
      </View>

      {/* 中间：搜索框 */}
      <View className="search-bar-wrapper">
        <ConfigProvider theme={customTheme}>
          <SearchBar
            value={inputValue}
            onChange={handleChange}
            onSearch={handleSearchAction} // 键盘回车触发
            placeholder="搜索酒店/地名/关键词"
            shape="round"
            clearable
            // 去除默认的“取消”文字按钮，使用自定义的“搜索”按钮
          />
        </ConfigProvider>
      </View>

      {/* 右侧：搜索按钮 */}
      <View
        className="search-action-btn"
        onClick={handleSearchAction}
        aria-role="button"
        aria-label="执行搜索"
      >
        <Text>搜索</Text>
      </View>
    </View>
  );
};

// 使用 React.memo 优化性能
export default React.memo(SearchHeader);

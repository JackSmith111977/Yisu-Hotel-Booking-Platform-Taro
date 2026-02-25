import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { ArrowDown, ArrowUp, Filter, Check } from "@nutui/icons-react-taro";
import { HotelSearchSort } from "@/types/home/search";
import "./index.scss";

/**
 * FilterSortBar 组件 Props 定义
 * @description 定义组件所需的输入属性，确保类型安全
 */
interface FilterSortBarProps {
  /** 当前选中的排序方式 */
  currentSort: HotelSearchSort;
  /** 排序改变时的回调函数 */
  onSortChange: (sort: HotelSearchSort) => void;
  /** 当前选中的筛选标签数组 */
  tags: string[];
  /** 标签改变时的回调函数 */
  onTagChange: (tags: string[]) => void;
  /** 打开全筛选面板的回调函数 */
  onOpenFilter: () => void;
  /** 可选的快捷标签列表，从搜索结果中获取 */
  availableTags?: string[];
}

/**
 * 排序选项配置
 */
const SORT_OPTIONS: { label: string; value: HotelSearchSort }[] = [
  { label: "推荐排序", value: "recommended" },
  { label: "价格低到高", value: "price_asc" },
  { label: "价格高到低", value: "price_desc" },
  { label: "评分高到低", value: "score_desc" },
];

/**
 * 筛选排序栏组件
 * @description
 * 酒店列表页顶部的综合筛选工具栏，包含三个部分：
 * 1. 左侧：排序下拉菜单 (Sort Dropdown)
 * 2. 中间：快捷标签 (Quick Chips) - 随机展示 3-5 个来自搜索结果的标签
 * 3. 右侧：全筛选入口 (Full Filter)
 */
const FilterSortBar: React.FC<FilterSortBarProps> = ({
  currentSort,
  onSortChange,
  tags = [], // 提供默认值防止 undefined
  onTagChange,
  onOpenFilter,
  availableTags = [],
}) => {
  // --- State ---
  /** 控制排序下拉菜单的显示/隐藏 */
  const [isSortOpen, setIsSortOpen] = useState(false);

  /**
   * 随机选择的快捷标签
   * 使用 useMemo 确保只在 availableTags 变化时重新计算，避免每次渲染都变
   */
  const quickTags = useMemo(() => {
    if (!availableTags || availableTags.length === 0) {
      return ["免费取消", "无需信用卡", "含早餐"]; // 默认兜底
    }

    // 复制数组以免修改原数组
    const shuffled = [...availableTags].sort(() => 0.5 - Math.random());
    // 取前 4 个作为快捷标签
    return shuffled.slice(0, 4);
  }, [availableTags]);

  // --- Computed ---
  /**
   * 获取当前排序的显示文本
   * @description 根据 currentSort 查找对应的 label，如果没找到则显示默认值
   */
  const currentSortLabel = useMemo(() => {
    const option = SORT_OPTIONS.find((opt) => opt.value === currentSort);
    return option ? option.label : "推荐排序";
  }, [currentSort]);

  /**
   * 计算筛选按钮的样式状态
   * @description 如果有选中的标签，筛选按钮高亮显示
   */
  const filterButtonState = useMemo(() => {
    const hasActiveTags = tags.length > 0;
    return {
      active: hasActiveTags,
      count: tags.length,
    };
  }, [tags]);

  // --- Handlers ---

  /**
   * 切换排序菜单显示状态
   */
  const toggleSortMenu = useCallback(() => {
    setIsSortOpen((prev) => !prev);
  }, []);

  /**
   * 关闭排序菜单
   */
  const closeSortMenu = useCallback(() => {
    setIsSortOpen(false);
  }, []);

  /**
   * 处理排序选项点击
   * @param value 选中的排序值
   */
  const handleSortSelect = useCallback(
    (value: HotelSearchSort) => {
      if (value !== currentSort) {
        onSortChange(value);
      }
      closeSortMenu();
    },
    [currentSort, onSortChange, closeSortMenu],
  );

  /**
   * 处理快捷标签点击
   * @param tag 点击的标签
   */
  const handleTagClick = useCallback(
    (tag: string) => {
      // 这里的逻辑是：如果已存在则移除，如果不存在则添加
      const newTags = tags.includes(tag)
        ? tags.filter((t) => t !== tag)
        : [...tags, tag];
      onTagChange(newTags);
    },
    [tags, onTagChange],
  );

  return (
    <View className="filter-sort-bar">
      {/* 1. 左侧：排序下拉菜单 */}
      <View
        className={`sort-dropdown ${isSortOpen ? "active" : ""}`}
        onClick={toggleSortMenu}
      >
        <Text className="sort-label">{currentSortLabel}</Text>
        <View className="sort-icon">
          {isSortOpen ? (
            <ArrowUp size={14} color={isSortOpen ? "#007aff" : "#333"} />
          ) : (
            <ArrowDown size={14} color="#333" />
          )}
        </View>
      </View>

      {/* 2. 中间：快捷标签 (Scrollable) */}
      <ScrollView className="quick-chips" scrollX showScrollbar={false}>
        <View className="chips-container">
          {quickTags.map((tag) => {
            const isActive = tags.includes(tag);
            return (
              <View
                key={tag}
                className={`chip ${isActive ? "active" : ""}`}
                onClick={() => handleTagClick(tag)}
              >
                <Text className="chip-text">{tag}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 3. 右侧：全筛选入口 */}
      <View
        className={`filter-entry ${filterButtonState.active ? "active" : ""}`}
        onClick={onOpenFilter}
      >
        <Text className="filter-text">筛选</Text>
        <Filter
          size={14}
          color={filterButtonState.active ? "#007aff" : "#333"}
        />
        {/* 数字角标 */}
        {filterButtonState.count > 0 && (
          <View className="badge">
            <Text className="badge-text">
              {filterButtonState.count > 9 ? "9+" : filterButtonState.count}
            </Text>
          </View>
        )}
      </View>

      {/* --- Dropdown Menu Overlay --- */}
      {isSortOpen && (
        <>
          {/* 遮罩层：点击空白处关闭菜单 */}
          <View className="dropdown-mask" onClick={closeSortMenu} />
          {/* 菜单列表 */}
          <View className="dropdown-menu">
            {SORT_OPTIONS.map((option) => (
              <View
                key={option.value}
                className={`menu-item ${
                  currentSort === option.value ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation(); // 防止冒泡触发 toggle
                  handleSortSelect(option.value);
                }}
              >
                <Text className="menu-text">{option.label}</Text>
                {currentSort === option.value && (
                  <Check size={16} color="#007aff" />
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default React.memo(FilterSortBar);

import React, { useCallback, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { HotelSearchSort } from '@/types/home/search';
import './index.scss';

/**
 * FilterSortBar 组件 Props 定义
 * @description 定义组件所需的输入属性，确保类型安全
 */
interface FilterSortBarProps {
  /** 当前选中的排序方式 */
  currentSort: HotelSearchSort;
  /** 排序改变时的回调函数 */
  onSortChange: (sort: HotelSearchSort) => void;
}

/**
 * 排序 Tab 配置项接口
 */
interface SortTabItem {
  key: string;
  label: string;
  /** 对应的排序值，如果是单一排序则直接指定，如果是切换排序则可能包含多个 */
  sortValue?: HotelSearchSort;
  /** 是否是特殊处理的 Tab (如价格需要切换升降序) */
  isToggle?: boolean;
}

/**
 * 筛选排序栏组件
 * @description 
 * 用于酒店列表页顶部的排序筛选工具栏。
 * 支持推荐排序、价格升降序切换、评分排序。
 * 采用防御性编程风格，对 Props 进行类型检查，并使用 React.memo 优化性能。
 */
const FilterSortBar: React.FC<FilterSortBarProps> = ({ 
  currentSort, 
  onSortChange 
}) => {

  /**
   * 处理价格排序点击逻辑
   * @description 
   * 1. 如果当前不是价格排序，默认切换为价格升序 (price_asc)。
   * 2. 如果当前是价格升序，切换为价格降序 (price_desc)。
   * 3. 如果当前是价格降序，切换为价格升序 (price_asc)。
   */
  const handlePriceClick = useCallback(() => {
    if (currentSort === 'price_asc') {
      onSortChange('price_desc');
    } else if (currentSort === 'price_desc') {
      onSortChange('price_asc');
    } else {
      // 默认从低到高
      onSortChange('price_asc');
    }
  }, [currentSort, onSortChange]); // 依赖 currentSort 判断当前状态，依赖 onSortChange 触发回调

  /**
   * 通用 Tab 点击处理
   * @param sortValue 目标排序值
   */
  const handleTabClick = useCallback((sortValue: HotelSearchSort) => {
    // 如果点击的是当前已选中的非切换类 Tab，则不进行操作（避免重复请求）
    if (currentSort === sortValue) return;
    onSortChange(sortValue);
  }, [currentSort, onSortChange]);

  /**
   * 计算价格 Tab 的激活状态
   * @description 使用 useMemo 缓存计算结果，避免不必要的重复计算
   */
  const priceActiveState = useMemo(() => {
    const isPriceActive = currentSort === 'price_asc' || currentSort === 'price_desc';
    return {
      isActive: isPriceActive,
      isAsc: currentSort === 'price_asc',
      isDesc: currentSort === 'price_desc'
    };
  }, [currentSort]);

  return (
    <View className="filter-sort-bar">
      {/* 推荐 Tab */}
      <View 
        className={`sort-tab ${currentSort === 'recommended' ? 'active' : ''}`}
        onClick={() => handleTabClick('recommended')}
      >
        <Text>推荐</Text>
      </View>

      {/* 价格 Tab (特殊处理) */}
      <View 
        className={`sort-tab ${priceActiveState.isActive ? 'active' : ''}`}
        onClick={handlePriceClick}
      >
        <Text>价格</Text>
        <View className="icon-wrapper">
          {/* 上箭头 (升序) */}
          <View 
            className={`sort-icon up ${priceActiveState.isAsc ? 'active' : ''}`} 
          />
          {/* 下箭头 (降序) */}
          <View 
            className={`sort-icon down ${priceActiveState.isDesc ? 'active' : ''}`} 
          />
        </View>
      </View>

      {/* 评分 Tab */}
      <View 
        className={`sort-tab ${currentSort === 'score_desc' ? 'active' : ''}`}
        onClick={() => handleTabClick('score_desc')}
      >
        <Text>评分</Text>
      </View>
    </View>
  );
};

// 使用 React.memo 避免父组件渲染导致的不必要重渲染
export default React.memo(FilterSortBar);

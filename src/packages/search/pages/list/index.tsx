import React, { useCallback, useState, useEffect, useMemo } from "react";
import { View, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { VirtualList } from "@nutui/nutui-react-taro";
import { useSearchStore } from "@/store/searchStore";
import { useSearchList } from "../../hooks/useSearchList";
import { useSearchInitialization } from "../../hooks/useSearchInitialization";
import { HotelSearchItem, HotelSearchSort } from "@/types/home/search";
import HotelListItem from "../../components/HotelListItem";
import SkeletonLoader from "../../components/SkeletonLoader";
import SearchHeader from "../../components/SearchHeader";
import FilterSortBar from "../../components/FilterSortBar";
import EmptyState from "../../components/EmptyState";
import RecommendationDivider from "../../components/RecommendationDivider";
import "./index.scss";

// --- 常量定义 ---

/**
 * 顶部固定区域高度 (px)
 * SearchHeader (52px) + FilterSortBar (44px)
 * @note 如果样式发生变更，需同步更新此常量，或改为动态获取(但在小程序中动态获取会有延迟)
 */
const HEADER_HEIGHT = 52;
const FILTER_HEIGHT = 44;
const FIXED_TOP_HEIGHT = HEADER_HEIGHT + FILTER_HEIGHT;

/**
 * 列表项设计高度 (rpx)
 */
const ITEM_DESIGN_HEIGHT = 256;
const DESIGN_WIDTH = 750;

// --- 类型定义 ---

// 虚拟列表滚动事件结构
interface VirtualListScrollEvent {
  detail?: {
    scrollHeight: number;
    scrollTop: number;
  };
  target?: {
    scrollHeight: number;
    scrollTop: number;
  };
}

// Footer 占位符接口
interface FooterPlaceholder {
  id: string;
  isFooter: true;
}

// 联合类型：列表项可能是酒店数据，也可能是底部的 Loading 条
type VirtualListItem = HotelSearchItem | FooterPlaceholder;

// Footer 组件 Props
interface ListFooterProps {
  loading: boolean;
  hasMore: boolean;
  itemHeight: number; // 动态传入高度
  onLoad: () => void;
}

/**
 * 列表底部加载状态组件
 * @description 负责展示加载中/无更多提示，并在挂载时触发加载更多
 */
const ListFooter: React.FC<ListFooterProps> = ({
  loading,
  hasMore,
  itemHeight,
  onLoad,
}) => {
  // 依赖项解释：
  // loading: 防止重复触发
  // hasMore: 只有还有数据时才触发
  // onLoad: 触发加载的函数
  useEffect(() => {
    if (!loading && hasMore) {
      onLoad();
    }
  }, [loading, hasMore, onLoad]);

  return (
    <View
      style={{
        height: `${itemHeight}px`,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#999",
        fontSize: "12px",
        boxSizing: "border-box",
      }}
    >
      {loading ? "加载中..." : hasMore ? "上拉加载更多" : "没有更多了"}
    </View>
  );
};

/**
 * 酒店搜索结果列表页
 * @description 核心页面，包含搜索、筛选、虚拟列表展示
 */
export default function SearchList() {
  // --- 1. 初始化与状态管理 ---

  // 检查 URL 参数是否已同步到 Store
  const initialized = useSearchInitialization();

  // 全局状态：搜索参数
  const params = useSearchStore((state) => state.params);
  const setParams = useSearchStore((state) => state.setParams);

  // --- 2. 核心：计算容器高度和列表项高度 (Fix P2 Defect) ---

  /**
   * 动态计算布局尺寸
   * @description 同时计算容器高度和列表项高度，确保在不同屏幕尺寸下布局正常
   */
  const calculateLayout = useCallback(() => {
    try {
      const info = Taro.getSystemInfoSync();
      const windowWidth = info.windowWidth;
      const windowHeight = info.windowHeight;

      return {
        // 计算列表项实际像素高度
        itemHeight: (windowWidth / DESIGN_WIDTH) * ITEM_DESIGN_HEIGHT,
        // 计算容器高度
        containerHeight: Math.max(0, windowHeight - FIXED_TOP_HEIGHT),
      };
    } catch (e) {
      console.error("获取系统信息失败", e);
      return { itemHeight: 0, containerHeight: 0 };
    }
  }, []);

  // 状态初始化
  const [layoutInfo, setLayoutInfo] = useState(calculateLayout);
  const { itemHeight, containerHeight } = layoutInfo;

  // 监听窗口大小变化（如旋转屏幕、折叠屏展开），动态更新高度
  useEffect(() => {
    const handleResize = () => {
      setLayoutInfo(calculateLayout());
    };
    Taro.onWindowResize(handleResize);
    return () => {
      Taro.offWindowResize(handleResize);
    };
  }, [calculateLayout]);

  // --- 3. 数据获取 ---

  const {
    list,
    recommendations,
    resultType,
    loading,
    hasMore,
    error,
    loadMore,
  } = useSearchList(params, { enabled: initialized });

  // --- 4. 交互回调 ---

  /**
   * 跳转详情页
   * 依赖项: [] -> 静态路由跳转
   */
  const handleHotelClick = useCallback((hotelId: number) => {
    Taro.navigateTo({
      url: `/packages/hotel/pages/index?id=${hotelId}`,
    });
  }, []);

  /**
   * 搜索关键词更新
   * 依赖项: [setParams] -> Store action 引用稳定
   */
  const handleSearch = useCallback(
    (val: string) => {
      setParams({ keyword: val });
    },
    [setParams],
  );

  /**
   * 排序更新
   * 依赖项: [setParams] -> Store action 引用稳定
   */
  const handleSortChange = useCallback(
    (val: string) => {
      setParams({ sort: val as HotelSearchSort });
    },
    [setParams],
  );

  // --- 5. 虚拟列表数据缓存 ---

  /**
   * 构造 VirtualList 数据源
   * @description 缓存计算结果，避免每次渲染都重新创建数组导致 VirtualList 频繁重绘
   * 依赖项: [list] -> 仅在列表数据真正变化时更新
   */
  const virtualListData = useMemo<VirtualListItem[]>(() => {
    // 如果没有数据，返回空数组，避免不必要的计算
    if (list.length === 0) return [];

    // 构造数据源：列表 + 底部 Loading 条
    return [...list, { id: "footer-placeholder", isFooter: true }];
  }, [list]);

  // --- 6. 虚拟列表渲染逻辑 ---

  /**
   * 列表项渲染函数
   * 依赖项: [handleHotelClick, loading, hasMore, loadMore] -> 涉及交互和状态展示
   */
  const itemRender = useCallback(
    (item: VirtualListItem, index: number) => {
      // 类型守卫：判断是否为 Footer
      if ("isFooter" in item && item.isFooter) {
        return (
          <ListFooter
            key="list-footer"
            loading={loading}
            hasMore={hasMore}
            itemHeight={itemHeight}
            onLoad={loadMore}
          />
        );
      }

      // 渲染酒店卡片
      const hotelItem = item as HotelSearchItem;
      // 这里的 key 使用 hotel.id，避免索引 key 导致的渲染问题
      const uniqueKey = hotelItem.id
        ? `hotel-${hotelItem.id}`
        : `index-${index}`;

      return (
        <View
          style={{
            height: `${itemHeight}px`,
            width: "100%",
            boxSizing: "border-box",
          }}
          key={uniqueKey}
        >
          <HotelListItem hotel={hotelItem} onClick={handleHotelClick} />
        </View>
      );
    },
    [handleHotelClick, loading, hasMore, loadMore, itemHeight],
  );

  /**
   * 虚拟列表滚动监听
   * @description 处理触底加载更多逻辑
   * 依赖项: [containerHeight, loading, hasMore, loadMore] -> 闭包陷阱防御
   */
  const handleVirtualScroll = useCallback(
    (e?: VirtualListScrollEvent) => {
      if (!e) return;
      const scrollDetail = e.detail || e.target;
      if (!scrollDetail) return;

      const { scrollHeight, scrollTop } = scrollDetail;
      // 阈值：提前 3 屏高度触发加载，提升用户体验
      const threshold = itemHeight * 3;

      if (
        scrollHeight - scrollTop - containerHeight < threshold &&
        !loading &&
        hasMore
      ) {
        loadMore();
      }
    },
    [containerHeight, loading, hasMore, loadMore, itemHeight],
  );

  // --- 6. 渲染内容分发 ---

  /**
   * 根据状态渲染不同的列表内容
   */
  const renderListContent = () => {
    // 6.1 初始加载/全屏 Loading
    if (loading && list.length === 0) {
      return <SkeletonLoader count={6} />;
    }

    // 6.2 错误状态
    if (error && !loading && list.length === 0) {
      return (
        <EmptyState
          title="加载失败"
          description={error.message || "网络出了点小差错，请稍后重试"}
        />
      );
    }

    // 6.3 空状态 (无搜索结果)
    if (resultType === "empty" && !loading && !error) {
      // 如果有推荐数据，会在下方渲染推荐列表，这里只显示空提示
      // 如果完全没数据，EmptyState 会占据主要区域
      if (recommendations.length === 0) {
        return (
          <EmptyState
            title="暂无符合条件的酒店"
            description="试试减少筛选条件或更换关键词"
          />
        );
      }
      // 否则走下方的非 normal 渲染逻辑
    }

    // 6.4 正常列表 (VirtualList)
    if (resultType === "normal" && list.length > 0) {
      // virtualListData 已通过 useMemo 缓存
      return (
        <View
          className="list-container virtual-list-wrapper"
          style={{ flex: 1, overflow: "hidden", position: "relative" }}
        >
          {/* VirtualList 必须显式指定 containerHeight */}
          <VirtualList
            list={virtualListData}
            itemRender={itemRender}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            onScroll={handleVirtualScroll}
          />
        </View>
      );
    }

    // 6.5 推荐列表 / 兜底渲染 (非 VirtualList)
    // 当搜索结果较少(mixed)或无结果但有推荐(empty)时
    if (
      resultType === "mixed" ||
      (resultType === "empty" && recommendations.length > 0)
    ) {
      return (
        <ScrollView
          scrollY
          className="search-scroll-view"
          style={{ flex: 1, overflow: "hidden" }} // 确保 ScrollView 撑满剩余空间
        >
          <View className="list-container">
            {/* Mixed 状态：先展示搜索结果 */}
            {resultType === "mixed" &&
              list.map((hotel) => (
                <HotelListItem
                  key={hotel.id}
                  hotel={hotel}
                  onClick={handleHotelClick}
                />
              ))}

            {/* Empty 状态：展示空提示 */}
            {resultType === "empty" && (
              <EmptyState
                title="暂无符合条件的酒店"
                description="为您推荐以下热门酒店"
              />
            )}

            {/* 推荐分割线：仅当有推荐数据时展示 */}
            {recommendations.length > 0 && (
              <RecommendationDivider text="为您推荐" />
            )}

            {/* 推荐列表 */}
            {recommendations.map((hotel) => (
              <HotelListItem
                key={`rec-${hotel.id}`}
                hotel={hotel}
                onClick={handleHotelClick}
              />
            ))}
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  // --- 7. 主布局渲染 ---

  if (!initialized) {
    return (
      <View className="search-list-page">
        <SkeletonLoader count={6} />
      </View>
    );
  }

  return (
    <View className="search-list-page">
      {/* 顶部固定区域 */}
      <SearchHeader
        keyword={params.keyword}
        onSearch={handleSearch}
        onBack={() => Taro.navigateBack()}
      />
      <FilterSortBar
        currentSort={params.sort || "recommended"}
        onSortChange={handleSortChange}
      />

      {/* 列表区域 (flex: 1) */}
      {renderListContent()}
    </View>
  );
}

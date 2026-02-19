import { useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useSearchStore } from "@/store/searchStore";
import { useSearchList } from "../../hooks/useSearchList";
import { useSearchInitialization } from "../../hooks/useSearchInitialization";
import HotelListItem from "../../components/HotelListItem";
import SkeletonLoader from "../../components/SkeletonLoader";
import SearchHeader from "../../components/SearchHeader";
import FilterSortBar from "../../components/FilterSortBar";
import EmptyState from "../../components/EmptyState";
import RecommendationDivider from "../../components/RecommendationDivider";
import "./index.scss";

export default function SearchList() {
  // 1. 初始化状态
  // 从 URL 参数同步到 Store，若未完成则返回 false
  const initialized = useSearchInitialization();

  // 2. 状态管理
  // 从全局 Store 获取搜索参数
  const params = useSearchStore((state) => state.params);
  const setParams = useSearchStore((state) => state.setParams);

  // 3. 数据获取 Hook
  // 传入 Store 中的 params，获取列表数据和状态
  // enabled: initialized -> 只有当初始化完成后，才允许发起请求，避免默认参数触发无效请求
  const {
    list,
    recommendations,
    resultType,
    loading,
    hasMore,
    error,
    loadMore,
  } = useSearchList(params, { enabled: initialized });

  // --- 交互处理 ---

  // 跳转到酒店详情
  const handleHotelClick = useCallback((hotelId: number) => {
    Taro.navigateTo({
      url: `/packages/hotel/pages/index?id=${hotelId}`,
    });
  }, []);

  // 搜索处理
  const handleSearch = useCallback(
    (val: string) => {
      setParams({ keyword: val });
    },
    [setParams],
  );

  // 排序处理
  const handleSortChange = useCallback(
    (val: any) => {
      setParams({ sort: val });
    },
    [setParams],
  );

  // 如果尚未完成初始化，显示骨架屏或 Loading
  if (!initialized) {
    return (
      <View className="search-list-page">
        <SkeletonLoader count={6} />
      </View>
    );
  }

  return (
    <View className="search-list-page">
      {/* 顶部搜索栏 */}
      <SearchHeader
        keyword={params.keyword}
        onSearch={handleSearch}
        onBack={() => Taro.navigateBack()}
      />

      {/* 筛选排序栏 */}
      <FilterSortBar
        currentSort={params.sort || "recommended"}
        onSortChange={handleSortChange}
      />

      {/* 列表容器 */}
      <ScrollView
        scrollY
        className="search-scroll-view"
        onScrollToLower={loadMore}
        lowerThreshold={100}
      >
        <View className="list-container">
          {/* Loading State: 初始加载且列表为空时显示骨架屏 */}
          {loading && list.length === 0 && <SkeletonLoader count={6} />}

          {/* Error State: 初始加载失败 */}
          {error && !loading && list.length === 0 && (
            <EmptyState
              title="加载失败"
              description={error.message || "网络出了点小差错，请稍后重试"}
            />
          )}

          {/* Empty State: 明确无结果时显示空状态 */}
          {resultType === "empty" && !loading && !error && (
            <EmptyState
              title="暂无符合条件的酒店"
              description="试试减少筛选条件或更换关键词"
            />
          )}

          {/* Main List: 精准搜索结果 */}
          {list.map((hotel) => (
            <HotelListItem
              key={hotel.id}
              hotel={hotel}
              onClick={handleHotelClick}
            />
          ))}

          {/* Recommendation: 混合模式或空结果模式下显示推荐 */}
          {resultType !== "normal" && recommendations.length > 0 && (
            <>
              <RecommendationDivider text="为您推荐" />
              {recommendations.map((hotel) => (
                <HotelListItem
                  key={`rec-${hotel.id}`}
                  hotel={hotel}
                  onClick={handleHotelClick}
                />
              ))}
            </>
          )}

          {/* Footer: 加载更多/到底提示 (仅在 normal 模式下展示) */}
          {resultType === "normal" && (
            <View className="list-footer">
              {loading && list.length > 0 && (
                <Text className="loading-text">加载中...</Text>
              )}
              {!hasMore && list.length > 0 && !loading && (
                <Text className="no-more-text">没有更多了</Text>
              )}
              {error && list.length > 0 && !loading && (
                <Text className="error-text" onClick={loadMore}>
                  加载失败，点击重试
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

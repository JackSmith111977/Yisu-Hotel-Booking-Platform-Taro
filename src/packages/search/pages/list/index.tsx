import { useRouteParams } from "@/utils/router";
import { View, Text, ScrollView } from "@tarojs/components";
import { useState, useCallback, useMemo } from "react";
import { searchHotels, SearchHotelsParams } from "@/services/hotel";
import Taro from "@tarojs/taro";
import { HotelSearchItem, HotelSearchSort } from "@/types/home/search";
import HotelListItem from "@/components/list/HotelListItem";
import SkeletonLoader from "../../components/SkeletonLoader";
import SearchHeader from "../../components/SearchHeader";
import FilterSortBar from "../../components/FilterSortBar";
import { usePagination } from "@/hooks/usePagination";
import "./index.scss";

interface PageParams {
  city?: string;
  keyword?: string;
  checkInDate?: string;
  checkOutDate?: string;
  tags?: string;
}

export default function SearchList() {
  const params = useRouteParams<PageParams>();
  const [sort, setSort] = useState<HotelSearchSort>("recommended");

  // 跳转到酒店详情
  const handleHotelClick = useCallback((hotelId: number) => {
    Taro.navigateTo({
      url: `/packages/hotel/pages/index?id=${hotelId}`,
    });
  }, []);

  // 构造搜索参数
  const searchParams = useMemo(() => {
    // 解析 tags: 字符串 "tag1,tag2" -> 数组 ["tag1", "tag2"]
    let parsedTags: string[] | undefined;
    if (params.tags) {
      try {
        const decodedTags = decodeURIComponent(params.tags);
        parsedTags = decodedTags.split(",").filter(Boolean);
      } catch (e) {
        console.warn("Tags parsing failed:", e);
      }
    }

    return {
      city: params.city,
      keyword: params.keyword,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      tags: parsedTags,
      sort,
    };
  }, [params, sort]);

  // 使用分页 Hook
  const {
    list: hotels,
    loading,
    error,
    hasMore,
    loadMore,
  } = usePagination<
    HotelSearchItem,
    Omit<SearchHotelsParams, "page" | "pageSize">
  >({
    fetcher: searchHotels,
    params: searchParams,
    pageSize: 20,
  });

  return (
    <View className="search-list-page">
      {/* 顶部搜索栏 */}
      <SearchHeader
        keyword={params.keyword || ""}
        onSearch={(val) => console.log("New search:", val)}
      />

      {/* 筛选排序栏 */}
      <FilterSortBar currentSort={sort} onSortChange={setSort} />

      <ScrollView
        scrollY
        className="search-scroll-view"
        onScrollToLower={loadMore}
        lowerThreshold={100}
      >
        <View className="list-container">
          {/* 错误提示 */}
          {error && (
            <View className="error-container">
              <Text>{error}</Text>
            </View>
          )}

          {/* 酒店列表 */}
          {hotels.map((hotel) => (
            <HotelListItem
              key={hotel.id}
              hotel={hotel}
              onClick={handleHotelClick}
            />
          ))}

          {/* 加载更多/骨架屏 */}
          {loading && (
            <View className="loading-more">
              {hotels.length === 0 ? (
                <SkeletonLoader count={6} />
              ) : (
                <Text className="loading-text">加载中...</Text>
              )}
            </View>
          )}

          {/* 空状态 / 到底提示 */}
          {!loading &&
            !error &&
            (hotels.length === 0 ? (
              <View className="empty-container">
                <Text>未找到相关酒店</Text>
              </View>
            ) : (
              !hasMore && (
                <View className="no-more-container">
                  <Text>没有更多了</Text>
                </View>
              )
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

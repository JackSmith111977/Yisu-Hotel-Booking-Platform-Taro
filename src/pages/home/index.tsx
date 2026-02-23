import BannerSwiper from "@/components/home/BannerSwiper";
import { DateSelector } from "@/components/home/DateSelector";
import { FilterBar } from "@/components/home/FilterBar";
import { HomeHeader } from "@/components/home/HomeHeader";
import { useHomeLogic } from "@/hooks/home/hooks";
import { useSearchStore } from "@/store/searchStore";
import { Button, Divider } from "@nutui/nutui-react-taro";
import { View } from "@tarojs/components";
import { useEffect } from "react";
import "./index.scss";

export default function Index() {
  // 引入 useSearchStore
  const { params: searchState, setParams: setSearchState } = useSearchStore();

  // 解构出useHomeLogic返回的所有成员
  const {
    initLocation,
    handleDateConfirm,
    handleSearch,
    banners,
    loadingBanners,
  } = useHomeLogic();

  // 初始化定位和云环境
  useEffect(() => {
    initLocation();
  }, [initLocation]);

  return (
    <View className="home-page">
      {/* Banner 区域 */}
      <View className="banner-area">
        {loadingBanners || banners.length > 0 ? (
          <BannerSwiper banners={banners} loading={loadingBanners} />
        ) : (
          <View className="banner-title">易宿-酒店预订平台</View>
        )}
      </View>

      {/* 搜索卡片 */}
      <View className="search-card">
        <HomeHeader
          city={searchState.city}
          keyword={searchState.keyword}
          onKeywordChange={(val) => setSearchState({ keyword: val })}
          onCitySelected={(city) => setSearchState({ city: city })}
        />

        <Divider
          style={{
            color: "#f5f5f5",
            borderColor: "#f5f5f5",
            margin: "16px 0",
          }}
        />

        {/* 日期选择 */}
        <DateSelector
          startDate={searchState.checkInDate}
          endDate={searchState.checkOutDate}
          onConfirm={handleDateConfirm}
        />

        <Divider
          style={{
            color: "#f5f5f5",
            borderColor: "#f5f5f5",
            margin: "16px 0",
          }}
        />

        {/* 筛选栏 */}
        <FilterBar
          selectedTags={searchState.tags}
          onTagToggle={(tagVal) => {
            const newTags = searchState.tags.includes(tagVal)
              ? searchState.tags.filter((t) => t !== tagVal)
              : [...searchState.tags, tagVal];
            setSearchState({ tags: newTags });
          }}
        />

        {/* 搜索按钮 */}
        <Button
          className="search-btn"
          type="primary"
          block
          onClick={handleSearch}
          style={{
            marginTop: "24px",
            borderRadius: "24px",
            height: "48px",
            fontSize: "18px",
            background: "linear-gradient(135deg, #fa2c19 0%, #fa6419 100%)",
            border: "none",
          }}
        >
          开始搜索
        </Button>
      </View>
    </View>
  );
}

import { useEffect, useState } from "react";
import { RoutePath } from "@/constants/route";
import { navigateTo } from "@/utils/router";
import { Button } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { callSupabase } from "@/utils/supabase";
import "./index.scss";


export default function Index() {
  // 解构出useHomeLogic返回的所有成员
  const {
    searchState,
    setSearchState,
    initLocation,
    handleDateConfirm,
    handleSearch,
  } = useHomeLogic();

  // 初始化定位和云环境
  useEffect(() => {
    initLocation();
  }, [initLocation]);

  return (
    <View className='index-page'>
      <View className='header'>
        <Text className='title'>欢迎来到酒店预订平台</Text>
      </View>

      {/* 搜索卡片 */}
      <View className="search-card">
        <HomeHeader
          city={searchState.city}
          keyword={searchState.keyword}
          onKeywordChange={(val) =>
            setSearchState((prev) => ({ ...prev, keyword: val }))
          }
          onCitySelected={(city) =>
            setSearchState((prev) => ({ ...prev, city: city }))
          }
        />

        <Divider
          style={{
            color: "#f5f5f5",
            borderColor: "#f5f5f5",
            margin: "16px 0",
          }}
        />

        <Button type='primary' size='small' onClick={handleFetchHotels}>
          查询 Hotels 表
        </Button>

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
            setSearchState((prev) => ({ ...prev, tags: newTags }));
          }}
        />

      <View className='action-area'>
        <Button type='primary' onClick={handleGoSearch}>
          搜索酒店
        </Button>
      </View>
    </View>
  );
}

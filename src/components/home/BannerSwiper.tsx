import React, { useCallback, useState } from "react";
import { View, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Swiper, ConfigProvider } from "@nutui/nutui-react-taro";
import { Banner } from "@/types/home/banner";
import "./BannerSwiper.scss";

interface BannerSwiperProps {
  /** Banner 数据列表 */
  banners: Banner[];
  /**
   * 是否处于加载状态
   * @default false
   */
  loading?: boolean;
}

/**
 * 首页 Banner 轮播组件
 * @description 展示运营位广告，支持点击跳转至 H5 链接或酒店详情页。
 * 包含骨架屏加载效果，提升用户体验。
 */
const BannerSwiper: React.FC<BannerSwiperProps> = ({
  banners,
  loading = false,
}) => {
  const [current, setCurrent] = useState(0);

  /**
   * 处理 Banner 点击跳转逻辑
   * @param banner 点击的 Banner 对象
   *
   * 依赖项: []
   * 原因: 这是一个纯逻辑函数，不依赖组件内部状态（如 current），且 Taro.navigateTo 是全局 API，因此可以安全地使用空依赖数组，保证函数引用稳定。
   */
  const handleBannerClick = useCallback((banner: Banner) => {
    // 1. 优先跳转指定链接 (如活动页)
    if (banner.targetUrl) {
      Taro.navigateTo({ url: banner.targetUrl });
      return;
    }

    // 2. 跳转酒店详情页
    if (banner.hotelId) {
      Taro.navigateTo({
        url: `/packages/hotel/pages/index?id=${banner.hotelId}`,
      });
    }
  }, []);

  /**
   * 格式化日期显示
   * @param dateStr 日期字符串
   */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 1. 优先处理加载状态：展示骨架屏
  // 此时数据可能尚未到达，为了避免布局抖动和空白，渲染一个占位的骨架屏
  if (loading) {
    return (
      <View className="banner-swiper-container">
        <View className="banner-skeleton" />
      </View>
    );
  }

  // 2. 处理空数据状态
  // 如果加载完成但没有数据，则不渲染任何内容 (或者可以渲染一个默认空状态图)
  if (!banners || banners.length === 0) {
    return null;
  }

  // Swiper 主题定制
  const swiperTheme = {
    nutuiSwiperPaginationItemActiveBackgroundColor: "#fff",
  };

  return (
    <View className="banner-swiper-container">
      <ConfigProvider theme={swiperTheme}>
        <Swiper
          defaultValue={0}
          autoPlay
          loop
          className="banner-swiper"
          height={250} // 显式设置高度，与骨架屏和 CSS 容器高度保持一致
          width="100%"
          onChange={(e) => setCurrent(e.detail.current)}
        >
          {banners.map((item) => (
            <Swiper.Item key={item.id}>
              <View
                className="banner-item"
                onClick={() => handleBannerClick(item)}
              >
                <Image
                  src={item.imageUrl}
                  className="banner-image"
                  mode="aspectFill"
                  lazyLoad
                />

                {/* 广告信息遮罩层 */}
                <View className="banner-info">
                  <View className="banner-title">{item.title}</View>
                  {item.startDate && item.endDate && (
                    <View className="banner-date">
                      活动时间: {formatDate(item.startDate)} -{" "}
                      {formatDate(item.endDate)}
                    </View>
                  )}
                </View>
              </View>
            </Swiper.Item>
          ))}
        </Swiper>

        {/* 自定义进度点指示器 */}
        <View className="banner-indicator">
          {banners.map((_, index) => (
            <View
              key={index}
              className={`indicator-dot ${index === current ? "active" : ""}`}
            />
          ))}
        </View>
      </ConfigProvider>
    </View>
  );
};

export default React.memo(BannerSwiper);

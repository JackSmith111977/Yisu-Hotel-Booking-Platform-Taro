import React, { useCallback, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import { Image } from "@nutui/nutui-react-taro";
import { HotelSearchItem } from "@/types/home/search";
import "./index.scss";

/**
 * 组件属性接口定义
 * @description 遵循防御性编程，明确定义所有输入，避免 any
 */
interface HotelListItemProps {
  /** 酒店数据对象，包含核心信息与聚合状态 */
  hotel: HotelSearchItem;
  /** 点击回调函数，可选 */
  onClick?: (hotelId: number) => void;
  /** 自定义类名，用于外部样式覆盖 */
  className?: string;
}

/**
 * 默认图片占位符
 * @constant
 * @description 当后端未返回图片或加载失败时使用
 */
const DEFAULT_IMAGE = "https://placehold.co/200x200?text=No+Image";

const HotelListItem = ({
  hotel,
  onClick,
  className = "",
}: HotelListItemProps) => {
  // 1. 解构数据，设置默认值，防止 undefined 导致渲染错误
  const {
    id,
    name_zh,
    image,
    star_rating,
    review_score,
    min_price,
    tags,
    address,
    is_sold_out,
  } = hotel;

  /**
   * 处理点击事件
   * @description 仅当 id 存在且 onClick 回调存在时触发
   * @dependency [id, onClick] - 依赖 id 和 onClick，确保回调闭包中获取最新的 props
   */
  const handlePress = useCallback(() => {
    if (onClick && id) {
      onClick(id);
    }
  }, [id, onClick]);

  /**
   * 格式化评分显示
   * @description 将评分数字格式化为 1 位小数的字符串
   * @dependency [review_score] - 仅当评分数值变化时重新计算
   */
  const formattedScore = useMemo(() => {
    // 防御性检查，确保数字有效
    if (typeof review_score === "number" && !Number.isNaN(review_score)) {
      return review_score.toFixed(1);
    }
    return "N/A";
  }, [review_score]);

  /**
   * 渲染价格部分
   * @description 根据售罄状态和价格数值渲染不同的 UI
   * @dependency [is_sold_out, min_price] - 依赖售罄状态和最低价格，任意变化都需要更新 UI
   */
  const renderPrice = useMemo(() => {
    // 优先处理售罄状态
    if (is_sold_out) {
      return <Text className="price-text-sold-out">已售罄</Text>;
    }
    // 价格有效性检查
    if (min_price && min_price > 0) {
      return (
        <View className="price-container">
          <Text className="currency">¥</Text>
          <Text className="amount">{Math.floor(min_price)}</Text>
          <Text className="suffix">起</Text>
        </View>
      );
    }
    // 兜底显示
    return <Text className="price-text unknown">价格待定</Text>;
  }, [is_sold_out, min_price]);

  return (
    <View
      className={`hotel-list-item ${className}`}
      onClick={handlePress}
      ariaRole="button"
      ariaLabel={`${name_zh || "酒店"}, 价格${min_price || "待定"}`}
    >
      {/* 左侧：酒店封面 */}
      <View className="image-wrapper">
        <Image
          className="hotel-image"
          src={image || DEFAULT_IMAGE}
          mode="aspectFill"
          lazyLoad
        />
        {/* 售罄遮罩：绝对定位覆盖在图片上 */}
        {is_sold_out && (
          <View className="sold-out-mask">
            <Text className="mask-text">售罄</Text>
          </View>
        )}
      </View>

      {/* 右侧：内容区域 */}
      <View className="content-wrapper">
        {/* 标题行：名称与星级 */}
        <View className="header-row">
          <Text className="hotel-name" numberOfLines={1}>
            {name_zh || "未知酒店"}
          </Text>
          {/* 星级展示：仅当星级大于 0 时显示 */}
          {star_rating && star_rating > 0 && (
            <Text className="star-rating">{star_rating}星级</Text>
          )}
        </View>

        {/* 评分与评价：突出显示评分 */}
        <View className="score-row">
          <Text className="score-value">{formattedScore}</Text>
          <Text className="score-label">分</Text>
        </View>

        {/* 地址/位置信息：单行截断 */}
        <View className="location-row">
          <Text className="address-text" numberOfLines={1}>
            {address || "暂无地址信息"}
          </Text>
        </View>

        {/* 标签行：最多显示 3 个标签，超出隐藏 */}
        {tags && tags.length > 0 && (
          <View className="tags-row">
            {tags.slice(0, 3).map((tag, index) => (
              <View key={`${id}-tag-${index}`} className="tag-item">
                <Text className="tag-text">{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 底部价格行：右对齐 */}
        <View className="footer-row">{renderPrice}</View>
      </View>
    </View>
  );
};

// 使用 React.memo 优化性能，仅当 props 深度变化时重新渲染
export default React.memo(HotelListItem);

import React from "react";
import { View, Text } from "@tarojs/components";
import { Image } from "@nutui/nutui-react-taro";
import "./index.scss";

/**
 * EmptyState 组件属性接口
 * @description 定义空状态组件的配置项
 */
interface EmptyStateProps {
  /** 
   * 提示标题 
   * @default "暂无相关酒店"
   */
  title?: string;
  /** 
   * 提示副标题/描述 
   * @default "换个关键词试试~"
   */
  description?: string;
  /** 
   * 空状态图片 URL 
   * @default 占位图
   */
  imageUrl?: string;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 默认空状态图 (使用占位图)
 */
const DEFAULT_EMPTY_IMAGE = "https://placehold.co/150x150?text=No+Data";

/**
 * 空状态组件
 * @description 
 * 用于展示列表为空、加载失败或无数据等场景。
 * 样式已抽离至 index.scss，支持自定义文案和图片。
 */
const EmptyState = ({
  title = "暂无相关酒店",
  description = "换个关键词试试~",
  imageUrl = DEFAULT_EMPTY_IMAGE,
  className = "",
}: EmptyStateProps) => {
  return (
    <View className={`empty-state ${className}`}>
      <Image
        className="empty-image"
        src={imageUrl}
        mode="aspectFit"
      />
      <Text className="empty-title">
        {title}
      </Text>
      <Text className="empty-desc">
        {description}
      </Text>
    </View>
  );
};

// 使用 React.memo 优化性能，仅当 props 变化时重新渲染
export default React.memo(EmptyState);

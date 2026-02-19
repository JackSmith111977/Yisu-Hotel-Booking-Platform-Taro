import React from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

/**
 * 组件属性接口定义
 * @description 定义分割线组件的输入属性
 */
interface RecommendationDividerProps {
  /** 
   * 分割线文本
   * @default "猜你喜欢" 
   */
  text?: string;
  /** 
   * 自定义类名
   */
  className?: string;
}

/**
 * 推荐分割线组件
 * @description 
 * 用于在列表中分隔不同内容的区域，通常用于展示"猜你喜欢"等提示。
 * 样式已抽离至 index.scss，使用伪元素实现线条效果。
 */
const RecommendationDivider = ({
  text = "猜你喜欢",
  className = "",
}: RecommendationDividerProps) => {
  return (
    <View className={`recommendation-divider ${className}`}>
      <Text className="divider-text">{text}</Text>
    </View>
  );
};

// 使用 React.memo 优化性能，仅当 props 变化时重新渲染
export default React.memo(RecommendationDivider);

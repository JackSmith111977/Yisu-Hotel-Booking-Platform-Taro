import React from 'react';
import { View } from '@tarojs/components';
import './index.scss';

/**
 * SkeletonLoader Props 接口定义
 * @description 定义组件输入的参数，确保类型安全
 */
interface SkeletonLoaderProps {
  /** 
   * 需要展示的骨架屏数量 
   * @default 4 
   */
  count?: number;
}

/**
 * 酒店列表骨架屏组件
 * @description 
 * 用于在酒店列表加载过程中展示占位效果。
 * 纯 CSS 实现扫光动画，无额外资源依赖。
 * 布局结构模仿 HotelListItem，保证平滑过渡。
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 4 }) => {
  // 生成对应数量的数组用于循环渲染
  const items = Array.from({ length: count });

  return (
    <View className="skeleton-loader">
      {items.map((_, index) => (
        <View key={`skeleton-${index}`} className="skeleton-item">
          {/* 左侧：图片占位 */}
          <View className="skeleton-image skeleton-anim" />
          
          {/* 右侧：内容占位 */}
          <View className="skeleton-content">
            {/* 标题栏 */}
            <View className="skeleton-title skeleton-anim" />
            
            {/* 评分栏 */}
            <View className="skeleton-score skeleton-anim" />
            
            {/* 价格栏 (marginTop: auto) */}
            <View className="skeleton-price skeleton-anim" />
          </View>
        </View>
      ))}
    </View>
  );
};

// 使用 React.memo 优化性能，仅当 count 变化时重新渲染
export default React.memo(SkeletonLoader);

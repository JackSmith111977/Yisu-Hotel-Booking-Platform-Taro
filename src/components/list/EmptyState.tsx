import { Image } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import React from "react";

interface EmptyStateProps {
  /** 提示标题 */
  title?: string;
  /** 提示副标题/描述 */
  description?: string;
  /** 空状态图片 URL */
  imageUrl?: string;
}

/**
 * 默认空状态图 (使用占位图)
 */
const DEFAULT_EMPTY_IMAGE = "https://placehold.co/150x150?text=No+Data";

const EmptyState = ({
  title = "暂无相关酒店",
  description = "换个关键词试试~",
  imageUrl = DEFAULT_EMPTY_IMAGE,
}: EmptyStateProps) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <Image
        src={imageUrl}
        style={{
          width: "120px",
          height: "120px",
          marginBottom: "16px",
        }}
        mode="aspectFit"
      />
      <Text
        style={{
          fontSize: "16px",
          color: "#333",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: "#999",
          textAlign: "center",
        }}
      >
        {description}
      </Text>
    </View>
  );
};

export default React.memo(EmptyState);

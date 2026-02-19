import { Text, View } from "@tarojs/components";
import React from "react";

interface RecommendationDividerProps {
  /** 分割线文本，默认为 "猜你喜欢" */
  text?: string;
}

const RecommendationDivider = ({
  text = "猜你喜欢",
}: RecommendationDividerProps) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 0",
        opacity: 0.6,
      }}
    >
      {/* 左横线 */}
      <View
        style={{
          width: "40px",
          height: "1px",
          backgroundColor: "#ccc",
          marginRight: "10px",
        }}
      />
      {/* 文本 */}
      <Text
        style={{
          fontSize: "14px",
          color: "#666",
        }}
      >
        {text}
      </Text>
      {/* 右横线 */}
      <View
        style={{
          width: "40px",
          height: "1px",
          backgroundColor: "#ccc",
          marginLeft: "10px",
        }}
      />
    </View>
  );
};

export default React.memo(RecommendationDivider);

import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { Popup, Button, ConfigProvider } from "@nutui/nutui-react-taro";
import { useTagStore } from "@/store/tagStore";
import { useSearchStore } from "@/store/searchStore";
import { useShallow } from "zustand/react/shallow";
import "./index.scss";

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  totalCount?: number;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ visible, onClose }) => {
  // --- Global State ---
  const { tags, fetchTags } = useTagStore(
    useShallow((state) => ({
      tags: state.tags,
      fetchTags: state.fetchTags,
    })),
  );

  const groupedTags = useMemo(() => {
    const grouped: Record<string, typeof tags> = {};
    tags.forEach((tag) => {
      const { category } = tag;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(tag);
    });
    return grouped;
  }, [tags]);

  const { params, setParams } = useSearchStore(
    useShallow((state) => ({
      params: state.params,
      setParams: state.setParams,
    })),
  );

  // --- Local State ---
  // 临时存储选中的标签，仅在点击“确定”时提交到 Store
  const [tempTags, setTempTags] = useState<string[]>([]);

  // --- Effects ---
  // 1. 初始化加载标签数据
  useEffect(() => {
    // 仅在标签为空时加载，避免重复请求
    if (tags.length === 0) {
      fetchTags();
    }
  }, [tags.length, fetchTags]);

  // 2. 当 Drawer 打开时，同步 Store 中的 tags 到本地 tempTags
  useEffect(() => {
    if (visible) {
      setTempTags(params.tags || []);
    }
  }, [visible, params.tags]);

  // --- Handlers ---

  /**
   * 处理标签点击
   * @param tagName 标签名称
   */
  const handleTagClick = (tagName: string) => {
    setTempTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    setTempTags([]);
  };

  /**
   * 确认筛选
   */
  const handleConfirm = () => {
    setParams({ tags: tempTags });
    onClose();
  };

  const theme = {
    nutuiButtonDefaultFontSize: "18px",
    nutuiButtonDefaultHeight: "48px",
    nutuiButtonDefaultBorderRadius: "24px",
  };

  const customStyle = {
    "--filter-header-font-size": "20px",
    "--filter-group-font-size": "16px",
    "--filter-tag-font-size": "14px",
    height: "100%",
  } as React.CSSProperties;

  return (
    <Popup
      visible={visible}
      position="right"
      style={{ width: "85%", height: "100%" }}
      onClose={onClose}
      className="filter-drawer-popup"
    >
      <ConfigProvider theme={theme} style={customStyle}>
        <View className="filter-drawer-container">
          {/* 1. 顶部标题 (可选) */}
          <View className="drawer-header">
            <Text className="header-title">筛选</Text>
          </View>

          {/* 2. 中间滚动区域：标签分组 */}
          <ScrollView className="drawer-content" scrollY>
            {Object.entries(groupedTags).map(([category, tags]) => (
              <View key={category} className="filter-group">
                <Text className="group-title">{category}</Text>
                <View className="tags-wrapper">
                  {tags.map((tag) => {
                    const isActive = tempTags.includes(tag.name);
                    return (
                      <View
                        key={tag.id}
                        className={`filter-tag ${isActive ? "active" : ""}`}
                        onClick={() => handleTagClick(tag.name)}
                      >
                        <Text className="tag-text">{tag.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            {/* 底部留白，防止被按钮遮挡 */}
            <View className="content-padding-bottom" />
          </ScrollView>

          {/* 3. 底部操作栏 */}
          <View className="drawer-footer">
            <Button
              className="reset-btn"
              type="default"
              fill="outline"
              onClick={handleReset}
            >
              重置
            </Button>
            <Button
              className="confirm-btn"
              type="primary"
              onClick={handleConfirm}
            >
              确定
            </Button>
          </View>
        </View>
      </ConfigProvider>
    </Popup>
  );
};

export default React.memo(FilterDrawer);

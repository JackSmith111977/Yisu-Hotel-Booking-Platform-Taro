// src/components/home/FilterBar.tsx

import {
  Button,
  ConfigProvider,
  Popup,
  Tag as NutTag,
} from "@nutui/nutui-react-taro";
import { ScrollView, Text, View } from "@tarojs/components";
import { useState, useEffect } from "react";
import { useTagStore } from "@/store/tagStore";

interface Props {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

// 定义一组主色调
const MAIN_COLORS = [
  "#1989fa", // 蓝
  "#ffb400", // 黄
  "#07c160", // 绿
  "#fa2c19", // 红
  "#7232dd", // 紫
];

const addTagTheme = {
  nutuiTagBackgroundColor: "#ffffff",
  nutuiTagColor: "#1989fa",
  nutuiTagBorderColor: "#1989fa",
  nutuiTagPadding: "8px 12px",
  nutuiTagFontSize: "12px",
  nutuiTagBorderRadius: "8px",
};

const popupBtnTheme = {
  nutuiButtonDefaultFontSize: "18px",
  nutuiButtonDefaultHeight: "36px",
  nutuiButtonDefaultLineHeight: "36px",
  nutuiButtonDefaultBorderRadius: "8px",
};

export const FilterBar = ({ selectedTags, onTagToggle }: Props) => {
  // 从 Store 获取标签数据
  const { tags, fetchTags } = useTagStore();

  // 控制弹窗显示
  const [showPopup, setShowPopup] = useState(false);
  // 首页“展示池”：用户决定放在外面的标签
  // 初始为空，或者你可以根据业务需求预设一些
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  // 弹窗内的“临时选中状态”：决定哪些标签要添加到首页
  const [tempVisibleTags, setTempVisibleTags] = useState<string[]>([]);

  // 组件挂载时获取标签数据
  useEffect(() => {
    if (tags.length === 0) {
      fetchTags();
    }
  }, [fetchTags, tags.length]);

  // 当标签数据加载完成后，初始化 visibleTags（如果为空）
  useEffect(() => {
    if (tags.length > 0 && visibleTags.length === 0) {
      // 默认展示前 8 个标签
      const defaultVisible = tags.slice(0, 8).map((t) => t.name);
      setVisibleTags(defaultVisible);
    }
  }, [tags, visibleTags.length]);

  // 打开弹窗时，初始化临时状态
  const handleOpenPopup = () => {
    setTempVisibleTags([...visibleTags]); // 复制当前展示的标签
    setShowPopup(true);
  };

  // 弹窗内：切换标签（仅影响是否添加到首页，不影响筛选）
  const toggleTempTag = (val: string) => {
    setTempVisibleTags((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val],
    );
  };

  // 弹窗内：确认添加
  const handleConfirm = () => {
    setVisibleTags(tempVisibleTags);
    setShowPopup(false);
  };

  // 辅助函数：获取标签样式
  const getTagTheme = (isActive: boolean, index: number) => {
    const mainColor = MAIN_COLORS[index % MAIN_COLORS.length];
    return isActive
      ? {
          nutuiTagBackgroundColor: mainColor,
          nutuiTagColor: "#ffffff",
          nutuiTagBorderColor: mainColor,
          nutuiTagPadding: "10px 20px", // 增大内边距
          nutuiTagFontSize: "16px", // 增大字体
          nutuiTagBorderRadius: "8px",
        }
      : {
          nutuiTagBackgroundColor: "#ffffff",
          nutuiTagColor: mainColor,
          nutuiTagBorderColor: mainColor,
          nutuiTagPadding: "10px 20px", // 增大内边距
          nutuiTagFontSize: "16px", // 增大字体
          nutuiTagBorderRadius: "8px",
        };
  };
  return (
    <View className="filter-bar">
      <Text className="section-title">快捷筛选</Text>

      <ScrollView scrollX className="tags-scroll" showScrollbar={false}>
        <View
          className="tags-container"
          style={{ display: "flex", alignItems: "center" }}
        >
          {/* 1. 添加按钮 (始终存在) */}
          <View
            onClick={handleOpenPopup}
            style={{ marginRight: "10px", display: "inline-block" }}
          >
            <ConfigProvider theme={addTagTheme}>
              <NutTag
                plain
                round
                style={{ border: "1px dashed #999", color: "#666" }}
              >
                {visibleTags.length > 0 ? "+" : "+ 添加标签"}
              </NutTag>
            </ConfigProvider>
          </View>

          {/* 2. 已添加到首页的标签 (点击触发筛选) */}
          {visibleTags.map((tagName) => {
            const tagObj = tags.find((t) => t.name === tagName);
            if (!tagObj) return null;

            // 这里判断是否被“筛选选中”，决定样式
            const isSelected = selectedTags.includes(tagName);
            const index = tags.findIndex((t) => t.name === tagName);
            const theme = getTagTheme(isSelected, index);

            return (
              <ConfigProvider theme={theme} key={tagName}>
                <View
                  onClick={() => onTagToggle(tagName)}
                  style={{ display: "inline-block", marginRight: "10px" }}
                >
                  <NutTag
                    type="default"
                    plain={false}
                    round
                    style={{ border: `1px solid ${theme.nutuiTagBorderColor}` }}
                  >
                    {tagObj.name}
                  </NutTag>
                </View>
              </ConfigProvider>
            );
          })}
        </View>
      </ScrollView>

      {/* 3. 标签选择弹窗 */}
      <Popup
        visible={showPopup}
        style={{ height: "50%" }}
        position="bottom"
        onClose={() => setShowPopup(false)}
        round
      >
        <View
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* 标题 */}
          <View
            style={{
              padding: "16px",
              textAlign: "center",
              borderBottom: "1px solid #eee",
              fontWeight: "bold",
              fontSize: "18px", // 增大标题字体
            }}
          >
            添加到首页
          </View>

          {/* 内容区域：所有标签 */}
          <ScrollView scrollY style={{ flex: 1, padding: "16px" }}>
            <View style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {tags.map((tag, index) => {
                // 判断是否在“临时展示池”中
                const isSelectedInPopup = tempVisibleTags.includes(tag.name);
                const theme = getTagTheme(isSelectedInPopup, index);

                return (
                  <ConfigProvider theme={theme} key={tag.id}>
                    <View
                      onClick={() => toggleTempTag(tag.name)}
                      style={{
                        display: "inline-block",
                      }}
                    >
                      <NutTag
                        type="default"
                        plain={!isSelectedInPopup} // 选中时实心，未选中时空心
                        round
                        style={{
                          border: `1px solid ${theme.nutuiTagBorderColor}`,
                        }}
                      >
                        {tag.name}
                      </NutTag>
                    </View>
                  </ConfigProvider>
                );
              })}
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <ConfigProvider theme={popupBtnTheme}>
            <View
              style={{
                padding: "16px",
                display: "flex",
                gap: "16px",
                borderTop: "1px solid #eee",
              }}
            >
              <Button
                block
                type="default"
                onClick={() => setShowPopup(false)}
                style={{ flex: 1 }}
              >
                取消
              </Button>
              <Button
                block
                type="primary"
                onClick={handleConfirm}
                style={{ flex: 1 }}
              >
                确认
              </Button>
            </View>
          </ConfigProvider>
        </View>
      </Popup>
    </View>
  );
};

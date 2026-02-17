import { Calendar } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import { useState } from "react";

// 参数接口
interface Props {
  startDate: string;
  endDate: string;
  onConfirm: (startDate: string, endDate: string) => void;
}

export const DateSelector = ({ startDate, endDate, onConfirm }: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  // 打开/关闭日历
  const openCalendar = (e?: any) => {
    // 阻止事件冒泡，防止意外触发
    e?.stopPropagation?.();
    setIsVisible(true);
  };

  const closeCalendar = () => {
    console.log("Closing calendar...");
    setIsVisible(false);
  };

  // 处理确认选择
  const handleConfirm = (param: unknown) => {
    console.log("Calendar confirm param:", JSON.stringify(param));

    try {
      if (Array.isArray(param) && param.length >= 2) {
        const startItem = param[0];
        const endItem = param[1];

        // 兼容处理：startItem 可能是 string 或 [year, month, day, dateStr, ...]
        const start = Array.isArray(startItem)
          ? String(startItem[3])
          : String(startItem);
        const end = Array.isArray(endItem)
          ? String(endItem[3])
          : String(endItem);

        if (start && end && start !== "undefined" && end !== "undefined") {
          onConfirm(start, end);
        } else {
          console.warn("解析出的日期无效:", start, end);
        }
      } else {
        console.warn("日期参数格式不符合预期 (非数组或长度不足):", param);
      }
    } catch (error) {
      console.error("处理日期确认时发生错误:", error);
    } finally {
      // 无论如何都要关闭日历
      // 延迟一点关闭，确保 UI 响应
      setTimeout(() => {
        closeCalendar();
      }, 0);
    }
  };

  return (
    // 移除了最外层的 onClick，防止点击 Calendar 遮罩层时透传到这里
    <View className="date-selector-card">
      {/* 专门的点击区域 */}
      <View
        className="date-trigger-area"
        onClick={openCalendar}
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View className="date-item">
          <Text className="label">入住</Text>
          <Text className="value">{startDate}</Text>
        </View>
        <View className="divider">-</View>
        <View className="date-item">
          <Text className="label">离店</Text>
          <Text className="value">{endDate}</Text>
        </View>
      </View>

      <Calendar
        visible={isVisible}
        defaultValue={[startDate, endDate]}
        type="range"
        startDate={startDate}
        onClose={closeCalendar}
        onConfirm={handleConfirm}
      />
    </View>
  );
};

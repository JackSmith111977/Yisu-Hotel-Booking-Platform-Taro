import "./index.scss";
import useCounterStore from "@/store/counterStore";
import { Button, Cell, CellGroup } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";

export default function Index() {
  const count = useCounterStore((state) => state.count);
  const increase = useCounterStore((state) => state.increase);
  const decrease = useCounterStore((state) => state.decrease);
  const reset = useCounterStore((state) => state.reset);

  return (
    <View className="index-page">
      {/* 展示区域 */}
      <CellGroup className="counter-group">
        <Cell>
          <View className="counter-cell-content">
            <Text className="label">当前计数:</Text>
            <Text className="value">{count}</Text>
          </View>
        </Cell>
      </CellGroup>

      {/* 操作区域 */}
      <View className="action-area">
        <Button type="primary" onClick={increase} size="large">
          增加
        </Button>
        <Button type="warning" onClick={decrease} size="large">
          减少
        </Button>
        <Button type="danger" onClick={reset} size="large">
          重置
        </Button>
      </View>
    </View>
  );
}

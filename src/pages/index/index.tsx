import "./index.scss";
import useCounterStore from "@/store/counterStore";
import { Button, Cell, CellGroup } from "@nutui/nutui-react-taro";
import { View } from "@tarojs/components";

export default function Index() {
  const count = useCounterStore((state) => state.count);
  const increase = useCounterStore((state) => state.increase);
  const decrease = useCounterStore((state) => state.decrease);
  const reset = useCounterStore((state) => state.reset);

  return (
    <View className="index-page" style={{ padding: "20px" }}>
      {/* 展示区域 */}
      <CellGroup title="计数器演示">
        <Cell
          title="当前计数"
          extra={
            <span style={{ color: "red", fontWeight: "bold" }}>{count}</span>
          }
        />
      </CellGroup>

      {/* 操作区域 */}
      <View style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <Button type="primary" onClick={increase}>
          增加
        </Button>
        <Button type="warning" onClick={decrease}>
          减少
        </Button>
        <Button type="danger" onClick={reset}>
          重置
        </Button>
      </View>
    </View>
  );
}

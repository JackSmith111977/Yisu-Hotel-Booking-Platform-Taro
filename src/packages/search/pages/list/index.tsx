import { useRouteParams } from "@/utils/router";
import { Text, View } from "@tarojs/components";

// 定义该页面期望接收的参数结构
interface SearchListParams {
  keyword: string;
  checkInDate: string;
  inLuxury?: string;
}

export default function SearchList() {
  const params = useRouteParams<SearchListParams>();

  return (
    <View>
      <Text>搜索关键词：{params.keyword}</Text>
      <Text>入住日期：{params.checkInDate}</Text>
      <Text>是否豪华酒店：{params.inLuxury ? "是" : "否"}</Text>
    </View>
  );
}

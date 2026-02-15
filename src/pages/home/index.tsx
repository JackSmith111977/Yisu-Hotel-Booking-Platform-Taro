import { RoutePath } from "@/constants/route";
import { navigateTo } from "@/utils/router";
import { Button } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import "./index.scss";

export default function Index() {
  const handleGoSearch = () => {
    const keyword = "Hilton";

    navigateTo(RoutePath.SearchList, {
      keyword: keyword,
      checkInDate: "2023-10-01",
      inLuxury: true,
    });
  };

  return (
    <View className='index-page'>
      <View className='header'>
        <Text className='title'>欢迎来到酒店预订平台</Text>
      </View>

      <View className='action-area'>
        <Button type='primary' onClick={handleGoSearch}>
          搜索酒店
        </Button>
      </View>
    </View>
  );
}

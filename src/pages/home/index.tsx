import { useEffect, useState } from "react";
import { RoutePath } from "@/constants/route";
import { navigateTo } from "@/utils/router";
import { Button } from "@nutui/nutui-react-taro";
import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { callSupabase } from "@/utils/supabase";
import "./index.scss";


export default function Index() {
  const [status, setStatus] = useState<string>("等待测试...");
  const [hotelList, setHotelList] = useState<any[]>([]);

  // 初始化云环境
  useEffect(() => {
    if (!Taro.cloud) {
      setStatus("❌ 当前环境不支持云开发");
    } else {
      Taro.cloud.init({
        env: "cloudbase-8gxsjvyg256c9566", // 替换为你的云开发环境 ID
        traceUser: true,
      });
    }
  }, []);

  /**
   * 查询 Hotels 表
   */
  const handleFetchHotels = async () => {
    setStatus("正在查询酒店列表...");
    setHotelList([]); // 清空旧数据

    const { data, error } = await callSupabase({
      action: "table",
      table: "hotels",
      method: "select",
      query: "*", // 查询所有字段
      // 可以添加 params: { eq: { city: 'Beijing' } } 等过滤条件
    });

    if (error) {
      setStatus(`❌ 查询失败: ${JSON.stringify(error)}`);
      console.error("Fetch error:", error);
    } else {
      setStatus(`✅ 查询成功! 找到 ${data?.length || 0} 条记录`);
      setHotelList(data || []);
      console.log("Hotels:", data);
    }
  };

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

      {/* --- 测试区域 --- */}
      <View
        style={{
          margin: "20px",
          padding: "15px",
          border: "1px dashed #ccc",
          borderRadius: "8px",
        }}
      >
        <Text
          style={{ display: "block", fontWeight: "bold", marginBottom: "10px" }}
        >
          Supabase 连接测试
        </Text>

        <View
          style={{
            marginBottom: "10px",
            wordBreak: "break-all",
            fontSize: "12px",
            color: "#666",
          }}
        >
          {status}
        </View>

        <Button type='primary' size='small' onClick={handleFetchHotels}>
          查询 Hotels 表
        </Button>

        {/* 简单的列表展示 */}
        {hotelList.map((hotel, index) => (
          <View
            key={index}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {hotel.name_zh || "未命名酒店"}
            </Text>
            <View style={{ fontSize: "12px", color: "#888" }}>
              {hotel.address || "暂无地址"}
            </View>
          </View>
        ))}
      </View>
      {/* ---------------- */}

      <View className='action-area'>
        <Button type='primary' onClick={handleGoSearch}>
          搜索酒店
        </Button>
      </View>
    </View>
  );
}

import { useRouteParams } from "@/utils/router";
import { View, Text, ScrollView } from "@tarojs/components";
import { useEffect, useState } from "react";
import { searchHotels, SearchHotelsParams } from "@/services/hotel";
import Taro from "@tarojs/taro";
import { HotelType } from "@/types/home/search";

interface PageParams {
  city?: string;
  keyword?: string;
  checkInDate?: string;
  checkOutDate?: string;
  tags?: string;
}

export default function SearchList() {
  const params = useRouteParams<PageParams>();
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const searchParams: SearchHotelsParams = {
          city: params.city,
          keyword: params.keyword,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          page: 1,
          pageSize: 20,
        };

        console.log("Searching with params:", searchParams);
        const res = await searchHotels(searchParams);
        setHotels(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "搜索失败");
        Taro.showToast({ title: "搜索失败", icon: "none" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.city, params.keyword, params.tags]);

  return (
    <ScrollView scrollY style={{ height: "100vh" }}>
      <View style={{ padding: "16px" }}>
        <Text
          style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}
        >
          搜索参数: {JSON.stringify(params)}
        </Text>

        {loading && (
          <View style={{ padding: "20px", textAlign: "center" }}>
            加载中...
          </View>
        )}

        {error && (
          <View style={{ padding: "20px", color: "red" }}>{error}</View>
        )}

        {!loading && !error && (
          <View>
            <Text
              style={{
                fontWeight: "bold",
                display: "block",
                marginBottom: "10px",
              }}
            >
              找到 {hotels.length} 家酒店:
            </Text>
            <View
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                fontSize: "12px",
                background: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {JSON.stringify(hotels, null, 2)}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

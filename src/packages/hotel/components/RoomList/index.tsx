import { useEffect, useState, useMemo } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { Tag, Button } from "@nutui/nutui-react-taro";
import { callSupabase } from "@/utils/supabase";
import "./index.scss";

interface BedInfo {
  type: string;
  count: number;
}

interface RoomType {
  id: number;
  hotel_id: number;
  name: string;
  price: number;
  quantity: number;
  size: number;
  description: string;
  max_guests: number;
  beds: BedInfo[];
  images: string[];
  facilities: string[];
}

interface RoomListProps {
  hotelId?: number;
  onPriceReady?: (price: number) => void;
}

const RoomList = ({ hotelId, onPriceReady }: RoomListProps) => {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return; // 没有 id 时不请求数据

    const fetchRooms = async () => {
      setLoading(true);
      const { data, error } = await callSupabase({
        action: "table",
        table: "room_types",
        method: "select",
        query: "*",
        params: { eq: { hotel_id: hotelId } },
      });

      if (error) {
        console.error("获取房型数据失败:", error);
        setLoading(false);
        return;
      }
      if (data) {
        console.log("接收到的房型数据：", data);
        setRooms(data);
      }
      setLoading(false);
    };

    fetchRooms();
  }, [hotelId]);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.quantity === 0 && b.quantity !== 0) return 1;
      if (a.quantity !== 0 && b.quantity === 0) return -1;
      return a.price - b.price;
    });
  }, [rooms]);

  useEffect(() => {
    if (sortedRooms.length > 0) {
      onPriceReady?.(sortedRooms[0].price);
    }
  }, [onPriceReady, sortedRooms]);

  // 格式化床型信息
  const formatBeds = (beds: BedInfo[]) => {
    if (!beds || beds.length === 0) return "";
    return beds.map((bed) => `${bed.count}张${bed.type}`).join(" ");
  };

  // 预览图片
  const handlePreviewImage = (images: string[], index: number) => {
    Taro.previewImage({
      current: images[index],
      urls: images,
    });
  };

  if (loading) {
    return (
      <View className='room-list-loading'>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View className='room-list-empty'>
        <Text>暂无房型信息</Text>
      </View>
    );
  }

  return (
    <View className='room-list'>
      {sortedRooms.map((room) => (
        <View className='room-card' key={room.id}>
          {/* 房型图片 */}
          <View
            className='image-wrap'
            onClick={() => handlePreviewImage(room.images || [], 0)}
          >
            {room.images && room.images.length > 0 ? (
              <Image
                className='room-image'
                src={room.images[0]}
                mode='aspectFill'
                lazyLoad
              />
            ) : (
              <View className='image-placeholder'>
                <Text className='placeholder-text'>暂无图片</Text>
              </View>
            )}
            {/* 图片数量角标 */}
            {room.images && room.images.length > 1 && (
              <View className='image-count'>
                <Text className='image-count-text'>{room.images.length}</Text>
              </View>
            )}
          </View>

          {/* 房型信息 */}
          <View className='room-info'>
            {/* 房型名称 */}
            <View className='room-header'>
              <Text className='room-name'>{room.name}</Text>
            </View>

            {/* 床型 · 面积 · 入住人数 */}
            <View>
              <Text className='detail-text'>
                {[
                  formatBeds(room.beds),
                  room.size ? `${room.size}m²` : "",
                  room.max_guests ? `${room.max_guests}人入住` : "",
                ]
                  .filter(Boolean)
                  .join("  ")}
              </Text>
            </View>

            {/* 设施标签 */}
            {room.facilities && room.facilities.length > 0 && (
              <View className='room-tags'>
                {/* TODO: 点击展示所有设置 */}
                {room.facilities.slice(0, 4).map((facility, idx) => (
                  <Tag
                    key={idx}
                    type='info'
                    style={{
                      '--nutui-tag-font-size': '8px',
                      '--nutui-tag-padding': '2px',
                      'background': '#0068c9',
                    } as React.CSSProperties}
                    // className='room-tag'
                  >
                    {facility}
                  </Tag>
                ))}
              </View>
            )}

            {/* 价格区域 */}
            <View className='price-row'>
            {
              room.quantity === 0
              ? <Text className='sellout-text'>已售罄</Text>
              : <View className='price-content'>
                  <View className='price-left'>                
                    <Text className='price-symbol'>¥</Text>
                    <Text className='price-text'>{room.price}</Text>
                    <Text className='price-suffix'>起</Text>      
                  </View>
                  <View className='price-right'>
                    <Button
                      type='primary'
                      color='linear-gradient(to right, #4da6ff, #0068c9)'
                      size='small'
                      style={{
                        width:'25px',
                        height:'25px',
                        '--nutui-button-small-font-size': '15px',
                        '--nutui-button-small-padding':'10px',
                      } as React.CSSProperties}
                    >
                      订
                    </Button>
                  </View>
                </View>              
            }
            </View>

            {/* 剩余房间数提示 */}
            {room.quantity > 0 && room.quantity <= 5 && (
              <View className='stock-warn'>
                <Text className='stock-warn-text'>仅剩{room.quantity}间</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default RoomList;
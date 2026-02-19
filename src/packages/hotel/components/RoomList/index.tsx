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

interface RoomAvailability {
  room_type_id: number;
  date: string;
  total_count: number;
  booked_count: number;
}

interface RoomListProps {
  hotelId?: number;
  checkInDate?: string;
  checkOutDate?: string;
  onPriceReady?: (price: number) => void;
}

const RoomList = ({ hotelId, checkInDate, checkOutDate, onPriceReady }: RoomListProps) => {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const targetStart = checkInDate ?? today;
  const targetEnd = checkOutDate ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    if (!hotelId) return;

    const fetchData = async () => {
      setLoading(true);

      const [roomRes, availRes] = await Promise.all([
        callSupabase({
          action: "table",
          table: "room_types",
          method: "select",
          query: "*",
          params: { eq: { hotel_id: hotelId } },
        }),
        callSupabase({
          action: "table",
          table: "room_availability",
          method: "select",
          query: "*",
          params: {
            gte: { date: targetStart },
            lt: { date: targetEnd },
          },
        }),
      ]);

      if (roomRes.error) console.error("获取房型失败:", roomRes.error);
      if (roomRes.data) {
        console.log("接收到的房型数据：", roomRes.data);
        setRooms(roomRes.data);
      }

      if (availRes.error) console.error("获取可用数量失败:", availRes.error);
      if (availRes.data) {
        // 按 room_type_id 分组，取日期段内最小可用数
        const grouped: Record<number, number[]> = {};
        (availRes.data as RoomAvailability[]).forEach((item) => {
          const avail = item.total_count - item.booked_count;
          if (!grouped[item.room_type_id]) grouped[item.room_type_id] = [];
          grouped[item.room_type_id].push(avail);
        });
        const map: Record<number, number> = {};
        Object.entries(grouped).forEach(([id, counts]) => {
          map[Number(id)] = Math.min(...counts);
        });
        setAvailabilityMap(map);
      }

      setLoading(false);
    };

    fetchData();
  }, [hotelId, targetStart, targetEnd]);

  // 获取某房型的实际可用数，availability 表无记录时兜底用 room.quantity
  const getAvailable = (room: RoomType): number => {
    if (room.id in availabilityMap) return availabilityMap[room.id];
    return room.quantity;
  };

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const qa = getAvailable(a);
      const qb = getAvailable(b);
      if (qa === 0 && qb !== 0) return 1;
      if (qa !== 0 && qb === 0) return -1;
      return a.price - b.price;
    });
  }, [rooms, availabilityMap]);

  useEffect(() => {
    if (sortedRooms.length > 0) {
      const firstAvailable = sortedRooms.find(r => getAvailable(r) > 0);
      onPriceReady?.(firstAvailable ? firstAvailable.price : sortedRooms[0].price);
    }
  }, [onPriceReady, sortedRooms]);

  const formatBeds = (beds: BedInfo[]) => {
    if (!beds || beds.length === 0) return "";
    return beds.map((bed) => `${bed.count}张${bed.type}`).join(" ");
  };

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
      {sortedRooms.map((room) => {
        const available = getAvailable(room);
        return (
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
              {room.images && room.images.length > 1 && (
                <View className='image-count'>
                  <Text className='image-count-text'>{room.images.length}</Text>
                </View>
              )}
            </View>

            {/* 房型信息 */}
            <View className='room-info'>
              <View className='room-header'>
                <Text className='room-name'>{room.name}</Text>
              </View>

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

              {room.facilities && room.facilities.length > 0 && (
                <View className='room-tags'>
                  {room.facilities.slice(0, 4).map((facility, idx) => (
                    <Tag
                      key={idx}
                      type='info'
                      style={{
                        '--nutui-tag-font-size': '8px',
                        '--nutui-tag-padding': '2px',
                        'background': '#0068c9',
                      } as React.CSSProperties}
                    >
                      {facility}
                    </Tag>
                  ))}
                </View>
              )}

              {/* 价格区域 — 用 available 替代 room.quantity */}
              <View className='price-row'>
                {available === 0
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
                            width: '25px',
                            height: '25px',
                            '--nutui-button-small-font-size': '15px',
                            '--nutui-button-small-padding': '10px',
                          } as React.CSSProperties}
                        >
                          订
                        </Button>
                      </View>
                    </View>
                }
              </View>

              {/* 剩余房间数提示 — 用 available 替代 room.quantity */}
              {available > 0 && available <= 2 && (
                <View className='stock-warn'>
                  <Text className='stock-warn-text'>仅剩{available}间</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default RoomList;
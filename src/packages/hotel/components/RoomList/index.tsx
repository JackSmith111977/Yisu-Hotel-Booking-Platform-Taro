import { useEffect, useState, useMemo } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { Tag, Button } from "@nutui/nutui-react-taro";
import { callSupabase } from "@/utils/supabase";
import { BedInfo, RoomType, RoomAvailability } from "@/types/detailPage/RoomList";
import { useBookingStore } from '@/store/bookingStore'
import "./index.scss";

interface RoomListProps {
  hotelId?: number;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  adultCount: number;
  childCount: number;
  onPriceReady?: (price: number) => void;
}

const RoomList = ({ hotelId, checkInDate, checkOutDate, nights, adultCount, childCount, onPriceReady }: RoomListProps) => {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  // const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const { items, setItems, setContext, updateCount } = useBookingStore();

  const today = new Date().toISOString().slice(0, 10);
  const targetStart = checkInDate ?? today;
  const targetEnd = checkOutDate ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  })();

  useEffect(() => {
    if (hotelId && checkInDate && checkOutDate) {
      setContext(hotelId, checkInDate, checkOutDate, nights ?? 1);
    }
  }, [hotelId, checkInDate, checkOutDate, nights]);

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
      if (roomRes.data) setRooms(roomRes.data);

      if (availRes.error) console.error("获取可用数量失败:", availRes.error);
      if (availRes.data) {
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

  const getAvailable = (room: RoomType): number => {
    if (room.id in availabilityMap) return availabilityMap[room.id];
    return 0;
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

  const getSelectedCount = (roomId: number): number =>
    items.find((i) => i.roomTypeId === roomId)?.count ?? 0;

  const handleCountChange = (room: RoomType, delta: number) => {
    const current = getSelectedCount(room.id);
    const max = getAvailable(room);
    const next = Math.max(0, Math.min(max, current + delta));
  
    updateCount(
      {
        roomTypeId: room.id,
        roomName: room.name,
        price: room.price,
        count: 0,
        images: room.images ?? [],
        adultCount: adultCount ?? 1,
        childCount: childCount ?? 0,
      },
      next
    );
  };

  const handleBook = (room: RoomType) => {
    const count = getSelectedCount(room.id);
    if (count === 0) {
      Taro.showToast({ title: '请先选择房间数量', icon: 'none' });
      return;
    }

    const store = useBookingStore.getState();
    const orderData = {
      hotelId: store.hotelId,
      checkInDate: store.checkInDate,
      checkOutDate: store.checkOutDate,
      nights: store.nights,
      items: store.items,
      totalPrice: store.totalPrice(),
    };

    Taro.navigateTo({
      url: '/packages/hotel/pages/order/index',
      success: (res) => {
        res.eventChannel.emit('acceptOrderData', { data: orderData });
      },
    });
  };

  const formatBeds = (beds: BedInfo[]) => {
    if (!beds || beds.length === 0) return "";
    return beds.map((bed) => `${bed.count}张${bed.type}`).join(" ");
  };

  const handlePreviewImage = (images: string[], index: number) => {
    Taro.previewImage({ current: images[index], urls: images });
  };

  // 房型描述展开
  // const toggleDescription = (roomId: number) => {
  //   setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  // };

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
        const selectedCount = getSelectedCount(room.id);
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

              {/* 房型描述 */}
              {room.description && (
                <Text className='room-description'>{room.description}</Text>
              )}

              {/* 设施标签 */}
              {room.facilities && room.facilities.length > 0 && (
                <View className='room-tags'>
                  {room.facilities.slice(0, 5).map((facility, idx) => (
                    <Tag
                      key={idx}
                      style={{
                        '--nutui-tag-font-size': '10px',
                        '--nutui-tag-padding': '4px',
                        '--nutui-tag-border-radius': '4px',
                        '--nutui-tag-color': '#666',
                        'background': '#f7f7f7',
                        'border': '1px solid #ddd',
                        'color': '#666',
                      } as React.CSSProperties}
                    >
                      {facility}
                  </Tag>
                  ))}
                </View>
              )}

              {/* 价格区域 */}
              <View className='price-row'>
                {available === 0 ? (
                  <Text className='sellout-text'>已售罄</Text>
                ) : (
                  <View className='price-content'>
                    <View className='price-left'>
                      <View className='room-count-selector'>
                        <View
                          className={`count-btn ${selectedCount <= 0 ? 'count-btn-disabled' : ''}`}
                          onClick={() => handleCountChange(room, -1)}
                        >
                          <Text className='count-btn-text'>-</Text>
                        </View>
                        <Text className='count-num'>{selectedCount}</Text>
                        <View
                          className={`count-btn ${selectedCount >= getAvailable(room) ? 'count-btn-disabled' : ''}`}
                          onClick={() => handleCountChange(room, +1)}
                        >
                          <Text className='count-btn-text'>+</Text>
                        </View>
                      </View>                    
                    </View>
                    <View className='price-middle'>
                      <Text className='price-symbol'>¥</Text>
                      <Text className='price-text'>{room.price}</Text>
                      <Text className='price-suffix'>起</Text>
                    </View>
                    <View className='price-right'>
                      <Button
                        type='primary'
                        color='linear-gradient(to right, #4da6ff, #0068c9)'
                        size='small'
                        onClick={() => handleBook(room)}
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
                )}
              </View>

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
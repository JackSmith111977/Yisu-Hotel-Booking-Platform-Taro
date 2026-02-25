import { View, Text, Image } from '@tarojs/components';
import { Tag, Button } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import type { RecommendResult } from '@/utils/recommendRooms';
import { BedInfo } from '@/types/detailPage/RoomList';
import { useBookingStore } from '@/store/bookingStore'
import { useUserStore } from '@/store/userStore'
import './index.scss';

interface Props {
  result: RecommendResult;
  nights: number;
  adultCount: number;
  childCount: number;
  onBook?: (roomTypeId: number) => void;
}

export function RoomRecommendResult({ result, nights, adultCount, childCount, onBook }: Props) {
  const { setItems, totalPrice } = useBookingStore()
  const { isLoggedIn } = useUserStore()
  const totalRooms = result.rooms.reduce((s, r) => s + r.count, 0);

  const formatBeds = (beds: BedInfo[]) => {
    if (!beds || beds.length === 0) return '';
    return beds.map((bed) => `${bed.count}张${bed.type}`).join(' ');
  };

  const handlePreviewImage = (images: string[], index: number) => {
    Taro.previewImage({
      current: images[index],
      urls: images,
    });
  };  

  // 订购逻辑
  const handleBookAll = () => {
    if (!isLoggedIn) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/packages/auth/pages/index' })
          }
        }
      })
      return;
    }

    // 把推荐结果写入 store
    const newItems = result.rooms.map(({ room, count }) => ({
      roomTypeId: room.id,
      roomName: room.name,
      price: room.price,
      count,
      images: (room as any).images ?? [],
      adultCount,
      childCount,
    }))
    setItems(newItems)
  
    const store = useBookingStore.getState()
    const orderData = {
      hotelId: store.hotelId,
      checkInDate: store.checkInDate,
      checkOutDate: store.checkOutDate,
      nights: store.nights,
      items: newItems,
      totalPrice: result.total_price,
    }
  
    console.log('[BookingOrder] RoomRecommendResult 传递给订单页的参数:', orderData)
  
    Taro.navigateTo({
      url: '/packages/hotel/pages/order/index',
      success: (res) => {
        res.eventChannel.emit('acceptOrderData', { data: orderData })
      },
    })
  }

  return (
    <View className='recommend-wrapper'>
      {/* 推荐标题栏 */}
      <View className='recommend-header'>
        <Text className='recommend-icon'>✦</Text>
        <Text className='recommend-title'>为您推荐</Text>
        <Text className='recommend-subtitle'>
          {result.is_fallback ? result.fallback_reason : '可入住人数的最低价组合'}
        </Text>
      </View>

      {/* 房型卡片列表 */}
      <View className='recommend-room-list'>
        {result.rooms.map(({ room, count }, index) => (
          <View
            className='recommend-room-card' key={`${room.id}-${index}`}
            style={{
              '--nutui-card-border-radius': '0px'
            } as React.CSSProperties}
          >
            {/* 图片区域 */}
            <View
              className='recommend-image-wrap'
              onClick={() => handlePreviewImage((room as any).images || [], 0)}
            >
              {(room as any).images && (room as any).images.length > 0 ? (
                <Image
                  className='recommend-room-image'
                  src={(room as any).images[0]}
                  mode='aspectFill'
                  lazyLoad
                />
              ) : (
                <View className='recommend-image-placeholder'>
                  <Text className='recommend-placeholder-text'>暂无图片</Text>
                </View>
              )}
              {(room as any).images && (room as any).images.length > 1 && (
                <View className='recommend-image-count'>
                  <Text className='recommend-image-count-text'>{(room as any).images.length}</Text>
                </View>
              )}
            </View>

            {/* 房型信息 */}
            <View className='recommend-room-info'>
              <View className='recommend-room-header'>
                <View className='recommend-count-tag'>
                  <Text className='recommend-count-text'>{count}间</Text>
                </View>
                <Text className='recommend-room-name'>{room.name}</Text>
              </View>

              <View className='recommend-room-detail'>
                <Text className='recommend-detail-text'>
                  {[
                    formatBeds(room.beds),
                    room.size ? `${room.size}m²` : '',
                    room.max_guests ? `${room.max_guests}人入住` : '',
                  ]
                    .filter(Boolean)
                    .join('  ')}
                </Text>
              </View>

              {(room as any).facilities && (room as any).facilities.length > 0 && (
                <View className='recommend-room-tags'>
                  {(room as any).facilities.slice(0, 4).map((facility: string, idx: number) => (
                    <Tag
                      key={idx}
                      type='info'
                      style={{
                        '--nutui-tag-font-size': '8px',
                        '--nutui-tag-padding': '2px',
                        background: '#0068c9',
                      } as React.CSSProperties}
                    >
                      {facility}
                    </Tag>
                  ))}
                </View>
              )}

              {/* 价格行 — 无订按钮 */}
              <View className='recommend-price-row'>
                <Text className='recommend-price-symbol'>¥</Text>
                <Text className='recommend-price-text'>{room.price}</Text>
                <Text className='recommend-price-suffix'>× {count}间 × {nights}晚</Text>
              </View>

              <View className='recommend-subtotal-row'>
                <Text className='recommend-subtotal-text'>
                  总计 ¥{(room.price * count * nights).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 底部总价 + 统一预订按钮 */}
      <View className='recommend-footer'>
        <View className='footer-price-block'>
          <View className='footer-total-row'>
            <Text className='footer-currency'>¥</Text>
            <Text className='footer-total-price'>{result.total_price.toLocaleString()}</Text>
          </View>
        </View>
        <Button
          type='primary'
          onClick={handleBookAll}
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
  );
}
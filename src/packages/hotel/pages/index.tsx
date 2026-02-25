import Taro, { useLoad, usePageScroll, useRouter, useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { RecommendResult } from '@/utils/recommendRooms'
import { User } from '@nutui/icons-react-taro'
import { callSupabase } from '@/utils/supabase'
import { useBookingStore } from '@/store/bookingStore'
import { useUserStore } from '@/store/userStore'
import { authService } from '@/services/auth'
import { useState } from 'react'
import { HotelType } from '../../../types/detailPage/hotel'
import HotelSwiper from '../components/HotelSwiper'
import HotelInfo from '../components/HotelInfo'
import BookingDateBar from '../components/BookingDateBar'
import BottomBar from '../components/BottomBar'
import RoomList from '../components/RoomList'
import StickyTopBar from '../components/StickyTopBar'
import { RoomRecommendResult } from '../components/RoomrecommendResult'
import HotelTags from '../components/HotelTags'

import './index.scss'

interface DateRange {
  start: Date
  end: Date
  nights: number
}

interface RoomGuest {
  rooms: number
  adults: number
  children: number
}

const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const HotelDetail = () => {
  const [hotel, setHotel] = useState<HotelType>()
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(),
    end: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d })(),
    nights: 1,
  })
  const [roomGuest, setRoomGuest] = useState<RoomGuest>({
    rooms: 1,
    adults: 1,
    children: 0,
  })
  const [showTopBar, setShowTopBar] = useState(false)
  const [lowestPrice, setLowestPrice] = useState(0);
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const { isLoggedIn, userInfo } = useUserStore()

  // 获取传送的酒店数据
  const router = useRouter()
  useLoad(async () => {
    const { id } = router.params
    
    const { data, error } = await callSupabase({
      action: "table",
      table: "hotels",
      method: "select",
      query: "*",
      params: {
        eq: { id: Number(id) }
      }
    })
    
    if (error) {
      console.error("获取酒店详情失败:", error)
      return
    }
    if (data?.[0]) {
      console.log('接收到的房型数据:', data[0])
      setHotel(data[0])
      
      if (isLoggedIn && userInfo?.openid) {
        const favorited = await authService.checkIsFavorited(id!, userInfo.openid)
        setIsFavorited(favorited)
      }
    }
  })

  // 预处理数据
  const hotelImages = hotel ? [hotel.image, ...(hotel.album ?? [])] : [];
  const hotelAddress = `${JSON.parse(hotel?.region || '[]')?.filter((item: string) => item !== '市辖区').join('') || ''}${hotel?.address || ''}`;
  const stickyNavHeight = Taro.getMenuButtonBoundingClientRect().bottom + 10  // Hotelinfo sticky 位置

  // 添加滚动方法并传给 BottomBar
  const scrollToRoomList = () => {
    const query = Taro.createSelectorQuery()
    query.select('.room-list').boundingClientRect()
    query.selectViewport().scrollOffset()
    query.select('.booking-section-sticky').boundingClientRect()
    query.exec((res) => {
      const roomListRect = res[0]
      const scroll = res[1]
      const bookingRect = res[2]
  
      if (!roomListRect || !bookingRect) return
  
      const navHeight = stickyNavHeight
      const bookingHeight = bookingRect.height
      const totalOffset = navHeight + bookingHeight + 10
  
      Taro.pageScrollTo({
        scrollTop: scroll.scrollTop + roomListRect.top - totalOffset,
        duration: 300,
      })
    })
  }

  usePageScroll(({ scrollTop }) => {
    setShowTopBar(scrollTop > 250)
  })

  const toggleFavorite = async () => {
    if (!isLoggedIn || !userInfo?.openid || !hotel?.id) {
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
      return
    }

    if (favoriteLoading) return

    setFavoriteLoading(true)
    const tempFavorited = !isFavorited
    setIsFavorited(tempFavorited)

    try {
      let result
      if (tempFavorited) {
        result = await authService.addFavorite(String(hotel.id), userInfo.openid)
      } else {
        result = await authService.removeFavorite(String(hotel.id), userInfo.openid)
      }

      if (result.success) {
        setIsFavorited(tempFavorited)
        Taro.showToast({ title: result.message, icon: 'success' })
      } else {
        setIsFavorited(!tempFavorited)
        Taro.showToast({ title: result.message || '操作失败', icon: 'none' })
      }
    } catch (error) {
      setIsFavorited(!tempFavorited)
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      setFavoriteLoading(false)
    }
  }

  const { clearItems } = useBookingStore()

  useDidShow(() => {
    setRefreshKey(k => k + 1)
    setRecommendResult(null)
    clearItems()
    if (isLoggedIn && userInfo?.openid && hotel?.id) {
      authService.checkIsFavorited(String(hotel.id), userInfo.openid).then(setIsFavorited)
    }
  })  

  return (
    <View className='hotel-detail'>
      {/* 酒店信息吸顶 */}
      <StickyTopBar visible={showTopBar} name={hotel?.name_zh} />

      {/* 图片轮播 */}
      <HotelSwiper images={hotelImages} isFavorited={isFavorited} onToggleFavorite={toggleFavorite} loading={favoriteLoading} />

      {/* 酒店信息 */}
      <HotelInfo
        nameZh={hotel?.name_zh}
        nameEn={hotel?.name_en}
        starRating={hotel?.star_rating}
        address={hotelAddress}
        phone={hotel?.contact_phone}
      />
      
      {/* 酒店 Tags */}
      <HotelTags tags={hotel?.tags ?? []} />

      {/* 日期 & 入住信息 */}
      <View 
        className='booking-section-sticky'
        style={{
          top: showTopBar ? `${stickyNavHeight}px` : '0px',
        }}
      >
        <View className='booking-section'>
          <BookingDateBar
            hotelId={hotel?.id ?? -1}
            onDateChange={(start, end, nights) => setDateRange({ start, end, nights })}
            onRoomGuestChange={(data) => setRoomGuest(data)}
            onRecommendResult={setRecommendResult}
          />
        </View>
      </View>
      
      {recommendResult && (roomGuest.rooms > 1 || roomGuest.adults > 1 || roomGuest.children > 0) ? (
        <RoomRecommendResult 
          result={recommendResult} 
          nights={dateRange.nights}
          adultCount={roomGuest.adults}
          childCount={roomGuest.children}
        />
      ) : null}

      {/* 房型列表 */}
      {/* dateRange={dateRange} roomGuest={roomGuest} */}
      {recommendResult && (roomGuest.adults > 1 || roomGuest.children > 0 || roomGuest.rooms > 1) ? (
        <View className='prompt'>
          <User className='prompt-icon' />
          <Text >其余可供选择的房型</Text>
          {/* <Text >{`不满足"${roomGuest.adults}名成人, ${roomGuest.children}名儿童"的房型`}</Text> */}
        </View>        
      ) : null}

      <RoomList 
        key={refreshKey}
        hotelId={hotel?.id} 
        checkInDate={toStr(dateRange.start)}
        checkOutDate={toStr(dateRange.end)}
        nights={dateRange.nights}
        adultCount={roomGuest.adults}
        childCount={roomGuest.children}
        onPriceReady={setLowestPrice} 
      />

      {/* 底部操作栏 */}
      <BottomBar 
        price={lowestPrice}
        visible={!showTopBar}
        onViewRooms={scrollToRoomList}
      />
    </View>
  )
}

export default HotelDetail
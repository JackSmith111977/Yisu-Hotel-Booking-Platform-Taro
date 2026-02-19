import Taro, { useLoad, usePageScroll } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { useState, useRef, useEffect } from 'react'
import { HotelType } from '../../../../types/hotel'
import HotelSwiper from '../components/HotelSwiper'
import HotelInfo from '../components/HotelInfo'
import BookingDateBar from '../components/BookingDateBar'
import BottomBar from '../components/BottomBar'
import RoomList from '../components/RoomList'
import StickyTopBar from '../components/StickyTopBar'
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
  const [showBottomBar, setShowBottomBar] = useState(true)
  const [lowestPrice, setLowestPrice] = useState(0);

  // 获取传送的酒店数据
  useLoad(() => {
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1]
    const eventChannel = current.getOpenerEventChannel()

    eventChannel.on('acceptDataFromOpenerPage', (res) => {
      console.log('接收到的数据:', res.data.data[0])
      setHotel(res.data.data[0])
    })
  })

  // 预处理数据
  const hotelImages = hotel ? [hotel.image, ...hotel.album] : [];
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

  return (
    <View className='hotel-detail'>
      {/* 酒店信息吸顶 */}
      <StickyTopBar visible={showTopBar} name={hotel?.name_zh} />

      {/* 图片轮播 */}
      <HotelSwiper images={hotelImages} />

      {/* 酒店信息 */}
      <HotelInfo
        nameZh={hotel?.name_zh}
        nameEn={hotel?.name_en}
        starRating={hotel?.star_rating}
        address={hotelAddress}
      />      

      {/* 日期 & 入住信息 */}
      <View 
        className='booking-section-sticky'
        style={{
          top: showTopBar ? `${stickyNavHeight}px` : '0px',
        }}
      >
        <View className='booking-section'>
          <BookingDateBar
            onDateChange={(start, end, nights) => setDateRange({ start, end, nights })}
            onRoomGuestChange={(data) => setRoomGuest(data)}
          />
        </View>
      </View>      

      {/* 房型列表 */}
      {/* dateRange={dateRange} roomGuest={roomGuest} */}
      <RoomList hotelId={hotel?.id} onPriceReady={setLowestPrice} /> 

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
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Image, CommonEventFunction, SwiperProps as TaroSwiperProps } from '@tarojs/components'
import { Swiper, Price, Button } from '@nutui/nutui-react-taro'
import { StarF } from '@nutui/icons-react-taro'
import { useState } from 'react'
import { HotelType } from '../../../../types/hotel'
import TopNavBar from '../components/TopNavBar'
// import HotelSearchBar from '../components/HotelSearchBar'
import './index.scss'

const HotelDetail = () => {
    const [hotel, setHotel] = useState<HotelType>() // 当前酒店数据
    const [currentSlide, setCurrentSlide] = useState(0)   // 当前轮播图 index

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
  
    // 轮播切换
    const handleSwiperChange: CommonEventFunction<TaroSwiperProps.onChangeEventDetail> = (e) => {
        // console.log(`切换轮播图：`, e)
        setCurrentSlide(e.detail.current)
    }

    // 渲染星级
    const renderStars = (count: number) => {
        return Array.from({ length: count }, (_, index) => (<StarF key={index} color='#FFC107' size='15px' />))
    }

    // 预处理获取的酒店数据
    const hotelImages = hotel ? [hotel.image, ...hotel.album] : []
    const hotelAddress = `${JSON.parse(hotel?.region || '[]')?.filter((item: string) => item !== '市辖区').join('') || ''}${hotel?.address || ''}`

    return (    
    <View className='hotel-detail'>
        {/* ====== 图片轮播区域 ====== */}
        <View className='banner-section'>
          <Swiper
            className='banner-swiper'
            autoplay
            loop  // 循环轮播
            indicator
            onChange={handleSwiperChange}
            height={520}
          >
            {hotelImages.map((path, idx) => (
              <Swiper.Item key={idx}>
                <Image
                  className='banner-image'
                  src={path}
                  mode='aspectFill'
                  style={{ width: '100%', height: '100%' }}
                  lazyLoad
                />
              </Swiper.Item>
            ))}
          </Swiper>

          {/* 图片计数器 */}
          <View className='slide-counter'>
          <Text className='slide-counter-text'>
              {currentSlide + 1}/{hotelImages.length}
          </Text>
          </View>

          {/* 顶部导航栏 */}
          <TopNavBar />

          {/* TODO: 底部 tab 栏 */}

        </View>

        {/* ====== 酒店信息区域 ====== */}
        <View className='hotel-info-section'>
          {/* 酒店名称 */}
          <View className='hotel-name-row'>
            <View className='hotel-name-wrap'>
              <Text className='hotel-name'>{hotel?.name_zh}</Text>
              <View className='stars-row'>
                  {renderStars(hotel? hotel.star_rating : 0)}
              </View>
            </View>
          </View>
          <Text className='hotel-name-en'>{hotel?.name_en}</Text>

          {/* TODO: 酒店标签 */}

          {/* TODO: 特色功能图标 */}
          {/* <View className="features-row">
            {hotelData.features.map((feat, idx) => (
              <View className="feature-item" key={idx}>
                <Text className="feature-icon">{feat.icon}</Text>
                <Text className="feature-label">{feat.label}</Text>
              </View>
            ))}
            <View className="feature-item feature-more">
              <Text className="feature-icon">📋</Text>
              <Text className="feature-label">设施政策</Text>
            </View>
          </View> */}

          {/* TODO: 设施政策 */}

          {/* 地理位置 */}
          <View className='location-row'>
            <Text className='location-icon'>📍</Text>
            <Text className='location-text'>
              {hotelAddress}
            </Text>
          </View>
        </View>

      {/* ====== 房间列表 ====== */}
      <View className='booking-section'>
      {/* 日期 & 入住信息 */}
        {/* <HotelSearchBar /> */}

        {/* 筛选标签 */}

      </View>

      {/* ====== 房型列表 ====== */}

      {/* ====== 底部操作栏 ====== */}
      <View className='bottom-bar'>
        <View className='bottom-left'>
          <Text className='bottom-chat-icon'>💬</Text>
          <Text className='bottom-chat-text'>问酒店</Text>
        </View>
        <View className='bottom-right'>
          <Price
            price={1037}
            size='normal'
            thousands
            className='bottom-price'
          />
          <Button type='primary' size='small' className='bottom-btn'>
            查看房型
          </Button>
        </View>
      </View>
    </View>
  )
}

export default HotelDetail
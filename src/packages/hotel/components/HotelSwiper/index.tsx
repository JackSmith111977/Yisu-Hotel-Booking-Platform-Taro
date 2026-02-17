import React, { useState, useCallback } from 'react'
import { View, Text, Image, CommonEventFunction, SwiperProps as TaroSwiperProps } from '@tarojs/components'
import { Swiper } from '@nutui/nutui-react-taro'
import TopNavBar from '../TopNavBar'
import './index.scss'

interface HotelSwiperProps {
  images: string[]
}

const HotelSwiper = ({ images }: HotelSwiperProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleChange: CommonEventFunction<TaroSwiperProps.onChangeEventDetail> = useCallback((e) => {
    setCurrentSlide(e.detail.current)
  }, [])

  return (
    <View className='banner-section'>
      <Swiper
        className='banner-swiper'
        autoplay
        loop
        indicator
        onChange={handleChange}
        height={520}
      >
        {images.map((path, idx) => (
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
          {currentSlide + 1}/{images.length}
        </Text>
      </View>

      {/* 顶部导航栏 */}
      <TopNavBar />
    </View>
  )
}

export default React.memo(HotelSwiper)
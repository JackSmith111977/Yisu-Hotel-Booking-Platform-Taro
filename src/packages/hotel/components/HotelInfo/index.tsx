import React from 'react'
import { View, Text } from '@tarojs/components'
import { StarF } from '@nutui/icons-react-taro'
import './index.scss'

interface HotelInfoProps {
  nameZh?: string
  nameEn?: string
  starRating?: number
  address?: string
}

const renderStars = (count: number) => {
  return Array.from({ length: count }, (_, index) => (
    <StarF key={index} color='#FFC107' size='15px' />
  ))
}

const HotelInfo = ({ nameZh, nameEn, starRating = 0, address }: HotelInfoProps) => {
  return (
    <View className='hotel-info-section'>
      {/* 酒店名称 */}
      <View className='hotel-name-row'>
        <View className='hotel-name-wrap'>
          <Text className='hotel-name'>{nameZh}</Text>
          <View className='stars-row'>
            {renderStars(starRating)}
          </View>
        </View>
      </View>
      <Text className='hotel-name-en'>{nameEn}</Text>

      {/* 地理位置 */}
      <View className='location-row'>
        <Text className='location-icon'>📍</Text>
        <Text className='location-text'>{address}</Text>
      </View>
    </View>
  )
}

export default React.memo(HotelInfo)
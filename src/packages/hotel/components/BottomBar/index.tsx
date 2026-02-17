import React from 'react'
import { View, Text } from '@tarojs/components'
import { Price, Button } from '@nutui/nutui-react-taro'
import './index.scss'

interface BottomBarProps {
  price?: number
  onViewRooms?: () => void
}

const BottomBar = ({ price = 0, onViewRooms }: BottomBarProps) => {
  return (
    <View className='bottom-bar'>
      <View className='bottom-right'>
        <View className='bottom-price-content'>
          <Price
            price={price}
            size='normal'
            thousands
            digits={0}
            className='bottom-price'
            style={{
              '--nutui-price-symbol-normal-size':'15px',
              '--nutui-price-integer-normal-size':'20px',
              '--nutui-price-decimal-normal-size':'15px'
            } as React.CSSProperties}
          />
          <Text className='bottom-price-suffix'>起</Text>
        </View>
        <Button 
          type='primary' size='small' className='bottom-btn' onClick={onViewRooms}
          style={{
            '--nutui-button-small-font-size':'12px',
            '--nutui-button-small-padding':'12px 10px'
          } as React.CSSProperties}
        >
          查看房型
        </Button>
      </View>
    </View>
  )
}

export default React.memo(BottomBar)
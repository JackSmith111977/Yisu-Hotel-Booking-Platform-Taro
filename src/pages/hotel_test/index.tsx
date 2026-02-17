import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/supabase'
import Taro from '@tarojs/taro';
import './index.scss'

export default function Index() {
  const [hotels, setHotels] = useState<any[]>([])
  // const [currentHotel, setCurrentHotel] = useState<number>();

  useEffect(() => {
    const fetchHotels = async () => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
      if (error) {
        console.error('获取酒店数据失败:', error)
        return
      }
      if (data){
        // console.log('酒店数据:', data);
        setHotels(data);
      } 
    }
    fetchHotels()
  }, [])

  const handleClick = useCallback((id: number) => {
    const data = hotels.filter(item => item.id === id)
    Taro.navigateTo({
      url: `/packages/hotel/pages/index?id=${id}`,
      success(res) {
        res.eventChannel.emit('acceptDataFromOpenerPage', { data: { data } })
      }
    })
  }, [hotels])

  return (
    <View style={{ display: 'flex', flexDirection: 'column' }}>
      {hotels.map((hotel) => (
        <Button
          key={hotel.id}
          type='primary'
          style={{ marginBottom: '12px' }}
          onClick={() => handleClick(hotel.id)}
        >
          {hotel.id} - {hotel.name_zh}
        </Button>
      ))}
    </View>
  )
}
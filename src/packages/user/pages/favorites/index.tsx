import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { useUserStore } from '@/store/userStore'
import { authService } from '@/services/auth'
import './index.scss'

interface FavoriteHotel {
  id: number
  hotel_id: number
  hotel_name: string
  hotel_address: string
  hotel_image: string
  hotel_star_rating: number
  created_at: string
}

export default function Favorites() {
  const { isLoggedIn, userInfo } = useUserStore()
  const [favorites, setFavorites] = useState<FavoriteHotel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoggedIn) {
      loadFavorites()
    }
  }, [isLoggedIn, userInfo?.openid])

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const page = instance.page
    if (page) {
      page.onShow = () => {
        if (isLoggedIn) {
          loadFavorites()
        }
      }
    }
  }, [isLoggedIn])

  const loadFavorites = async () => {
    if (!userInfo?.openid) {
      console.log('openid不存在，无法加载收藏')
      return
    }
    console.log('开始加载收藏，openid:', userInfo.openid)
    setLoading(true)
    try {
      const result = await authService.getUserFavorites(userInfo.openid)
      console.log('收藏结果:', result)
      if (result.success && result.favorites) {
        console.log('收藏数据:', result.favorites)
        setFavorites(result.favorites)
      }
    } catch (error) {
      console.error('加载收藏失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHotelClick = (hotel: FavoriteHotel) => {
    Taro.navigateTo({
      url: `/packages/hotel/pages/index?id=${hotel.hotel_id}`
    })
  }

  const handleRemoveFavorite = async (e: any, hotel: FavoriteHotel) => {
    e.stopPropagation()
    if (!userInfo?.openid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认取消',
      content: '确定要取消收藏该酒店吗？',
      success: async (res) => {
        if (res.confirm) {
          const result = await authService.removeFavorite(String(hotel.hotel_id), userInfo.openid || '')
          if (result.success) {
            Taro.showToast({ title: '已取消收藏', icon: 'success' })
            loadFavorites()
          } else {
            Taro.showToast({ title: result.message, icon: 'none' })
          }
        }
      }
    })
  }

  const getStarRating = (rating: number) => {
    return '⭐'.repeat(rating || 3)
  }

  if (!isLoggedIn) {
    return (
      <View className='favorites-page'>
        <View className='empty-tip'>
          <Text>请先登录</Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className='favorites-page'>
        <View className='loading-tip'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='favorites-page'>
      {favorites.length === 0 ? (
        <View className='empty-tip'>
          <Text>暂无收藏酒店</Text>
        </View>
      ) : (
        <View className='favorites-list'>
          {favorites.map((item) => (
            <View 
              key={item.id} 
              className='favorite-item'
              onClick={() => handleHotelClick(item)}
            >
              <Image 
                className='hotel-image' 
                src={item.hotel_image || 'https://via.placeholder.com/150'} 
                mode='aspectFill'
              />
              <View className='hotel-info'>
                <Text className='hotel-name'>{item.hotel_name}</Text>
                <Text className='hotel-star'>{getStarRating(item.hotel_star_rating)}</Text>
                <Text className='hotel-address'>{item.hotel_address}</Text>
              </View>
              <Button 
                className='remove-btn'
                onClick={(e) => handleRemoveFavorite(e, item)}
              >
                取消收藏
              </Button>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

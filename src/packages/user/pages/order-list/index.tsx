import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { useUserStore } from '@/store/userStore'
import { authService } from '@/services/auth'
import './index.scss'

interface Order {
  id: number
  hotel_id: number
  hotel_name: string
  room_type: string
  check_in_date: string
  check_out_date: string
  nights: number
  total_amount: number
  status: number
  created_at: string
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '已取消', color: '#9e9e9e' },
  1: { text: '待支付', color: '#ff9800' },
  2: { text: '已支付', color: '#4caf50' },
  3: { text: '已完成', color: '#2196f3' }
}

export default function OrderList() {
  const { isLoggedIn, userInfo } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders()
    }
  }, [isLoggedIn])

  const loadOrders = async () => {
    if (!userInfo?.openid) {
      console.log('openid不存在')
      return
    }
    setLoading(true)
    try {
      const result = await authService.getUserOrders(userInfo.openid)
      console.log('订单结果:', result)
      if (result.success && result.orders) {
        setOrders(result.orders)
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderClick = (_order: Order) => {
    Taro.showToast({ title: '订单详情开发中', icon: 'none' })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (!isLoggedIn) {
    return (
      <View className='order-list-page'>
        <View className='empty-state'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>请先登录查看订单</Text>
          <Button className='login-btn' onClick={() => Taro.navigateTo({ url: '/packages/auth/pages/index' })}>
            立即登录
          </Button>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className='order-list-page'>
        <View className='loading-state'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='order-list-page'>
      {orders.length === 0 ? (
        <View className='empty-state'>
          <Text className='empty-icon'>📋</Text>
          <Text className='empty-text'>暂无订单</Text>
          <Text className='empty-desc'>快去预订酒店吧</Text>
        </View>
      ) : (
        <View className='order-list'>
          {orders.map((order) => {
            const status = statusMap[order.status] || { text: order.status || '未知', color: '#999' }
            return (
              <View key={order.id} className='order-card' onClick={() => handleOrderClick(order)}>
                <View className='order-header'>
                  <Text className='hotel-name'>{order.hotel_name || '未知酒店'}</Text>
                  <Text className='order-status' style={{ color: status.color }}>{status.text}</Text>
                </View>
                <View className='order-body'>
                  <Text className='room-type'>{order.room_type || '标准间'}</Text>
                  <Text className='date-range'>
                    {formatDate(order.check_in_date)} - {formatDate(order.check_out_date)} · {order.nights}晚
                  </Text>
                </View>
                <View className='order-footer'>
                  <Text className='total-amount'>¥{Number(order.total_amount).toFixed(2)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

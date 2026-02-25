import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Image } from '@tarojs/components'
import { authService } from '@/services/auth'
import { useUserStore } from '@/store/userStore'
import './index.scss'

interface OrderDetail {
  id: number
  hotel_id: number
  hotel_name: string
  hotel_image: string
  room_type: string
  check_in_date: string
  check_out_date: string
  nights: number
  adult_count: number
  child_count: number
  guest_name: string
  guest_phone: string
  total_amount: number
  paid_amount: number
  special_requests: string
  status: number
  created_at: string
  rooms: any[]
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '已取消', color: '#9e9e9e' },
  1: { text: '待支付', color: '#ff9800' },
  2: { text: '已支付', color: '#4caf50' },
  3: { text: '已完成', color: '#2196f3' },
  4: { text: '已退款', color: '#f44336' }
}

export default function OrderDetail() {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const userStore = useUserStore()
  const userInfo = userStore.userInfo

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const orderId = instance.router?.params?.id
    if (orderId) {
      loadOrderDetail(orderId)
    }
  }, [])

  const loadOrderDetail = async (orderId: string) => {
    setLoading(true)
    try {
      const result = await authService.getOrderDetail(orderId)
      if (result.success && result.order) {
        setOrder(result.order)
      }
    } catch (error) {
      console.error('加载订单详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const handlePay = () => {
    Taro.showToast({ title: '支付功能开发中', icon: 'none' })
  }

  const handleCancel = async () => {
    if (!userInfo?.openid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认退款',
      content: '确定要申请退款吗？退款后订单将变为已退款状态。',
      success: async (res) => {
        if (res.confirm && order) {
          const result = await authService.refundOrder(String(order.id), userInfo.openid || '')
          if (result.success) {
            Taro.showToast({ title: result.message, icon: 'success' })
            loadOrderDetail(String(order.id))
          } else {
            Taro.showToast({ title: result.message, icon: 'none' })
          }
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!userInfo?.openid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认删除',
      content: '确定要删除该订单吗？此操作不可恢复。',
      success: async (res) => {
        if (res.confirm && order) {
          const result = await authService.deleteOrder(String(order.id), userInfo.openid || '')
          if (result.success) {
            Taro.showToast({ title: result.message, icon: 'success' })
            Taro.navigateBack()
          } else {
            Taro.showToast({ title: result.message, icon: 'none' })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className='order-detail-page'>
        <View className='loading'>加载中...</View>
      </View>
    )
  }

  if (!order) {
    return (
      <View className='order-detail-page'>
        <View className='empty'>订单不存在</View>
      </View>
    )
  }

  const status = statusMap[order.status] || { text: '未知', color: '#999' }

  return (
    <View className='order-detail-page'>
      {/* 订单状态 */}
      <View className='status-bar'>
        <Text className='status-text' style={{ color: status.color }}>{status.text}</Text>
      </View>

      {/* 酒店信息 */}
      <View className='hotel-card'>
        <Image 
          className='hotel-image' 
          src={order.hotel_image || 'https://via.placeholder.com/120x90'} 
          mode='aspectFill'
        />
        <View className='hotel-info'>
          <Text className='hotel-name'>{order.hotel_name}</Text>
          <Text className='room-type'>{order.room_type}</Text>
        </View>
      </View>

      {/* 入住信息 */}
      <View className='info-section'>
        <View className='info-row'>
          <Text className='info-label'>入住日期</Text>
          <Text className='info-value'>{formatDate(order.check_in_date)}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>退房日期</Text>
          <Text className='info-value'>{formatDate(order.check_out_date)}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>入住晚数</Text>
          <Text className='info-value'>{order.nights}晚</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>入住人数</Text>
          <Text className='info-value'>成人{order.adult_count}人{order.child_count > 0 ? `，儿童${order.child_count}人` : ''}</Text>
        </View>
      </View>

      {/* 住客信息 */}
      <View className='info-section'>
        <View className='section-title'>住客信息</View>
        <View className='info-row'>
          <Text className='info-label'>住客姓名</Text>
          <Text className='info-value'>{order.guest_name}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>联系电话</Text>
          <Text className='info-value'>{order.guest_phone}</Text>
        </View>
        {order.special_requests && (
          <View className='info-row'>
            <Text className='info-label'>特殊要求</Text>
            <Text className='info-value'>{order.special_requests}</Text>
          </View>
        )}
      </View>

      {/* 订单信息 */}
      <View className='info-section'>
        <View className='section-title'>订单信息</View>
        <View className='info-row'>
          <Text className='info-label'>订单编号</Text>
          <Text className='info-value'>{order.id}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>下单时间</Text>
          <Text className='info-value'>{formatDate(order.created_at)}</Text>
        </View>
      </View>

      {/* 费用明细 */}
      <View className='info-section'>
        <View className='section-title'>费用明细</View>
        <View className='info-row'>
          <Text className='info-label'>订单金额</Text>
          <Text className='info-value'>¥{order.total_amount}</Text>
        </View>
        <View className='info-row'>
          <Text className='info-label'>实付金额</Text>
          <Text className='info-value price'>¥{order.paid_amount}</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='action-bar'>
        {order.status === 1 && (
          <>
            <Button className='btn-cancel' onClick={handleCancel}>取消订单</Button>
            <Button className='btn-pay' onClick={handlePay}>立即支付</Button>
          </>
        )}
        {order.status === 2 && (
          <>
            <Button className='btn-refund' onClick={handleCancel}>申请退款</Button>
            <Button className='btn-delete' onClick={handleDelete}>删除订单</Button>
          </>
        )}
        {(order.status === 0 || order.status === 3 || order.status === 4) && (
          <Button className='btn-delete' onClick={handleDelete}>删除订单</Button>
        )}
      </View>
    </View>
  )
}

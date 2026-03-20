import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import { Input, Button } from '@nutui/nutui-react-taro'
import { useBookingStore } from '@/store/bookingStore'
import { useUserStore } from '@/store/userStore'
import { callSupabase } from '@/utils/supabase'  // 替换为你实际路径
import './index.scss'

const getDayOfWeek = (dateStr: string) => {
  if (!dateStr) return ''
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? '' : days[d.getDay()]
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getMonth() + 1}月${d.getDate()}日`
}



type PayStatus = 'paying' | 'success'

const OrderPage = () => {
  const { hotelId, checkInDate, checkOutDate, nights, items, totalPrice } = useBookingStore()
  const { isLoggedIn, userInfo } = useUserStore()

  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [payStatus, setPayStatus] = useState<PayStatus>('paying')
  const [rotation, setRotation] = useState(0)
  const animFrameRef = useRef<number | null>(null)

  const totalRoomCount = items.reduce((sum, i) => sum + i.count, 0)
  const adultCount = items.reduce((sum, i) => sum + i.adultCount * i.count, 0) || 1
  const childCount = items.reduce((sum, i) => sum + i.childCount * i.count, 0) || 0

  // 旋转动画
  useEffect(() => {
    if (payStatus !== 'paying' || !showModal) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }
    let last = 0
    const animate = (ts: number) => {
      if (last) setRotation(r => (r + (ts - last) * 0.36) % 360)
      last = ts
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [payStatus, showModal])

  const submitOrder = async () => {
    // 获取用户真实UUID
    let userUuid: string | null = null
    if (userInfo?.openid) {
      try {
        const result = await Taro.cloud.callFunction({
          name: 'auth-service',
          data: { action: 'get_user_id_by_openid', p_openid: userInfo.openid }
        })
        const res = result.result as any
        if (res?.data) {
          userUuid = res.data as string
        }
      } catch (e) {
        console.error('获取用户UUID失败:', e)
      }
    }

    if (!isLoggedIn || !userInfo?.openid) {
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

    if (!userUuid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const total = totalPrice()

    // 1. 插入订单
    const { data: orderData, error } = await callSupabase({
      action: 'table',
      table: 'orders',
      method: 'insert',
      data: {
        user_id: userUuid,
        hotel_id: hotelId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        nights,
        adult_count: adultCount,
        child_count: childCount,
        guest_name: guestName.trim(),
        guest_phone: phone,
        total_amount: total,
        paid_amount: total,
        special_requests: null,
      },
    })

    if (error) throw error

    const orderId = orderData[0].id

    // 2. 插入 order_items
    const itemInsertErrors = await Promise.all(
      items.map(item => callSupabase({
        action: 'table',
        table: 'order_items',
        method: 'insert',
        data: {
          order_id: orderId,
          room_type_id: item.roomTypeId,
          quantity: item.count,
          price_per_night: item.price,
        },
      }))
    )
    const itemInsertError = itemInsertErrors.find(r => r.error)
    if (itemInsertError?.error) throw itemInsertError.error

  }

  const handlePay = () => {
    if (!guestName.trim()) {
      Taro.showToast({ title: '请输入住客姓名', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    setPayStatus('paying')
    setRotation(0)
    setShowModal(true)

    setTimeout(async () => {
      try {
        await submitOrder()
        setPayStatus('success')
        setTimeout(() => {
          setShowModal(false)
          Taro.navigateBack()
        }, 1500)
      } catch (e) {
        console.error(e)
        setShowModal(false)
        Taro.showToast({ title: '支付失败，请重试', icon: 'none' })
      }
    }, 2000)
  }

  return (
    <View className='order-page'>

      {/* ① 预订信息卡片 */}
      <View className='card'>
        <View className='date-row'>
          <View className='date-col'>
            <Text className='date-main'>{formatDate(checkInDate)} {getDayOfWeek(checkInDate)}</Text>
          </View>
          <View className='date-mid'>
            <Text className='nights-badge'>{nights}晚</Text>
            <Text className='dash-line'>——</Text>
          </View>
          <View className='date-col date-col-right'>
            <Text className='date-main'>{formatDate(checkOutDate)} {getDayOfWeek(checkOutDate)}</Text>
          </View>
        </View>
        <View className='divider' />
        <View className='room-type'>
          {items.map((item) => (
            <Text key={item.roomTypeId} className='room-desc'>
              {item.roomName} × {item.count}间｜¥{item.price}/晚
            </Text>
          ))}
        </View>
      </View>

      {/* ② 订房信息卡片 */}
      <View className='card'>
        <View className='section-header'>
          <View className='title-wrap'>
            <Text className='section-title'>订房信息</Text>
          </View>
          <View className='counter-wrap'>
            <Text className='room-count-text'>{totalRoomCount}间</Text>
          </View>
        </View>

        <View className='form-row'>
          <View className='label-group'>
            <Text className='required'>*</Text>
            <Text className='label'>住客姓名</Text>
          </View>
          <View className='input-group'>
            <Input
              className='nut-input-field'
              placeholder='请输入住客姓名'
              value={guestName}
              style={{ '--nutui-input-font-size': '15px' } as React.CSSProperties}
              onChange={(val) => setGuestName(val)}
            />
            <Text className='icon-btn'>🧑‍💼</Text>
          </View>
        </View>

        <View className='row-line' />

        <View className='form-row'>
          <View className='label-group'>
            <Text className='required'>*</Text>
            <Text className='label'>联系手机</Text>
          </View>
          <View className='input-group'>
            <Text className='country-code'>+86 ∨</Text>
            <Input
              className='nut-input-field phone-field'
              placeholder='用于接收通知'
              type='number'
              value={phone}
              style={{ '--nutui-input-font-size': '15px' } as React.CSSProperties}
              onChange={(val) => setPhone(val)}
            />
            <Text className='icon-btn'>📋</Text>
          </View>
        </View>
      </View>

      {/* ③ 底部支付栏 */}
      <View className='pay-bar'>
        <View className='pay-info'>
          <Text className='pay-label'>在线付</Text>
          <Text className='pay-price'>¥{totalPrice()}</Text>
        </View>
        <Button className='pay-btn' onClick={handlePay}>
          立即支付
        </Button>
      </View>

      {/* ④ 支付弹窗 */}
      {showModal && (
        <View className='pay-modal-mask'>
          <View className='pay-modal'>
            {payStatus === 'paying' ? (
              <>
                <View
                  className='pay-spinner'
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  ⏳
                </View>
                <Text className='pay-modal-text'>支付处理中...</Text>
              </>
            ) : (
              <>
                <Text className='pay-success-icon'>✅</Text>
                <Text className='pay-modal-text'>支付成功！</Text>
              </>
            )}
          </View>
        </View>
      )}

    </View>
  )
}

export default OrderPage
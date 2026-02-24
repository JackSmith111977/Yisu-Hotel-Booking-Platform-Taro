import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components'
import { callSupabase } from "@/utils/supabase";
import { RoomGuest } from '@/types/detailPage/RoomList';
import { recommendRooms, RecommendResult } from '@/utils/recommendRooms'
import { useSearchStore } from '@/store/searchStore';
import {
  Calendar,
  Popup,
  InputNumber,
  Divider,
  Button,
} from '@nutui/nutui-react-taro'
import './index.scss'
import Counter from '../Counter'

/* ========== 工具函数 ========== */
const formatDate = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`

const getDayLabel = (d: Date) => {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (isSame(d, today)) return '今天'
  if (isSame(d, tomorrow)) return '明天'
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

const diffDays = (s: Date, e: Date) =>
  Math.round((e.getTime() - s.getTime()) / 86400000)

const toStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* ========== 主组件 ========== */
interface BookingDateBarProps {
  hotelId: number
  onDateChange?: (start: Date, end: Date, nights: number) => void
  onRoomGuestChange?: (data: RoomGuest) => void
  onRecommendResult?: (result: RecommendResult | null) => void
}

const BookingDateBar = ({ hotelId, onDateChange, onRoomGuestChange, onRecommendResult }: BookingDateBarProps) => {
  /* ---- 日期 ---- */
  // const [startDate, setStartDate] = useState<Date>(() => new Date())
  // const [endDate, setEndDate] = useState<Date>(() => {
  //   const d = new Date()
  //   d.setDate(d.getDate() + 1)
  //   return d
  // })
  const params = useSearchStore((state) => state.params)
  const [startDate, setStartDate] = useState<Date>(() => new Date(params.checkInDate))
  const [endDate, setEndDate] = useState<Date>(() => new Date(params.checkOutDate))
  const [calendarVisible, setCalendarVisible] = useState(false)

  /* ---- 房间人数 ---- */
  const [roomGuest, setRoomGuest] = useState<RoomGuest>({
    rooms: 1,
    adults: 1,
    children: 0,
  })
  const [tempRoomGuest, setTempRoomGuest] = useState<RoomGuest>({
    rooms: 1,
    adults: 1,
    children: 0,
  })
  const [popupVisible, setPopupVisible] = useState(false)
  /* ---- 推荐结果 ---- */
  const [recommendResult, setRecommendResult] = useState<RecommendResult | null>(null)
  const [isRecommending, setIsRecommending] = useState(false)

  /* ---- 派生数据 ---- */
  const nights = useMemo(() => diffDays(startDate, endDate), [startDate, endDate])

  const calendarStart = useMemo(() => toStr(new Date()), [])
  // const [calendarEnd, setCalendarEnd] = useState<string>(() => {
  //   const d = new Date()
  //   d.setDate(d.getDate() + 30)   // 默认显示三十天
  //   return toStr(d)
  // })
  const calendarDefault = useMemo(() => {
    return [toStr(startDate), toStr(endDate)];
  }, [startDate, endDate])

  /* ---- 推荐逻辑 ---- */
  const triggerRecommend = useCallback(async (
    guest: RoomGuest,
    start: Date,
    end: Date,
    nightCount: number
  ) => {
    setIsRecommending(true)
    try {
      const result = await recommendRooms(
        hotelId,
        guest.rooms,
        guest.adults,
        guest.children,
        toStr(start),
        toStr(end),
        nightCount
      )
      setRecommendResult(result)
      onRecommendResult?.(result)
      console.log("推荐结果为：", result)
    } catch (err) {
      console.error('recommendRooms error', err)
      setRecommendResult(null)
      onRecommendResult?.(null)
    } finally {
      setIsRecommending(false)
    }
  }, [hotelId, onRecommendResult])

  /* ---- 日历回调 ---- */
  const onCalendarConfirm = useCallback(([s, e]: any) => {
    if (s && e) {
      const start = new Date(s[3])
      const end = new Date(e[3])
      const nightCount = diffDays(start, end)
      setStartDate(start)
      setEndDate(end)
      onDateChange?.(start, end, nightCount)
      triggerRecommend(roomGuest, start, end, nightCount)  // 用最新日期 + 当前人数
    }
    setCalendarVisible(false)
  }, [onDateChange, triggerRecommend, roomGuest])

  // useEffect(() => {
  //   const fetchMaxDate = async () => {
  //     const res = await callSupabase({
  //       action: 'rpc',
  //       rpcName: 'get_max_availability_date',
  //     })
  
  //     if (!res.error && res.data) {
  //       setCalendarEnd(res.data)
  //     }
  //   }
  
  //   fetchMaxDate()
  // }, [])

  /* ---- 房间弹窗回调 ---- */
  const openPopup = useCallback(() => {
    setTempRoomGuest({ ...roomGuest })
    setPopupVisible(true)
  }, [roomGuest])

  const onPopupConfirm = useCallback(() => {
    const confirmed = { ...tempRoomGuest }
    setRoomGuest(confirmed)
    onRoomGuestChange?.(confirmed)
    setPopupVisible(false)
    triggerRecommend(confirmed, startDate, endDate, nights)  // 用最新人数 + 当前日期
  }, [tempRoomGuest, startDate, endDate, nights, onRoomGuestChange, triggerRecommend])

  /* ---- 人数-间数 逻辑计算 ---- */
  const resolveRoomGuest = (
    prev: RoomGuest,
    patch: Partial<RoomGuest>
  ): RoomGuest => {
    const merged = { ...prev, ...patch }
    const adults = Math.max(merged.adults, merged.rooms)
    const rooms = Math.min(merged.rooms, adults)
    return { rooms, adults, children: merged.children }
  }

  const handleRoomsChange = useCallback((v: number) => {
    setTempRoomGuest((p) => resolveRoomGuest(p, { rooms: Number(v) }))
  }, [])
  
  const handleAdultsChange = useCallback((v: number) => {
    setTempRoomGuest((p) => resolveRoomGuest(p, { adults: Number(v) }))
  }, [])
  
  const handleChildrenChange = useCallback((v: number) => {
    setTempRoomGuest((p) => resolveRoomGuest(p, { children: Number(v) }))
  }, [])

  return (
    <View className='hotel-search-bar'>
      <View className='search-row'>
        {/* 日期 */}
        <View className='date-section' onClick={() => setCalendarVisible(true)}>
          <View className='date-item'>
            <Text className='date-label'>{getDayLabel(startDate)}</Text>
            <Text className='date-value'>{formatDate(startDate)}</Text>
          </View>
          <Text className='date-sep'>-</Text>
          <View className='date-item'>
            <Text className='date-label'>{getDayLabel(endDate)}</Text>
            <Text className='date-value'>{formatDate(endDate)}</Text>
          </View>
        </View>

        {/* 晚数 */}
        <View className='nights-tag'>
          <Text className='nights-text'>共{nights}晚</Text>
        </View>

        {/* 间数人数 */}
        <View className='room-section' onClick={openPopup}>
          <Text className='room-label'>间数人数</Text>
          <Text className='room-value'>
            {roomGuest.rooms}间 {roomGuest.adults}大 {roomGuest.children}小
          </Text>
        </View>
      </View>

      {/* 选房推荐组件 */}
      {/* {recommendResult && (
        <RoomRecommendResult
          result={recommendResult}
          nights={2}
        />
      )} */}

      {/* 弹窗组件 */}
      <Calendar
        visible={calendarVisible}
        defaultValue={calendarDefault}
        type='range'
        startDate={calendarStart}
        // endDate={calendarEnd}
        onClose={() => setCalendarVisible(false)}
        onConfirm={onCalendarConfirm}
        renderBottomButton={() => (
          <View className='calendar-footer'>
            <Button 
              type='info' size='large'
              style={{
                width: '70%',
                '--nutui-button-large-font-size':'15px',
                '--nutui-button-large-height': '35px'
              } as React.CSSProperties}
            >
              确认
            </Button>
          </View>
        )}
      />

      <Popup
        visible={popupVisible}
        position='bottom'
        round
        closeable
        title='选择客房和入住人数'
        onClose={() => setPopupVisible(false)}
        style={{
          '--nutui-popup-title-font-size':'15px'
        } as React.CSSProperties} 
      >
        <View className='room-popup'>
          {/* 提示 */}
          <View className='tip-bar'>
            <Text className='tip-icon'>ℹ</Text>
            <Text className='tip-text'>入住人数较多时，请增加间数</Text>
          </View>

          {/* 间数 */}
          <View className='field-row'>
            <Text className='field-label'>间数</Text>
            <Counter
              value={tempRoomGuest.rooms}
              min={1}
              // max={5}
              onChange={handleRoomsChange}
            />
          </View>

          <Divider style={{ margin: 0, padding: '0 32px' }} />

          {/* 成人数 */}
          <View className='field-row'>
            <Text className='field-label'>成人数</Text>
            <Counter
              value={tempRoomGuest.adults}
              min={tempRoomGuest.rooms}
              max={20}
              onChange={handleAdultsChange}
            />
          </View>

          <Divider style={{ margin: 0, padding: '0 32px' }} />

          {/* 儿童数 */}
          <View className='field-row'>
            <View className='field-label-group'>
              <Text className='field-label'>儿童数</Text>
              <Text className='field-sub'>0-17岁</Text>
            </View>
            <Counter
              value={tempRoomGuest.children}
              min={0}
              max={20}
              onChange={handleChildrenChange}
            />
          </View>

          {/* 完成 */}
          <View className='popup-footer'>
            <Button 
              type='info' size='large' onClick={onPopupConfirm}
              style={{
                width: '70%',
                '--nutui-button-large-font-size':'15px',
                '--nutui-button-large-height': '35px'
              } as React.CSSProperties}
            >
              完成
            </Button>
          </View>
        </View>
      </Popup>
    </View>
  )
}

export default React.memo(BookingDateBar)
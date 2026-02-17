import React, { useState, useMemo, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import {
  Calendar,
  Popup,
  InputNumber,
  Divider,
  Button,
} from '@nutui/nutui-react-taro'
import RoomList from '../RoomList'
import './index.scss'

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

/* ========== 类型 ========== */
interface RoomGuest {
  rooms: number
  adults: number
  children: number
}

interface BookingDateBarProps {
  onDateChange?: (start: Date, end: Date, nights: number) => void
  onRoomGuestChange?: (data: RoomGuest) => void
}

/* ========== 主组件 ========== */
const BookingDateBar = ({ onDateChange, onRoomGuestChange}: BookingDateBarProps) => {
  /* ---- 日期 ---- */
  const [startDate, setStartDate] = useState<Date>(() => new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d
  })
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

  /* ---- 派生数据 ---- */
  const nights = useMemo(() => diffDays(startDate, endDate), [startDate, endDate])

  const calendarStart = useMemo(() => toStr(new Date()), [])
  const calendarEnd = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 90)
    return toStr(d)
  }, [])
  const calendarDefault = useMemo(() => {
    return [toStr(startDate), toStr(endDate)];
  }, [startDate, endDate])

  /* ---- 日历回调 ---- */
  const onCalendarConfirm = useCallback(([s, e]: any) => {
    if (s && e) {
      const start = new Date(s[3])  // 获取类似"2026/03/09"
      const end = new Date(e[3])
      setStartDate(start)
      setEndDate(end)
      onDateChange?.(start, end, diffDays(start, end))
    }
    setCalendarVisible(false)
  }, [onDateChange])

  /* ---- 房间弹窗回调 ---- */
  const openPopup = useCallback(() => {
    setTempRoomGuest({ ...roomGuest })
    setPopupVisible(true)
  }, [roomGuest])

  const onConfirm = useCallback(() => {
    setRoomGuest({ ...tempRoomGuest })
    onRoomGuestChange?.({ ...tempRoomGuest })
    setPopupVisible(false)
  }, [tempRoomGuest, onRoomGuestChange])

  /* ---- 渲染 ---- */
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

      {/* 弹窗组件 */}
      <Calendar
        visible={calendarVisible}
        defaultValue={calendarDefault}
        type='range'
        startDate={calendarStart}
        endDate={calendarEnd}
        onClose={() => setCalendarVisible(false)}
        onConfirm={onCalendarConfirm}
        renderBottomButton={() => (
          <View className='calendar-footer'>
            <Button 
              type='info' size='large' onClick={onConfirm}
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
            <InputNumber
              value={tempRoomGuest.rooms}
              min={1}
              max={10}
              onChange={(v) =>
                setTempRoomGuest((p) => ({ ...p, rooms: Number(v) }))
              }
              style={{
                '--nutui-inputnumber-input-font-size':'15px',
                '--nutui-inputnumber-input-margin':'10px',
                '--nutui-inputnumber-button-width': '18px'
              } as React.CSSProperties}
            />
          </View>

          <Divider style={{ margin: 0, padding: '0 32px' }} />

          {/* 成人数 */}
          <View className='field-row'>
            <Text className='field-label'>成人数</Text>
            <InputNumber
              value={tempRoomGuest.adults}
              min={1}
              max={20}
              onChange={(v) =>
                setTempRoomGuest((p) => ({ ...p, adults: Number(v) }))
              }
              style={{
                '--nutui-inputnumber-input-font-size':'15px',
                '--nutui-inputnumber-input-margin':'10px',
                '--nutui-inputnumber-button-width': '18px'
              } as React.CSSProperties}
            />
          </View>

          <Divider style={{ margin: 0, padding: '0 32px' }} />

          {/* 儿童数 */}
          <View className='field-row'>
            <View className='field-label-group'>
              <Text className='field-label'>儿童数</Text>
              <Text className='field-sub'>0-17岁</Text>
            </View>
            <InputNumber
              value={tempRoomGuest.children}
              min={0}
              max={10}
              onChange={(v) =>
                setTempRoomGuest((p) => ({ ...p, children: Number(v) }))
              }
              style={{
                '--nutui-inputnumber-input-font-size':'15px',
                '--nutui-inputnumber-input-margin':'10px',
                '--nutui-inputnumber-button-width': '18px'
              } as React.CSSProperties}
            />
          </View>

          {/* 完成 */}
          <View className='popup-footer'>
            <Button 
              type='info' size='large' onClick={onConfirm}
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
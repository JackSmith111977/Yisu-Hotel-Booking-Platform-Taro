import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

// 标签图标映射（emoji 轻量方案，也可换成 NutUI 图标）
const TAG_ICONS: Record<string, string> = {
  '免费WiFi': '📶',
  '免费停车': '🅿️',
  '24小时前台': '🕐',
  '行李寄存': '🧳',
  '叫醒服务': '⏰',
  '外币兑换': '💱',
  '含早餐': '🍳',
  '含双早': '🍳',
  '西餐厅': '🍽️',
  '中餐厅': '🥢',
  '酒吧': '🍸',
  '咖啡厅': '☕',
  '客房送餐': '🛎️',
  '室内游泳池': '🏊',
  '室外游泳池': '🏊',
  '健身中心': '💪',
  'SPA水疗': '💆',
  '桑拿': '🧖',
  '儿童乐园': '🎠',
  '棋牌室': '🀄',
  '商务中心': '💼',
  '会议室': '📋',
  '免费打印': '🖨️',
  'VIP贵宾室': '⭐',
  '机场接送': '✈️',
  '市中心': '🏙️',
  '海景房': '🌊',
  '山景房': '⛰️',
  '近地铁': '🚇',
  '近景区': '🗺️',
  '度假村': '🏖️',
}

// 高优先级标签（优先展示）
const HIGH_PRIORITY = ['免费WiFi', '含早餐', '含双早', '近地铁', '免费停车', '海景房', '山景房', '室内游泳池']

interface HotelTagsProps {
  tags: string[]
}

const HotelTags = ({ tags }: HotelTagsProps) => {
  const [expanded, setExpanded] = useState(false)

  if (!tags || tags.length === 0) return null

  // 高优先级排前面
  const sorted = [
    ...tags.filter(t => HIGH_PRIORITY.includes(t)),
    ...tags.filter(t => !HIGH_PRIORITY.includes(t)),
  ]

  const PREVIEW_COUNT = 3
  const showToggle = sorted.length > PREVIEW_COUNT
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT)

  return (
    <View className='hotel-tags'>
      <View className='hotel-tags__list'>
        {visible.map(tag => (
          <View key={tag} className='hotel-tags__item'>
            {TAG_ICONS[tag] && (
              <Text className='hotel-tags__icon'>{TAG_ICONS[tag]}</Text>
            )}
            <Text className='hotel-tags__label'>{tag}</Text>
          </View>
        ))}

        {showToggle && (
          <View
            className='hotel-tags__toggle'
            onClick={() => setExpanded(v => !v)}
          >
            <Text>{expanded ? '收起' : `+${sorted.length - PREVIEW_COUNT}`}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default HotelTags
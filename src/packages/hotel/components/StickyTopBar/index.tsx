import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, HeartF, ShareF } from '@nutui/icons-react-taro'
import './index.scss'

interface StickyTopBarProps {
  visible: boolean
  name?: string
}

export default function StickyTopBar({ visible, name }: StickyTopBarProps) {
  const systemInfo = Taro.getWindowInfo()
  const menuBtn = Taro.getMenuButtonBoundingClientRect()

  const statusBarHeight = systemInfo.statusBarHeight ?? 20
  const screenWidth = systemInfo.windowWidth

  const btnHeight = menuBtn.height
  const btnTop = menuBtn.top - statusBarHeight
  const rightGap = screenWidth - menuBtn.right
  const rightOffset = screenWidth - menuBtn.left + 8

  return (
    <View
      className={`sticky-nav ${visible ? 'sticky-nav-visible' : ''}`}
      style={{ 
        paddingTop: `${statusBarHeight}px`,
        paddingBottom: '10px'
      }}
    >
      <View
        className='sticky-nav-inner'
        style={{
          height: `${btnHeight}px`,
          marginTop: `${btnTop}px`,
          paddingLeft: `${rightGap}px`,
          paddingRight: `${rightOffset}px`,
        }}
      >
        <View
          className='sticky-nav-btn'
          style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          onClick={handleBack}
        >
          <ArrowLeft size={18} color='#333' />
        </View>

        <View className='sticky-nav-title'>
          <Text className='sticky-nav-title-text'>{name}</Text>
        </View>

        <View className='sticky-nav-right'>
          <View className='sticky-nav-action'>
            <HeartF size={14} color='#333' />
            <Text className='sticky-nav-action-label'>收藏</Text>
          </View>
          <View className='sticky-nav-action'>
            <ShareF size={14} color='#333' />
            <Text className='sticky-nav-action-label'>分享</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function handleBack() {
  const pages = Taro.getCurrentPages()
  if (pages.length > 1) {
    Taro.navigateBack()
  } else {
    Taro.switchTab({ url: '/pages/index/index' })
  }
}
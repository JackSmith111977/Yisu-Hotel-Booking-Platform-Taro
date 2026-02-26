import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, HeartF, Heart, ShareF, Loading } from '@nutui/icons-react-taro'
import './index.scss'

interface TopNavBarProps {
  isFavorited?: boolean
  onToggleFavorite?: () => void
  loading?: boolean
}

export default function TopNavBar({ isFavorited, onToggleFavorite, loading }: TopNavBarProps) {
  const systemInfo = Taro.getWindowInfo()
  const menuBtn = Taro.getMenuButtonBoundingClientRect()

  const statusBarHeight = systemInfo.statusBarHeight ?? 20
  const screenWidth = systemInfo.windowWidth

  const btnHeight = menuBtn.height
  const btnTop = menuBtn.top - statusBarHeight
  const rightGap = screenWidth - menuBtn.right
  const rightOffset = screenWidth - menuBtn.left + 8

  const handleFavoriteClick = () => {
    if (onToggleFavorite) {
      onToggleFavorite()
    }
  }

  return (
    <View
      className='top-nav'
      style={{ paddingTop: `${statusBarHeight}px` }}
    >
      <View
        className='nav-inner'
        style={{
          height: `${btnHeight}px`,
          marginTop: `${btnTop}px`,
          paddingLeft: `${rightGap}px`,
          paddingRight: `${rightOffset}px`,
        }}
      >
        <View
          className='nav-btn'
          style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          onClick={handleBack}
        >
          <ArrowLeft size={18} color='#fff' />
        </View>

        <View className='nav-right'>
          <View
            className={`nav-btn ${loading ? 'loading' : ''}`}
            style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
            onClick={handleFavoriteClick}
          >
            {loading ? (
              <Loading size={16} color='#fff' />
            ) : isFavorited ? (
              <Heart size={16} color='#ff4d4f' />
            ) : (
              <HeartF size={16} color='#fff' />
            )}
          </View>
          {/* <View
            className='nav-btn'
            style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          >
            <ShareF size={16} color='#fff' />
          </View> */}
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
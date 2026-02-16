import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ArrowLeft, HeartF, ShareF } from '@nutui/icons-react-taro'
import './index.scss'

export default function TopNavBar() {
  const systemInfo = Taro.getWindowInfo()
  const menuBtn = Taro.getMenuButtonBoundingClientRect()

  const statusBarHeight = systemInfo.statusBarHeight ?? 20
  const screenWidth = systemInfo.windowWidth

  // 胶囊按钮的高度和垂直位置
  const btnHeight = menuBtn.height            // 胶囊高度（一般 32px）
  const btnTop = menuBtn.top - statusBarHeight // 胶囊相对于状态栏底部的偏移
  const rightGap = screenWidth - menuBtn.right // 胶囊右边距屏幕右边的距离
  const rightOffset = screenWidth - menuBtn.left + 8 // 自定义按钮区域的 right 值（胶囊左边再留 8px）

  return (
    <View
      className='top-nav'
      style={{ paddingTop: `${statusBarHeight}px` }}
    >
      <View
        className='top-nav__inner'
        style={{
          height: `${btnHeight}px`,
          marginTop: `${btnTop}px`,
          paddingLeft: `${rightGap}px`,   // 左边距和胶囊右边距保持一致
          paddingRight: `${rightOffset}px`, // 右边留出胶囊按钮的空间
        }}
      >
        {/* 左侧返回 */}
        <View
          className='top-nav__btn'
          style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          onClick={handleBack}
        >
          <ArrowLeft size={18} color='#fff' />
        </View>

        {/* 右侧按钮组，紧贴胶囊左边 */}
        <View className='top-nav__right'>
          <View
            className='top-nav__btn'
            style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          >
            <HeartF size={16} color='#fff' />
          </View>
          <View
            className='top-nav__btn'
            style={{ width: `${btnHeight}px`, height: `${btnHeight}px` }}
          >
            <ShareF size={16} color='#fff' />
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
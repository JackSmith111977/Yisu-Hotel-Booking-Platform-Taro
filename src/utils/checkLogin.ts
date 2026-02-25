import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/userStore'

export const checkLogin = (): boolean => {
  const { isLoggedIn } = useUserStore.getState()
  if (!isLoggedIn) {
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
    return false
  }
  return true
}

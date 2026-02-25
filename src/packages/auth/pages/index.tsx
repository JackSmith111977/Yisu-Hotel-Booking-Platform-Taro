import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import { useUserStore } from '@/store/userStore'
import { authService } from '@/services/auth'
import './index.scss'

export default function LoginPage() {
  const { login } = useUserStore()
  const [loading, setLoading] = useState(false)

  // 获取用户信息并登录（真实的微信授权登录）
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      // 获取微信用户信息（需要用户主动点击授权）
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      const userInfo = userInfoRes.userInfo
      console.log('获取到的微信用户信息:', userInfo)

      // 调用登录服务，云函数会自动获取openid
      const authResult = await authService.wechatLogin(
        userInfo.nickName,
        userInfo.avatarUrl,
        userInfo.gender
      )

      if (authResult.success && authResult.user) {
        login(authResult.user)
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: authResult.message || '登录失败', icon: 'none' })
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='house-icon'>🏠</Text>
        <Text className='subtitle'>欢迎使用易宿酒店预订平台</Text>
      </View>

      <View className='wechat-login'>
        <Button
          className='login-btn wechat-btn'
          disabled={loading}
          onClick={handleWechatLogin}
        >
          {loading ? '登录中...' : '微信一键登录'}
        </Button>
      </View>
    </View>
  )
}
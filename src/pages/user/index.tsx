import Taro from '@tarojs/taro'
import { View, Text, Image, Button } from '@tarojs/components'
import { useUserStore } from '@/store/userStore'
import './index.scss'

interface MenuItem {
  icon: string
  iconBg: string
  title: string
  desc: string
  onClick: () => void
}

export default function User() {
  const { isLoggedIn, userInfo, logout } = useUserStore()

  const menuItems: MenuItem[] = [
    {
      icon: '📋',
      iconBg: '#fff3f0',
      title: '我的订单',
      desc: '查看全部订单',
      onClick: () => Taro.navigateTo({ url: '/packages/user/pages/order-list/index' })
    },
    {
      icon: '❤️',
      iconBg: '#fff0f5',
      title: '我的收藏',
      desc: '收藏的酒店',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  ]

  const handleLogin = () => {
    Taro.navigateTo({ url: '/packages/auth/pages/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }

  const handleEditProfile = () => {
    Taro.showToast({ title: '编辑资料功能开发中', icon: 'none' })
  }

  return (
    <View className='user-page'>
      {isLoggedIn && userInfo ? (
        <>
          <View className='user-header'>
            <View className='user-info'>
              <View className='avatar'>
                {userInfo.avatar ? (
                  <Image className='avatar-img' src={userInfo.avatar} mode='aspectFill' />
                ) : (
                  <Text className='avatar-placeholder'>👤</Text>
                )}
              </View>
              <View className='user-details'>
                <Text className='user-name'>{userInfo.nickname || '未设置昵称'}</Text>
              </View>
              <View className='edit-btn' onClick={handleEditProfile}>
                <Text>编辑</Text>
              </View>
            </View>
            <View className='user-stats'>
              <View className='stat-item'>
                <Text className='stat-value'>{userInfo.total_order_count || 0}</Text>
                <Text className='stat-label'>订单数量</Text>
              </View>
              <View className='stat-item'>
                <Text className='stat-value'>¥{(userInfo.total_spent_amount || 0).toFixed(2)}</Text>
                <Text className='stat-label'>累计消费</Text>
              </View>
            </View>
          </View>

          <View className='menu-section'>
            <View className='menu-card'>
              {menuItems.map((item, index) => (
                <View key={index} className='menu-item' onClick={item.onClick}>
                  <View className='menu-icon' style={{ background: item.iconBg }}>
                    <Text>{item.icon}</Text>
                  </View>
                  <View className='menu-content'>
                    <Text className='menu-title'>{item.title}</Text>
                    <Text className='menu-desc'>{item.desc}</Text>
                  </View>
                  <Text className='menu-arrow'>›</Text>
                </View>
              ))}
            </View>
          </View>

          <View className='logout-section'>
            <Button className='logout-btn' onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        </>
      ) : (
        <View className='login-prompt'>
          <View className='login-prompt-icon'>
            <Text>🏨</Text>
          </View>
          <Text className='login-prompt-text'>
            登录后即可查看您的订单、优惠券等信息
          </Text>
          <Button className='login-btn' onClick={handleLogin}>
            立即登录
          </Button>
        </View>
      )}
    </View>
  )
}
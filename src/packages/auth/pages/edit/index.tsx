import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Input, Button } from '@tarojs/components'
import { useUserStore } from '@/store/userStore'
import { authService } from '@/services/auth'
import './index.scss'

export default function EditProfile() {
  const { userInfo, updateUserInfo } = useUserStore()
  const [nickname, setNickname] = useState(userInfo?.nickname || '')
  const [avatar, setAvatar] = useState(userInfo?.avatar || '')
  const [saving, setSaving] = useState(false)

  const handleChooseAvatar = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFiles && res.tempFiles[0]) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const fileID = await handleUploadAvatar(tempFilePath)
        if (fileID) {
          setAvatar(fileID)
        }
      }
    } catch (error) {
      console.error('选择头像失败:', error)
      Taro.showToast({ title: '选择头像失败', icon: 'none' })
    }
  }

  const handleUploadAvatar = async (filePath: string) => {
    try {
      Taro.showLoading({ title: '上传中...' })

      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      
      const uploadRes = await Taro.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })

      console.log('上传成功:', uploadRes)
      
      const fileID = uploadRes.fileID
      Taro.hideLoading()
      
      return fileID
    } catch (error) {
      Taro.hideLoading()
      console.error('上传头像失败:', error)
      Taro.showToast({ title: '上传头像失败', icon: 'none' })
      return null
    }
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      const result = await authService.updateProfile({
        nickname: nickname.trim(),
        avatar: avatar || undefined
      })

      if (result.success) {
        updateUserInfo({
          nickname: nickname.trim(),
          avatar: avatar
        })
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: result.message || '保存失败', icon: 'none' })
      }
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='edit-profile-page'>
      <View className='avatar-section' onClick={handleChooseAvatar}>
        <View className='avatar-wrapper'>
          {avatar ? (
            <Image className='avatar-img' src={avatar} mode='aspectFill' />
          ) : (
            <Text className='avatar-placeholder'>👤</Text>
          )}
          <View className='avatar-tip'>点击更换头像</View>
        </View>
      </View>

      <View className='form-section'>
        <View className='form-item'>
          <Text className='label'>昵称</Text>
          <Input
            className='input'
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
            placeholder='请输入昵称'
            maxlength={20}
          />
        </View>
      </View>

      <View className='btn-section'>
        <Button
          className='save-btn'
          loading={saving}
          onClick={handleSave}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </View>
    </View>
  )
}

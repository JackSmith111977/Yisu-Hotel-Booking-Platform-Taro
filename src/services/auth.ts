import Taro from '@tarojs/taro';

// 用户信息接口（与wechat_users表结构对应）
export interface UserInfo {
  id?: string;
  openid?: string;
  nickname?: string;
  avatar?: string;
  gender?: number;
  created_at?: string;
  last_login_at?: string;
}

// 登录响应接口
export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: UserInfo;
}

class AuthService {
  // 微信登录
  async wechatLogin(
    nickname?: string,
    avatar?: string,
    gender?: number
  ): Promise<LoginResponse> {
    try {
      console.log('开始调用微信登录云函数，参数:', {
        nickname,
        avatar: avatar ? '有头像' : '无头像',
        gender
      });

      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'auth_wechat_login',
          p_nickname: nickname,
          p_avatar: avatar,
          p_gender: gender || 0
        },
      });

      console.log('云函数调用结果:', result);
      console.log('云函数返回的result.result:', result.result);

      // 处理记录格式的返回结果
      const resultData = result.result as any;
      if (resultData && resultData.data && Array.isArray(resultData.data) && resultData.data.length > 0) {
        const dbResult = resultData.data[0];
        
        if (dbResult.success) {
          console.log('登录成功，返回用户信息:', dbResult);
          
          // 将数据库记录格式转换为前端需要的格式
          return {
            success: true,
            user: {
              id: dbResult.user_id,
              openid: dbResult.user_openid,
              nickname: dbResult.user_nickname,
              avatar: dbResult.user_avatar,
              gender: dbResult.user_gender,
              created_at: dbResult.user_created_at,
              last_login_at: dbResult.user_last_login_at
            }
          };
        } else {
          // 登录失败
          console.error('登录失败，数据库返回失败状态');
          return {
            success: false,
            message: '登录失败'
          };
        }
      } else {
        console.error('云函数返回格式错误，详细内容:', result.result);
        return {
          success: false,
          message: "微信登录失败"
        };
      }
    } catch (error) {
      console.error("微信登录失败:", error);
      return {
        success: false,
        message: `网络错误: ${error.message || '请重试'}`,
      };
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'get_user_info',
        },
      });

      if (result.result && typeof result.result === 'object' && 'success' in result.result) {
        const response = result.result as any;
        return response.success ? response.user : null;
      }
      return null;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return null;
    }
  }

  // 更新用户信息
  async updateUserInfo(
    userId: string,
    nickname?: string,
    avatar?: string,
    gender?: number,
    city?: string,
    province?: string,
    country?: string
  ): Promise<LoginResponse> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'update_user_info',
          p_user_id: userId,
          p_nickname: nickname,
          p_avatar: avatar,
          p_gender: gender,
          p_city: city,
          p_province: province,
          p_country: country,
        },
      });

      // 确保 result.result 是对象类型
      if (result.result && typeof result.result === 'object' && 'success' in result.result) {
        return result.result as LoginResponse;
      } else {
        return {
          success: false,
          message: typeof result.result === 'object' && 'message' in result.result 
            ? (result.result as any).message || "更新用户信息失败" 
            : "更新用户信息失败",
        };
      }
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return {
        success: false,
        message: "网络错误，请重试",
      };
    }
  }

  async updateProfile(data: { nickname?: string; avatar?: string }): Promise<LoginResponse> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'update_wechat_user',
          p_nickname: data.nickname,
          p_avatar: data.avatar
        },
      });

      console.log('更新资料结果:', result);

      const resultData = result.result as any;
      
      if (resultData && resultData.data && Array.isArray(resultData.data) && resultData.data.length > 0) {
        const dbResult = resultData.data[0];
        if (dbResult.success) {
          return {
            success: true,
            user: {
              id: dbResult.user_id,
              openid: dbResult.user_openid,
              nickname: dbResult.user_nickname,
              avatar: dbResult.user_avatar,
              gender: dbResult.user_gender,
              created_at: dbResult.user_created_at,
              last_login_at: dbResult.user_last_login_at
            }
          };
        } else {
          return {
            success: false,
            message: '更新失败'
          };
        }
      } else if (resultData && resultData.success === false) {
        return {
          success: false,
          message: resultData.error?.message || '更新失败'
        };
      }
      
      return {
        success: false,
        message: '更新失败'
      };
    } catch (error) {
      console.error('更新资料失败:', error);
      return {
        success: false,
        message: '网络错误，请重试'
      };
    }
  }

  async getUserOrders(openid: string): Promise<{ success: boolean; orders: any[] }> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'get_user_orders',
          p_openid: openid
        },
      });

      console.log('获取订单列表结果:', result);

      const resultData = result.result as any;
      if (resultData && resultData.data && Array.isArray(resultData.data)) {
        return {
          success: true,
          orders: resultData.data
        };
      }
      return { success: true, orders: [] };
    } catch (error) {
      console.error('获取订单列表失败:', error);
      return { success: false, orders: [] };
    }
  }

  async getOrderDetail(orderId: string): Promise<{ success: boolean; order: any }> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'get_order_detail',
          p_order_id: Number(orderId)
        },
      });

      console.log('订单详情结果:', result);
      const resultData = result.result as any;
      console.log('订单详情数据:', resultData);
      if (resultData && resultData.data && Array.isArray(resultData.data) && resultData.data.length > 0) {
        return {
          success: true,
          order: resultData.data[0]
        };
      }
      return { success: false, order: null };
    } catch (error) {
      console.error('获取订单详情失败:', error);
      return { success: false, order: null };
    }
  }

  async refundOrder(orderId: string, openid: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'refund_order',
          p_order_id: Number(orderId),
          p_openid: openid
        },
      });

      const resultData = result.result as any;
      if (resultData && resultData.data && resultData.data.length > 0) {
        return {
          success: resultData.data[0].success,
          message: resultData.data[0].message
        };
      }
      return { success: false, message: '退款失败' };
    } catch (error) {
      console.error('退款失败:', error);
      return { success: false, message: '退款失败' };
    }
  }

  async deleteOrder(orderId: string, openid: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await Taro.cloud.callFunction({
        name: 'auth-service',
        data: {
          action: 'delete_order',
          p_order_id: Number(orderId),
          p_openid: openid
        },
      });

      const resultData = result.result as any;
      if (resultData && resultData.data && resultData.data.length > 0) {
        return {
          success: resultData.data[0].success,
          message: resultData.data[0].message
        };
      }
      return { success: false, message: '删除失败' };
    } catch (error) {
      console.error('删除订单失败:', error);
      return { success: false, message: '删除失败' };
    }
  }
}

export const authService = new AuthService();
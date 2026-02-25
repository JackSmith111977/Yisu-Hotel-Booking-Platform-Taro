const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 微信登录
    if (action === 'auth_wechat_login') {
      const cleanParams = {
        p_openid: wxContext.OPENID,
        p_nickname: params.p_nickname || null,
        p_avatar: params.p_avatar || null,
        p_gender: params.p_gender || 0
      };
      
      const result = await cloud.callFunction({
        name: 'supabase-proxy',
        data: {
          action: 'rpc',
          rpcName: action,
          params: cleanParams,
        },
      });

      return result.result;
    }

    // 更新微信用户资料
    if (action === 'update_wechat_user') {
      const cleanParams = {
        p_openid: wxContext.OPENID,
        p_nickname: params.p_nickname || null,
        p_avatar: params.p_avatar || null
      };
      
      const result = await cloud.callFunction({
        name: 'supabase-proxy',
        data: {
          action: 'rpc',
          rpcName: action,
          params: cleanParams,
        },
      });

      return result.result;
    }

    // 其他操作正常处理
    const allowedParams = {};
    for (const key of Object.keys(params)) {
      if (!['tcbContext', 'userInfo', 'cloudContext'].includes(key)) {
        allowedParams[key] = params[key];
      }
    }
    
    const result = await cloud.callFunction({
      name: 'supabase-proxy',
      data: {
        action: 'rpc',
        rpcName: action,
        params: allowedParams,
      },
    });

    return result.result;
  } catch (error) {
    console.error('认证函数执行失败:', error);
    return {
      success: false,
      message: error.message || '认证操作失败',
    };
  }
};
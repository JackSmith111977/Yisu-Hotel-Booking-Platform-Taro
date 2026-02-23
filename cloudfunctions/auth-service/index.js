const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 对于登录操作，使用微信上下文的OPENID
    if (action === 'auth_wechat_login') {
      // 只传递必要的参数，过滤掉额外的参数
      const cleanParams = {
        p_openid: wxContext.OPENID,
        p_nickname: params.p_nickname || null,
        p_avatar: params.p_avatar || null,
        p_gender: params.p_gender || 0
      };
      
      // 统一通过 supabase-proxy 调用不同的功能
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
    const result = await cloud.callFunction({
      name: 'supabase-proxy',
      data: {
        action: 'rpc',
        rpcName: action,
        params: params,
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
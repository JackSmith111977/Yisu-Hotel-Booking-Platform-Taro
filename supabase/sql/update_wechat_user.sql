-- 更新微信用户资料函数
CREATE OR REPLACE FUNCTION update_wechat_user(
  p_openid TEXT,
  p_nickname TEXT DEFAULT NULL,
  p_avatar TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  user_openid TEXT,
  user_nickname TEXT,
  user_avatar TEXT,
  user_gender INTEGER,
  user_created_at TIMESTAMPTZ,
  user_last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- 检查用户是否存在
  SELECT * INTO user_record
  FROM wechat_users
  WHERE openid = p_openid
  LIMIT 1;

  IF user_record.id IS NULL THEN
    -- 用户不存在，返回失败
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::INTEGER,
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- 更新用户资料
  UPDATE wechat_users
  SET
    nickname = COALESCE(p_nickname, nickname),
    avatar = COALESCE(p_avatar, avatar)
  WHERE id = user_record.id
  RETURNING * INTO user_record;

  -- 返回成功记录
  RETURN QUERY SELECT
    true,
    user_record.id,
    user_record.openid,
    user_record.nickname,
    user_record.avatar,
    user_record.gender,
    user_record.created_at,
    user_record.last_login_at;

EXCEPTION
  WHEN OTHERS THEN
    -- 返回失败记录
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::INTEGER,
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ;
END;
$$;

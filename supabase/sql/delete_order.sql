-- 删除订单函数
CREATE OR REPLACE FUNCTION delete_order(p_order_id BIGINT, p_openid TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_uuid UUID;
BEGIN
  -- 获取用户UUID
  SELECT w.id INTO v_user_uuid FROM wechat_users w WHERE w.openid = p_openid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '用户不存在';
  END IF;
  
  -- 检查订单是否存在且属于该用户
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id AND user_id = v_user_uuid) THEN
    RETURN QUERY SELECT FALSE, '订单不存在';
  END IF;
  
  -- 删除订单
  DELETE FROM orders WHERE id = p_order_id AND user_id = v_user_uuid;
  
  RETURN QUERY SELECT TRUE, '删除成功';
END;
$$;

NOTIFY pgrst, 'reload schema';

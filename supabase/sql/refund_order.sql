-- 申请退款函数
-- 将订单状态从已支付(2)改为已退款(4)
CREATE OR REPLACE FUNCTION refund_order(p_order_id BIGINT, p_openid TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_uuid UUID;
  v_current_status INTEGER;
BEGIN
  -- 获取用户UUID
  SELECT w.id INTO v_user_uuid FROM wechat_users w WHERE w.openid = p_openid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '用户不存在';
  END IF;
  
  -- 查询当前订单状态
  SELECT o.status INTO v_current_status
  FROM orders o
  WHERE o.id = p_order_id AND o.user_id = v_user_uuid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '订单不存在';
  END IF;
  
  -- 只有已支付(2)的订单才能退款
  IF v_current_status != 2 THEN
    RETURN QUERY SELECT FALSE, '只有已支付的订单才能退款';
  END IF;
  
  -- 更新订单状态为已退款(4)
  UPDATE orders
  SET status = 4, updated_at = NOW()
  WHERE id = p_order_id AND user_id = v_user_uuid;
  
  RETURN QUERY SELECT TRUE, '退款成功';
END;
$$;

NOTIFY pgrst, 'reload schema';

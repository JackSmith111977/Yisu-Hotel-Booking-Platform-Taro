-- 获取用户酒店订单列表 
CREATE OR REPLACE FUNCTION get_user_orders(p_openid TEXT) 
RETURNS TABLE( 
  id BIGINT,                -- 订单ID 
  hotel_id BIGINT,          -- 酒店ID
  hotel_name TEXT,          -- 酒店名称（通过关联查询）
  room_type TEXT,          -- 房间类型（从rooms jsonb中提取）
  check_in_date DATE,      -- 入住日期 
  check_out_date DATE,     -- 离店日期 
  total_amount NUMERIC,    -- 订单总金额 
  status INTEGER,          -- 订单状态（默认2已支付）
  created_at TIMESTAMPTZ,  -- 订单创建时间（带时区）
  nights INTEGER           -- 入住晚数
) 
LANGUAGE plpgsql 
SECURITY DEFINER  
AS $$ 
DECLARE
  v_user_uuid UUID;
BEGIN
  -- 先获取用户UUID
  SELECT w.id INTO v_user_uuid FROM wechat_users w WHERE w.openid = p_openid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY 
  SELECT 
    o.id,
    o.hotel_id,
    COALESCE(h.name_zh, '未知酒店') AS hotel_name,
    COALESCE(o.rooms->0->>'room_type_name', o.rooms->0->>'room_type_id', '标准间')::TEXT AS room_type,
    o.check_in_date,
    o.check_out_date,
    o.total_amount,
    2 AS status,
    o.created_at,
    o.nights
  FROM orders o
  LEFT JOIN hotels h ON o.hotel_id = h.id
  WHERE o.user_id = v_user_uuid
  ORDER BY o.created_at DESC;
END; 
$$; 

-- 获取用户酒店订单统计 
CREATE OR REPLACE FUNCTION get_user_order_stats(p_openid TEXT) 
RETURNS TABLE( 
  order_count BIGINT,   -- 订单总数 
  total_spent NUMERIC   -- 累计消费金额 
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
DECLARE
  v_user_uuid UUID;
BEGIN
  SELECT w.id INTO v_user_uuid FROM wechat_users w WHERE w.openid = p_openid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::NUMERIC;
  END IF;
  
  RETURN QUERY 
  SELECT 
    COUNT(o.id)::BIGINT AS order_count, 
    COALESCE(SUM(o.total_amount), 0)::NUMERIC AS total_spent 
  FROM orders o 
  WHERE o.user_id = v_user_uuid; 
END; 
$$; 

NOTIFY pgrst, 'reload schema';

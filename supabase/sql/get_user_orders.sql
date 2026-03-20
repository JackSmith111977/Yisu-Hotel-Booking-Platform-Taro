-- 获取用户酒店订单列表 
CREATE OR REPLACE FUNCTION get_user_orders(p_openid TEXT) 
RETURNS TABLE( 
  id BIGINT,                
  hotel_id BIGINT,          
  hotel_name TEXT,          
  room_type TEXT,          
  check_in_date DATE,      
  check_out_date DATE,     
  total_amount NUMERIC,    
  status INTEGER,          
  created_at TIMESTAMPTZ,  
  nights INTEGER           
) 
LANGUAGE plpgsql 
SECURITY DEFINER  
AS $$ 
DECLARE
  v_user_uuid UUID;
  v_room_types TEXT;
  rec RECORD;
BEGIN
  SELECT w.id INTO v_user_uuid FROM wechat_users w WHERE w.openid = p_openid;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  FOR rec IN 
    SELECT
      o.id,
      o.hotel_id,
      h.name_zh AS hotel_name,
      o.check_in_date,
      o.check_out_date,
      o.total_amount,
      o.created_at,
      o.nights,
      o.status
    FROM orders o
    LEFT JOIN hotels h ON o.hotel_id = h.id
    WHERE o.user_id = v_user_uuid
    ORDER BY o.created_at DESC
  LOOP
    SELECT
      string_agg(
        COALESCE(rt.name, '标准间') || ' x ' || oi.quantity::TEXT,
        ', '
      )
    INTO v_room_types
    FROM order_items oi
    LEFT JOIN room_types rt ON oi.room_type_id = rt.id
    WHERE oi.order_id = rec.id;
    
    RETURN QUERY VALUES (
      rec.id,
      rec.hotel_id,
      rec.hotel_name,
      v_room_types,
      rec.check_in_date,
      rec.check_out_date,
      rec.total_amount,
      COALESCE(rec.status, 2),
      rec.created_at,
      rec.nights
    );
  END LOOP;
END; 
$$; 

-- 获取订单详情
CREATE OR REPLACE FUNCTION get_order_detail(p_order_id BIGINT)
RETURNS TABLE(
  id BIGINT,
  hotel_id BIGINT,
  hotel_name TEXT,
  hotel_image TEXT,
  room_type TEXT,
  check_in_date DATE,
  check_out_date DATE,
  nights INTEGER,
  adult_count INTEGER,
  child_count INTEGER,
  guest_name TEXT,
  guest_phone TEXT,
  total_amount NUMERIC,
  paid_amount NUMERIC,
  special_requests TEXT,
  status INTEGER,
  created_at TIMESTAMPTZ,
  rooms JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_types TEXT;
  v_rooms_json JSONB;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      o.id,
      o.hotel_id,
      h.name_zh AS hotel_name,
      h.image AS hotel_image,
      o.check_in_date,
      o.check_out_date,
      o.nights,
      o.adult_count,
      o.child_count,
      o.guest_name::TEXT,
      o.guest_phone::TEXT,
      o.total_amount,
      o.paid_amount,
      o.special_requests::TEXT,
      o.created_at,
      o.status
    FROM orders o
    LEFT JOIN hotels h ON o.hotel_id = h.id
    WHERE o.id = p_order_id
  LOOP
    SELECT
      string_agg(
        COALESCE(rt.name, '标准间') || ' x ' || oi.quantity::TEXT,
        ', '
      )
    INTO v_room_types
    FROM order_items oi
    LEFT JOIN room_types rt ON oi.room_type_id = rt.id
    WHERE oi.order_id = rec.id;

    SELECT jsonb_agg(
      jsonb_build_object(
        'room_type_id', oi.room_type_id,
        'room_type_name', rt.name,
        'quantity', oi.quantity,
        'price_per_night', oi.price_per_night
      )
    )
    INTO v_rooms_json
    FROM order_items oi
    LEFT JOIN room_types rt ON oi.room_type_id = rt.id
    WHERE oi.order_id = rec.id;

    RETURN QUERY VALUES (
      rec.id,
      rec.hotel_id,
      rec.hotel_name,
      rec.hotel_image,
      v_room_types,
      rec.check_in_date,
      rec.check_out_date,
      rec.nights,
      rec.adult_count,
      rec.child_count,
      rec.guest_name,
      rec.guest_phone,
      rec.total_amount,
      rec.paid_amount,
      rec.special_requests,
      COALESCE(rec.status, 2),
      rec.created_at,
      v_rooms_json
    );
  END LOOP;
END;
$$;

-- 获取用户酒店订单统计 
CREATE OR REPLACE FUNCTION get_user_order_stats(p_openid TEXT) 
RETURNS TABLE( 
  order_count BIGINT,   
  total_spent NUMERIC   
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

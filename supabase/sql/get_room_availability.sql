-- 根据酒店ID和入住/退房日期动态计算每个房型的剩余可用数量
-- 计算方式：room_types.quantity - 日期范围内有重叠的有效订单已预订数量
-- status != 4 表示排除已退款订单
CREATE OR REPLACE FUNCTION get_room_availability_by_range(
  p_hotel_id BIGINT,
  p_check_in DATE,
  p_check_out DATE
)
RETURNS TABLE(room_type_id BIGINT, available_count INTEGER)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    rt.id AS room_type_id,
    GREATEST(0,
      rt.quantity - COALESCE(
        (
          SELECT SUM(oi.quantity)
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          WHERE oi.room_type_id = rt.id
            AND o.check_in_date < p_check_out
            AND o.check_out_date > p_check_in
            AND o.status != 4
        ), 0
      )
    )::INTEGER AS available_count
  FROM room_types rt
  WHERE rt.hotel_id = p_hotel_id;
$$;

NOTIFY pgrst, 'reload schema';
-- 创建搜索函数 RPC
-- 目标：实现“有关键词时全局搜索（当前城市优先），无关键词时严格限制当前城市”的混合逻辑
-- 包含聚合最低价、Mock 评分、售罄状态

-- 先删除旧函数，防止因参数签名变更（如增加参数或类型变化）导致函数重载，从而引发调用歧义
DROP FUNCTION IF EXISTS search_hotels_with_min_price(text, text, text[], text, int, int);

CREATE OR REPLACE FUNCTION search_hotels_with_min_price(
  p_city text,
  p_keyword text,
  p_tags text[],
  p_sort text DEFAULT 'recommended',
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10
)
RETURNS TABLE(
  id bigint,
  name_zh text,
  name_en text,
  address text,
  star_rating smallint,
  opening_date date,
  contact_phone text,
  image text,
  status text,
  merchant_id uuid,
  updated_at timestamptz,
  rejected_reason text,
  region text,
  album text[],
  tags text[],
  search_text tsvector,
  min_price numeric,
  review_score numeric,
  is_sold_out boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset int;
  v_query tsquery;
  v_normalized_keyword text;
  v_city_filter text;
BEGIN
  -- 参数校验与处理
  v_offset := (p_page - 1) * p_page_size;

  -- 处理城市参数：如果包含 /，取最后一部分作为城市名
  -- 例如 '浙江/杭州' -> '杭州'
  IF p_city IS NOT NULL AND position('/' in p_city) > 0 THEN
    v_city_filter := split_part(p_city, '/', array_length(string_to_array(p_city, '/'), 1));
  ELSE
    v_city_filter := p_city;
  END IF;

  -- 处理关键词：去除首尾空格，将空格转换为 & 连接符以支持 AND 搜索
  IF p_keyword IS NOT NULL AND trim(p_keyword) <> '' THEN
    v_normalized_keyword := trim(p_keyword);
    -- simple 分词器下，'A B' -> 'A & B'
    -- 注意：这里简单处理空格，如果需要更复杂的布尔逻辑可能需要调整
    v_query := to_tsquery('simple', replace(v_normalized_keyword, ' ', ' & '));
  END IF;

  RETURN QUERY
  SELECT
    h.id,
    h.name_zh,
    h.name_en,
    h.address,
    h.star_rating,
    h.opening_date,
    h.contact_phone,
    h.image,
    h.status,
    h.merchant_id,
    h.updated_at,
    h.rejected_reason,
    h.region,
    h.album,
    h.tags,
    h.search_text,
    MIN(rt.price) as min_price,
    -- 暂时使用星级作为评分的 mock 数据，实际应关联 reviews 表
    COALESCE(h.star_rating, 0)::numeric as review_score,
    -- 如果没有关联到房型，视为售罄
    (COUNT(rt.id) = 0) as is_sold_out
  FROM
    hotels h
  LEFT JOIN
    room_types rt ON h.id = rt.hotel_id
  WHERE
    h.status = 'approved' -- 仅展示上架酒店
    AND (
      p_tags IS NULL OR h.tags @> p_tags
    )
    AND (
      -- 核心混合搜索逻辑：
      -- 1. 如果有关键词：使用全文检索 + ILIKE 模糊匹配 (忽略城市硬过滤，但结果中优先展示同城)
      (v_query IS NOT NULL AND (
        h.search_text @@ v_query 
        OR h.name_zh ILIKE '%' || v_normalized_keyword || '%' 
        OR h.name_en ILIKE '%' || v_normalized_keyword || '%'
        OR h.address ILIKE '%' || v_normalized_keyword || '%'
      ))
      OR
      -- 2. 如果无关键词：宽松匹配城市 (如果提供了城市)
      (v_query IS NULL AND (v_city_filter IS NULL OR h.region ILIKE '%' || v_city_filter || '%' OR h.address ILIKE '%' || v_city_filter || '%'))
    )
  GROUP BY
    h.id
  ORDER BY
    -- 排序逻辑
    
    -- 1. [仅推荐排序 + 有关键词 + 有城市] 优先展示当前城市的搜索结果
    CASE 
      WHEN p_sort = 'recommended' AND v_query IS NOT NULL AND v_city_filter IS NOT NULL THEN
        (CASE WHEN h.region ILIKE '%' || v_city_filter || '%' OR h.address ILIKE '%' || v_city_filter || '%' THEN 0 ELSE 1 END)
      ELSE 0
    END ASC,
    
    -- 2. [仅推荐排序 + 有关键词] 文本相关性排序
    CASE
      WHEN p_sort = 'recommended' AND v_query IS NOT NULL THEN 
        ts_rank(h.search_text, v_query) + 
        (CASE WHEN h.name_zh ILIKE '%' || v_normalized_keyword || '%' THEN 0.5 ELSE 0 END) -- 给予精确匹配额外权重
      ELSE 0
    END DESC,

    -- 3. 常规排序字段
    CASE WHEN p_sort = 'price_asc' THEN MIN(rt.price) END ASC,
    CASE WHEN p_sort = 'price_desc' THEN MIN(rt.price) END DESC,
    CASE WHEN p_sort = 'star_desc' THEN h.star_rating END DESC,
    CASE WHEN p_sort = 'star_asc' THEN h.star_rating END ASC,

    -- 4. 兜底排序 (推荐排序时优先星级，其次价格)
    h.star_rating DESC NULLS LAST,
    MIN(rt.price) ASC NULLS LAST
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

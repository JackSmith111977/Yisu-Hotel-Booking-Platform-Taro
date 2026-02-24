-- 1. 创建 public.tags 表
-- 该表用于存储系统的标签字典，如 '免费WiFi'、'餐饮' 等
CREATE TABLE IF NOT EXISTS public.tags (
    -- 使用 bigint 作为主键，并设置为自动递增身份列
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    -- 标签名称，不允许为空且必须唯一，防止重复定义
    name text NOT NULL UNIQUE,

    -- 分类字段，用于逻辑分组，如 '设施服务'、'餐饮'、'房型特色' 等
    category text NOT NULL,

    -- 激活状态，默认为启用 (true)
    is_active boolean DEFAULT true NOT NULL,

    -- 创建时间，记录记录生成的时间戳，默认使用当前数据库时间
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. 设置权限 (RLS)
-- 启用行级安全策略，这是 Supabase 安全性的核心
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 策略：允许所有用户 (包括匿名用户和已登录用户) 查看标签数据
-- 依赖说明：USING (true) 表示没有任何限制，所有行都可读
CREATE POLICY "Allow all users to select tags"
ON public.tags
FOR SELECT
USING (true);

-- 策略：仅允许 service_role (通常为管理员/后端服务) 进行增删改操作
-- 依赖说明：TO service_role 限制了该策略仅对服务角色生效
CREATE POLICY "Allow service_role to manage tags"
ON public.tags
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- 3. 插入初始化数据
-- ==========================================
-- 插入基础标签字典数据
-- 使用 ON CONFLICT (name) DO NOTHING 以支持迁移脚本的重复运行（防御性编程）
INSERT INTO public.tags (category, name) VALUES
    -- 设施服务
    ('设施服务', '免费WiFi'),
    ('设施服务', '免费停车'),
    ('设施服务', '24小时前台'),
    ('设施服务', '行李寄存'),
    ('设施服务', '叫醒服务'),
    ('设施服务', '外币兑换'),

    -- 餐饮
    ('餐饮', '含早餐'),
    ('餐饮', '含双早'),
    ('餐饮', '西餐厅'),
    ('餐饮', '中餐厅'),
    ('餐饮', '酒吧'),
    ('餐饮', '咖啡厅'),
    ('餐饮', '客房送餐'),

    -- 休闲娱乐
    ('休闲娱乐', '室内游泳池'),
    ('休闲娱乐', '室外游泳池'),
    ('休闲娱乐', '健身中心'),
    ('休闲娱乐', 'SPA水疗'),
    ('休闲娱乐', '桑拿'),
    ('休闲娱乐', '儿童乐园'),
    ('休闲娱乐', '棋牌室'),

    -- 商务
    ('商务', '商务中心'),
    ('商务', '会议室'),
    ('商务', '免费打印'),
    ('商务', 'VIP贵宾室'),
    ('商务', '机场接送'),

    -- 位置特色
    ('位置特色', '市中心'),
    ('位置特色', '海景房'),
    ('位置特色', '山景房'),
    ('位置特色', '近地铁'),
    ('位置特色', '近景区'),
    ('位置特色', '度假村')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 4. 优化：为 hotels 表的 tags 字段创建 GIN 索引
-- ==========================================
-- GIN (Generalized Inverted Index) 索引非常适合加速数组类型的包含查询 (@>)
-- 这将显著提升根据标签筛选酒店时的查询性能
CREATE INDEX IF NOT EXISTS hotels_tags_idx ON public.hotels USING GIN (tags);

-- ==========================================
-- 5. 修改搜索向量更新函数 (加权搜索)
-- ==========================================
-- 使用 setweight 为不同字段分配权重，优化全文检索的排序结果
-- 'A' (最高权重): 酒店名称 (中/英)
-- 'B' (次高权重): 标签数组
-- 'C' (补充权重): 地址、区域、房型聚合内容
CREATE OR REPLACE FUNCTION public.hotels_search_vector_update()
RETURNS trigger AS $$
DECLARE
  rooms_content text;
BEGIN
  -- 1. 获取该酒店下所有房型的聚合描述文本
  rooms_content := get_hotel_rooms_search_text(new.id);

  -- 2. 构建加权向量
  -- 理由：搜索酒店名应该排在最前面，其次是标签，最后是详细地址和描述
  new.search_text :=
    setweight(to_tsvector('simple', coalesce(new.name_zh, '') || ' ' || coalesce(new.name_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.address, '') || ' ' || coalesce(new.region, '') || ' ' || rooms_content), 'C');

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. 全量刷新现有数据的搜索向量
-- ==========================================
-- 触发一次全量更新，确保所有现有记录都应用了新的加权逻辑
-- 通过更新 updated_at 来触发 hotels_search_vector_update 触发器
UPDATE public.hotels SET updated_at = now();

-- ==========================================
-- 7. 重写搜索函数以支持标签筛选
-- ==========================================
-- 目标：实现“有关键词时全局搜索，无关键词时限制当前城市”，并支持标签组合筛选
-- 兼容性：保留了原有的 city, keyword, sort 等逻辑，新增了对 p_tags 的严格过滤
DROP FUNCTION IF EXISTS search_hotels_with_min_price(text, text, text[], text, int, int);

CREATE OR REPLACE FUNCTION search_hotels_with_min_price(
  p_city text,
  p_keyword text,
  p_tags text[], -- 新增：接收标签数组，如 ['免费WiFi', '含早餐']
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
  -- 1. 参数预处理
  v_offset := (p_page - 1) * p_page_size;

  -- 处理城市参数：'浙江/杭州' -> '杭州'
  IF p_city IS NOT NULL AND position('/' in p_city) > 0 THEN
    v_city_filter := split_part(p_city, '/', array_length(string_to_array(p_city, '/'), 1));
  ELSE
    v_city_filter := p_city;
  END IF;

  -- 处理关键词：将空格转换为 & 连接符以支持 AND 搜索
  IF p_keyword IS NOT NULL AND trim(p_keyword) <> '' THEN
    v_normalized_keyword := trim(p_keyword);
    -- 使用 simple 分词器，避免中文分词干扰
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
    -- 暂时使用星级作为评分的 mock 数据
    COALESCE(h.star_rating, 0)::numeric as review_score,
    -- 如果没有关联到房型，视为售罄
    (COUNT(rt.id) = 0) as is_sold_out
  FROM
    hotels h
  LEFT JOIN
    room_types rt ON h.id = rt.hotel_id
  WHERE
    h.status = 'approved' -- 仅展示上架酒店

    -- 核心筛选 1: 标签过滤
    -- 如果 p_tags 不为空，则要求 h.tags 必须包含 p_tags 中的所有元素 (@>)
    AND (
      p_tags IS NULL OR h.tags @> p_tags
    )

    -- 核心筛选 2: 混合搜索逻辑
    AND (
      -- 场景 A: 有关键词
      -- 使用全文检索 + ILIKE 模糊匹配
      (v_query IS NOT NULL AND (
        h.search_text @@ v_query
        OR h.name_zh ILIKE '%' || v_normalized_keyword || '%'
        OR h.name_en ILIKE '%' || v_normalized_keyword || '%'
        OR h.address ILIKE '%' || v_normalized_keyword || '%'
      ))
      OR
      -- 场景 B: 无关键词
      -- 宽松匹配城市 (如果提供了城市)
      (v_query IS NULL AND (
        v_city_filter IS NULL
        OR h.region ILIKE '%' || v_city_filter || '%'
        OR h.address ILIKE '%' || v_city_filter || '%'
      ))
    )
  GROUP BY
    h.id
  ORDER BY
    -- 排序逻辑保持不变

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
        (CASE WHEN h.name_zh ILIKE '%' || v_normalized_keyword || '%' THEN 0.5 ELSE 0 END)
      ELSE 0
    END DESC,

    -- 3. 常规排序字段
    CASE WHEN p_sort = 'price_asc' THEN MIN(rt.price) END ASC,
    CASE WHEN p_sort = 'price_desc' THEN MIN(rt.price) END DESC,
    CASE WHEN p_sort = 'star_desc' THEN h.star_rating END DESC,
    CASE WHEN p_sort = 'star_asc' THEN h.star_rating END ASC,

    -- 4. 兜底排序
    h.star_rating DESC NULLS LAST,
    MIN(rt.price) ASC NULLS LAST
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

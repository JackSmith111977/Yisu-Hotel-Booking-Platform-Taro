-- 1. 检查并启用 pg_trgm 扩展 (用于相似度搜索，常与 tsvector 配合使用)
create extension if not exists pg_trgm;

-- 2. 修改 hotels 表，新增 search_text 字段
alter table hotels
add column if not exists search_text tsvector;

-- 3. 创建 GIN 索引 (加速全文检索)
create index if not exists hotels_search_text_idx
on hotels using gin (search_text);

-- 4. 辅助函数：获取指定酒店的所有房型聚合文本
create or replace function get_hotel_rooms_search_text(_hotel_id bigint)
returns text as $$
declare
  room_text text;
begin
  -- 聚合房型名称、描述、设施
  -- 将 JSONB 设施转为文本并简单清洗符号
  select string_agg(
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    regexp_replace(coalesce(facilities::text, ''), '["\[\]\{\},:]', ' ', 'g'),
    ' '
  )
  into room_text
  from room_types
  where hotel_id = _hotel_id;

  return coalesce(room_text, '');
end;
$$ language plpgsql;

-- 5. 创建更新向量的函数 (主函数)
create or replace function hotels_search_vector_update()
returns trigger as $$
declare
  rooms_content text;
begin
  -- 获取房型数据
  rooms_content := get_hotel_rooms_search_text(new.id);

  -- 将各个字段拼接，处理 NULL 值，并使用 simple 分词器转换为 tsvector
  new.search_text := to_tsvector('simple',
    coalesce(new.name_zh, '') || ' ' ||
    coalesce(new.name_en, '') || ' ' ||
    coalesce(new.region, '') || ' ' ||
    coalesce(new.address, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
    rooms_content -- 加入房型内容
  );
  return new;
end;
$$ language plpgsql;

-- 6. 创建 Trigger (监听 hotels 自身字段变更)
drop trigger if exists hotels_search_vector_update on hotels;

-- 注意：加入了 updated_at，以便从外部触发更新
create trigger hotels_search_vector_update
before insert or update of name_zh, name_en, region, address, tags, updated_at
on hotels
for each row
execute function hotels_search_vector_update();

-- 7. 创建 Trigger (监听 room_types 变更，反向更新 hotels)
create or replace function room_types_search_vector_trigger()
returns trigger as $$
begin
  -- 触碰 hotel 的 updated_at，从而触发 hotels_search_vector_update
  if (TG_OP = 'DELETE') then
    update hotels set updated_at = now() where id = old.hotel_id;
    return old;
  else
    update hotels set updated_at = now() where id = new.hotel_id;
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists room_types_search_vector_update on room_types;

create trigger room_types_search_vector_update
after insert or update or delete
on room_types
for each row
execute function room_types_search_vector_trigger();

-- 8. 初始化/刷新所有现有数据的 search_text
-- 对表中已有的记录进行一次全量计算
update hotels 
set search_text = to_tsvector('simple',
    coalesce(name_zh, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(region, '') || ' ' ||
    coalesce(address, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '') || ' ' ||
    get_hotel_rooms_search_text(id)
);

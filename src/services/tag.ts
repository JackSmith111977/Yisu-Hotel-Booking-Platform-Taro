import { callSupabase } from "@/utils/supabase";

/**
 * 标签接口定义
 * @description 定义系统中的标签数据结构，对应数据库 public.tags 表
 */
export interface Tag {
  /** 标签唯一标识 (对应 id) */
  id: number;
  /** 标签名称 (对应 name) */
  name: string;
  /** 标签分类 (对应 category) */
  category: string;
  /** 标签图标 (对应 icon，可选字段) */
  icon?: string;
  /** 排序权重 (对应 sort_order，可选字段) */
  sort_order?: number;
}

/**
 * 获取全量活跃标签
 * @description 调用 Supabase 获取所有 active 状态的标签，并按 sort_order 降序排列
 * @returns {Promise<Tag[]>} 标签列表
 */
export const fetchAllTags = async (): Promise<Tag[]> => {
  try {
    // 调用 Supabase 获取数据
    // 根据 cloudfunctions/supabase-proxy/index.js 的实现：
    // 1. action="table", method="select"
    // 2. query 映射为 select 参数
    // 3. params.eq 映射为 eq.value 过滤条件
    // 4. params.order 直接映射为 order 参数
    const { data, error } = await callSupabase({
      action: "table",
      table: "tags",
      method: "select",
      query: "*", // 获取所有字段
      params: {
        // 对应 cloudfunctions 中的 operators 处理逻辑
        eq: { is_active: true },
        // 数据库 tags 表可能没有 sort_order 字段，移除 order 参数，改为前端排序
      },
    });

    if (error) {
      console.error("[TagService] fetchAllTags error:", error);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    // 防御性编程：前端再次确保排序，防止后端排序失效或不支持
    // 同时确保返回的数据符合 Tag 接口
    const tags = (data as Tag[]).sort((a, b) => {
      // 降序排列：b - a
      // 使用 (b.sort_order || 0) 处理可能为 null/undefined 的情况
      return (b.sort_order || 0) - (a.sort_order || 0);
    });

    return tags;
  } catch (err) {
    // 捕获所有未预期的异常，保证应用不崩溃
    console.error("[TagService] fetchAllTags unexpected error:", err);
    return [];
  }
};

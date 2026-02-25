import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import Taro from "@tarojs/taro";
import { Tag, fetchAllTags } from "@/services/tag";

/**
 * 标签状态管理接口
 * @description 定义标签相关的状态、操作方法及计算属性
 */
export interface TagStoreState {
  /** 原始标签列表 */
  tags: Tag[];
  /** 加载状态 */
  loading: boolean;

  /**
   * 异步获取全量标签
   * @description 调用 tagService 获取数据并更新状态
   */
  fetchTags: () => Promise<void>;

  /**
   * 获取按分类分组的标签
   * @description 计算属性：将扁平的标签数组转换为按 category 分组的对象
   * @returns {Record<string, Tag[]>} 分组后的标签对象
   */
  getGroupedTags: () => Record<string, Tag[]>;
}

/**
 * Taro 本地存储适配器
 * @description 适配 Zustand persist 中间件所需的 StateStorage 接口
 * @reference 参考 searchStore.ts 实现
 */
const taroStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = Taro.getStorageSync(name);
      return value === "" ? null : value;
    } catch (e) {
      console.error("Failed to get storage", e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      console.error("Failed to set storage", e);
    }
  },
  removeItem: (name: string): void => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      console.error("Failed to remove storage", e);
    }
  },
};

/**
 * 创建标签状态 Store
 * @description 使用 zustand 创建，并结合 persist 中间件实现持久化存储
 */
export const useTagStore = create<TagStoreState>()(
  persist(
    (set, get) => ({
      // 初始状态
      tags: [],
      loading: false,

      // 异步获取标签
      fetchTags: async () => {
        set({ loading: true });
        try {
          const tags = await fetchAllTags();
          set({ tags, loading: false });
        } catch (error) {
          console.error("[TagStore] fetchTags failed:", error);
          set({ loading: false });
        }
      },

      // 计算属性：按分类分组
      getGroupedTags: () => {
        const { tags } = get();
        const grouped: Record<string, Tag[]> = {};

        tags.forEach((tag) => {
          const { category } = tag;
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(tag);
        });

        return grouped;
      },
    }),
    {
      name: "tag-storage", // 存储的 key
      storage: createJSONStorage(() => taroStorage), // 使用 Taro 存储适配器
      partialize: (state) => ({ tags: state.tags }), // 仅持久化 tags 数据，loading 状态无需持久化
    }
  )
);

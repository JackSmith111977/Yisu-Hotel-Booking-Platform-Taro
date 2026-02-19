import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import Taro from "@tarojs/taro";
import dayjs from "dayjs";

/**
 * 搜索参数接口定义
 * @description 定义搜索所需的各项参数类型，确保类型安全
 */
export interface SearchParams {
  /** 城市名称，默认为 '北京' */
  city: string;
  /** 入住日期，格式 'YYYY-MM-DD' */
  checkInDate: string;
  /** 离店日期，格式 'YYYY-MM-DD' */
  checkOutDate: string;
  /** 搜索关键词 */
  keyword: string;
  /** 筛选标签 */
  tags: string[];
}

/**
 * 搜索状态管理接口
 * @description 包含搜索参数和搜索历史记录的状态及操作方法
 */
export interface SearchStoreState {
  /** 搜索参数状态 */
  params: SearchParams;
  /** 搜索历史记录，最大存储 10 条 */
  history: string[];

  /**
   * 更新搜索参数
   * @param partialParams 部分搜索参数，将与现有参数进行深度合并
   */
  setParams: (partialParams: Partial<SearchParams>) => void;

  /**
   * 添加搜索历史
   * @description 将关键词添加到历史记录头部，去重，并保持最多 10 条记录
   * @param keyword 搜索关键词
   */
  addHistory: (keyword: string) => void;

  /**
   * 清空搜索历史
   */
  clearHistory: () => void;
}

/**
 * Taro 本地存储适配器
 * @description 适配 Zustand persist 中间件所需的 StateStorage 接口，使用 Taro.getStorageSync/setStorageSync
 */
const taroStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = Taro.getStorageSync(name);
      // Taro.getStorageSync 在 key 不存在时返回空字符串，此处需转换为 null 以符合 StateStorage 接口
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
 * 创建搜索状态 Store
 * @description 使用 zustand 创建，并结合 persist 中间件实现持久化存储
 */
export const useSearchStore = create<SearchStoreState>()(
  persist(
    (set) => ({
      // 初始状态定义
      params: {
        city: "北京",
        // 默认入住日期为今天
        checkInDate: dayjs().format("YYYY-MM-DD"),
        // 默认离店日期为明天
        checkOutDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
        keyword: "",
        tags: [],
      },
      history: [],

      // Actions 实现

      // 深度合并更新参数
      setParams: (partialParams) =>
        set((state) => ({
          params: { ...state.params, ...partialParams },
        })),

      // 添加历史记录：头部插入 + 去重 + 限制长度
      addHistory: (keyword) =>
        set((state) => {
          if (!keyword || !keyword.trim()) return state;
          // 过滤掉已存在的相同关键词，确保唯一性
          const filteredHistory = state.history.filter((k) => k !== keyword);
          // 插入新关键词到头部，并截取前 10 条
          const newHistory = [keyword, ...filteredHistory].slice(0, 10);
          return { history: newHistory };
        }),

      // 清空历史记录
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "hotel-search-storage", // 持久化存储的唯一 key
      storage: createJSONStorage(() => taroStorage), // 使用自定义的 Taro 存储适配器
    },
  ),
);

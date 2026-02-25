import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import Taro from "@tarojs/taro";

// 用户信息接口
export interface UserInfo {
  id?: string;
  openid?: string;
  code?: string; // 使用微信code作为唯一标识
  nickname?: string;
  avatar?: string;
  gender?: number;
  country?: string;
  province?: string;
  city?: string;
  is_active?: boolean;
  login_count?: number;
  total_order_count?: number;
  total_spent_amount?: number;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

// 用户状态管理接口
export interface UserStoreState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  lastLoginTime: number | null;

  login: (userInfo: UserInfo) => void;
  logout: () => void;
  updateUserInfo: (partialInfo: Partial<UserInfo>) => void;
}

// Taro 本地存储适配器
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

// 创建用户状态管理
export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userInfo: null,
      lastLoginTime: null,

      login: (userInfo: UserInfo) =>
        set({
          isLoggedIn: true,
          userInfo,
          lastLoginTime: Date.now(),
        }),

      logout: () =>
        set({
          isLoggedIn: false,
          userInfo: null,
          lastLoginTime: null,
        }),

      updateUserInfo: (partialInfo: Partial<UserInfo>) =>
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...partialInfo } : null,
        })),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => taroStorage),
    }
  )
);
/**
 * Taro 适配的轻量级 Supabase REST 客户端
 * 兼容微信小程序 & H5，无需依赖 @supabase/supabase-js
 *
 * 使用方式：
 *   import { supabase } from './supabaseClient'
 *   const { data, error } = await supabase.from('hotels').select('*').eq('city', '上海').execute()
 */

import Taro from '@tarojs/taro'

// ============================================================
// 配置 - 替换为你自己的 Supabase 项目信息
// ============================================================
const SUPABASE_URL = "https://varicsxgcaruuwucywxe.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmljc3hnY2FydXV3dWN5d3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjEyODAsImV4cCI6MjA4NTI5NzI4MH0.OVwJFaYB0Ps9BskB_m7KVW0AsF81E1imWbQtFhfo_28"

// ============================================================
// 类型定义
// ============================================================
interface SupabaseResponse<T = any> {
  data: T | null
  error: SupabaseError | null
  count?: number
}

interface SupabaseError {
  message: string
  code?: string
  details?: string
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// ============================================================
// Token 管理（用于登录后的用户鉴权）
// ============================================================
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
  if (token) {
    Taro.setStorageSync('supabase_access_token', token)
  } else {
    Taro.removeStorageSync('supabase_access_token')
  }
}

export function getAccessToken(): string | null {
  if (_accessToken) return _accessToken
  try {
    _accessToken = Taro.getStorageSync('supabase_access_token') || null
  } catch {
    _accessToken = null
  }
  return _accessToken
}

// ============================================================
// 底层请求封装
// ============================================================
async function request<T = any>(
  path: string,
  method: Method = 'GET',
  options: {
    body?: any
    headers?: Record<string, string>
    params?: string
    prefer?: string
  } = {}
): Promise<SupabaseResponse<T>> {
  const { body, headers = {}, params = '', prefer } = options

  const token = getAccessToken() || SUPABASE_ANON_KEY
  const url = `${SUPABASE_URL}${path}${params ? `?${params}` : ''}`

  const defaultHeaders: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  if (prefer) {
    defaultHeaders['Prefer'] = prefer
  }

  try {
    const res = await Taro.request({
      url,
      method,
      data: body ? JSON.stringify(body) : undefined,
      header: { ...defaultHeaders, ...headers },
    })

    const statusCode = res.statusCode

    if (statusCode >= 200 && statusCode < 300) {
      return { data: res.data as T, error: null }
    }

    // Supabase 错误响应
    const errBody = res.data as any
    return {
      data: null,
      error: {
        message: errBody?.message || errBody?.error || `HTTP ${statusCode}`,
        code: errBody?.code || String(statusCode),
        details: errBody?.details || errBody?.hint || undefined,
      },
    }
  } catch (err: any) {
    return {
      data: null,
      error: {
        message: err?.errMsg || err?.message || '网络请求失败',
        code: 'NETWORK_ERROR',
      },
    }
  }
}

// ============================================================
// QueryBuilder - 链式查询构造器
// ============================================================
class QueryBuilder<T = any> {
  private table: string
  private method: Method = 'GET'
  private filters: string[] = []
  private selectColumns = '*'
  private orderClause = ''
  private limitCount: number | null = null
  private offsetCount: number | null = null
  private body: any = null
  private preferHeader = ''
  private isSingle = false
  private countOption: 'exact' | 'planned' | 'estimated' | null = null

  constructor(table: string) {
    this.table = table
  }

  // ---------- 查询操作 ----------

  /** 选择返回的列 */
  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    this.method = 'GET'
    this.selectColumns = columns
    if (options?.count) {
      this.countOption = options.count
    }
    return this
  }

  /** 插入数据 */
  insert(data: Partial<T> | Partial<T>[]) {
    this.method = 'POST'
    this.body = data
    this.preferHeader = 'return=representation'
    return this
  }

  /** 更新数据（需搭配 filter 使用） */
  update(data: Partial<T>) {
    this.method = 'PATCH'
    this.body = data
    this.preferHeader = 'return=representation'
    return this
  }

  /** 删除数据（需搭配 filter 使用） */
  delete() {
    this.method = 'DELETE'
    this.preferHeader = 'return=representation'
    return this
  }

  /** Upsert 数据 */
  upsert(data: Partial<T> | Partial<T>[]) {
    this.method = 'POST'
    this.body = data
    this.preferHeader = 'resolution=merge-duplicates,return=representation'
    return this
  }

  // ---------- 过滤条件 ----------

  /** 等于 */
  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`)
    return this
  }

  /** 不等于 */
  neq(column: string, value: any) {
    this.filters.push(`${column}=neq.${encodeURIComponent(value)}`)
    return this
  }

  /** 大于 */
  gt(column: string, value: any) {
    this.filters.push(`${column}=gt.${encodeURIComponent(value)}`)
    return this
  }

  /** 大于等于 */
  gte(column: string, value: any) {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`)
    return this
  }

  /** 小于 */
  lt(column: string, value: any) {
    this.filters.push(`${column}=lt.${encodeURIComponent(value)}`)
    return this
  }

  /** 小于等于 */
  lte(column: string, value: any) {
    this.filters.push(`${column}=lte.${encodeURIComponent(value)}`)
    return this
  }

  /** LIKE 模糊匹配 */
  like(column: string, pattern: string) {
    this.filters.push(`${column}=like.${encodeURIComponent(pattern)}`)
    return this
  }

  /** ILIKE 不区分大小写模糊匹配 */
  ilike(column: string, pattern: string) {
    this.filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`)
    return this
  }

  /** IN 查询 */
  in(column: string, values: any[]) {
    const list = values.map((v) => `"${v}"`).join(',')
    this.filters.push(`${column}=in.(${list})`)
    return this
  }

  /** IS NULL / IS NOT NULL */
  is(column: string, value: null | boolean) {
    this.filters.push(`${column}=is.${value}`)
    return this
  }

  /** 全文搜索 */
  textSearch(column: string, query: string, type: 'plain' | 'phrase' | 'websearch' = 'plain') {
    const ftsType = type === 'plain' ? 'fts' : type === 'phrase' ? 'phfts' : 'wfts'
    this.filters.push(`${column}=${ftsType}.${encodeURIComponent(query)}`)
    return this
  }

  /** OR 条件组合 */
  or(filters: string) {
    this.filters.push(`or=(${filters})`)
    return this
  }

  // ---------- 排序 & 分页 ----------

  /** 排序 */
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const dir = options?.ascending === false ? 'desc' : 'asc'
    const nulls = options?.nullsFirst ? '.nullsfirst' : '.nullslast'
    this.orderClause = `order=${column}.${dir}${nulls}`
    return this
  }

  /** 限制返回数量 */
  limit(count: number) {
    this.limitCount = count
    return this
  }

  /** 偏移（分页） */
  range(from: number, to: number) {
    this.offsetCount = from
    this.limitCount = to - from + 1
    return this
  }

  /** 只返回单条记录 */
  single() {
    this.isSingle = true
    this.limitCount = 1
    return this
  }

  /** 可选的单条查询，不存在时不报错 */
  maybeSingle() {
    this.isSingle = true
    this.limitCount = 1
    return this
  }

  // ---------- 执行请求 ----------

  async execute(): Promise<SupabaseResponse<T>> {
    const paramParts: string[] = []

    // select
    if (this.method === 'GET') {
      paramParts.push(`select=${encodeURIComponent(this.selectColumns)}`)
    }

    // filters
    paramParts.push(...this.filters)

    // order
    if (this.orderClause) {
      paramParts.push(this.orderClause)
    }

    // limit & offset
    if (this.limitCount !== null) {
      paramParts.push(`limit=${this.limitCount}`)
    }
    if (this.offsetCount !== null) {
      paramParts.push(`offset=${this.offsetCount}`)
    }

    const params = paramParts.join('&')

    // prefer header
    let prefer = this.preferHeader
    if (this.countOption) {
      prefer = prefer ? `${prefer},count=${this.countOption}` : `count=${this.countOption}`
    }

    const headers: Record<string, string> = {}
    if (this.isSingle) {
      headers['Accept'] = 'application/vnd.pgrst.object+json'
    }

    return request<T>(`/rest/v1/${this.table}`, this.method, {
      body: this.body,
      params,
      prefer: prefer || undefined,
      headers,
    })
  }

  /** then 支持，可以直接 await 而无需调用 .execute() */
  then<TResult1 = SupabaseResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

// ============================================================
// RPC 调用（调用 Supabase Edge Functions / Database Functions）
// ============================================================
async function rpc<T = any>(
  fnName: string,
  params?: Record<string, any>
): Promise<SupabaseResponse<T>> {
  return request<T>(`/rest/v1/rpc/${fnName}`, 'POST', {
    body: params || {},
  })
}

// ============================================================
// Auth 模块（Supabase GoTrue）
// ============================================================
const auth = {
  /** 邮箱密码注册 */
  async signUp(email: string, password: string): Promise<SupabaseResponse> {
    const res = await request('/auth/v1/signup', 'POST', {
      body: { email, password },
    })
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token)
    }
    return res
  },

  /** 邮箱密码登录 */
  async signInWithPassword(email: string, password: string): Promise<SupabaseResponse> {
    const res = await request('/auth/v1/token?grant_type=password', 'POST', {
      body: { email, password },
    })
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token)
    }
    return res
  },

  /** 登出 */
  async signOut(): Promise<void> {
    await request('/auth/v1/logout', 'POST')
    setAccessToken(null)
  },

  /** 获取当前用户信息 */
  async getUser(): Promise<SupabaseResponse> {
    return request('/auth/v1/user', 'GET')
  },

  /** 刷新 token */
  async refreshSession(refreshToken: string): Promise<SupabaseResponse> {
    const res = await request('/auth/v1/token?grant_type=refresh_token', 'POST', {
      body: { refresh_token: refreshToken },
    })
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token)
    }
    return res
  },
}

// ============================================================
// Storage 模块（文件上传/下载）
// ============================================================
const storage = {
  from(bucket: string) {
    return {
      /** 获取文件公开 URL */
      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
          },
        }
      },

      /** 下载文件 */
      async download(path: string): Promise<SupabaseResponse> {
        return request(`/storage/v1/object/${bucket}/${path}`, 'GET')
      },

      /** 上传文件（小程序端使用 Taro.uploadFile） */
      async upload(
        path: string,
        filePath: string,
        options?: { contentType?: string; upsert?: boolean }
      ): Promise<SupabaseResponse> {
        const token = getAccessToken() || SUPABASE_ANON_KEY

        try {
          const res = await Taro.uploadFile({
            url: `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
            filePath,
            name: 'file',
            header: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token}`,
              ...(options?.contentType ? { 'Content-Type': options.contentType } : {}),
              ...(options?.upsert ? { 'x-upsert': 'true' } : {}),
            },
          })

          if (res.statusCode >= 200 && res.statusCode < 300) {
            return { data: JSON.parse(res.data as string), error: null }
          }
          const errBody = JSON.parse(res.data as string)
          return {
            data: null,
            error: { message: errBody?.message || `HTTP ${res.statusCode}` },
          }
        } catch (err: any) {
          return {
            data: null,
            error: { message: err?.errMsg || '上传失败', code: 'UPLOAD_ERROR' },
          }
        }
      },

      /** 删除文件 */
      async remove(paths: string[]): Promise<SupabaseResponse> {
        return request(`/storage/v1/object/${bucket}`, 'DELETE', {
          body: { prefixes: paths },
        })
      },

      /** 列出文件 */
      async list(folder = '', options?: { limit?: number; offset?: number }): Promise<SupabaseResponse> {
        return request(`/storage/v1/object/list/${bucket}`, 'POST', {
          body: {
            prefix: folder,
            limit: options?.limit || 100,
            offset: options?.offset || 0,
          },
        })
      },
    }
  },
}

// ============================================================
// 导出统一的 supabase 客户端
// ============================================================
export const supabase = {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table)
  },
  rpc,
  auth,
  storage,
}

export default supabase
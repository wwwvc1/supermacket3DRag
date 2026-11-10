/**
 * Axios 实例：自动注入 JWT、解包统一响应 Result、401 时触发重新登录
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { Result } from '../types/api'
import { unwrapResult } from '../utils/common'

export const TOKEN_KEY = 'dianshan_token'

/** 未授权回调（由 user store 注册，用于弹出登录框） */
let unauthorizedHandler: (() => void) | null = null
export function onUnauthorized(fn: () => void) {
  unauthorizedHandler = fn
}

const instance = axios.create({ baseURL: '', timeout: 60000 })

// 请求拦截：携带 Authorization: Bearer <token>
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** 统一请求方法：返回解包后的 data，失败抛出中文错误信息 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await instance.request<Result<T>>(config)
    return unwrapResult(res.data)
  } catch (err) {
    const e = err as AxiosError<Result<unknown>>
    const status = e.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem(TOKEN_KEY)
      unauthorizedHandler?.()
      throw new Error('请先登录后再操作')
    }
    const msg = e.response?.data?.message || (err as Error).message || '网络异常'
    throw new Error(msg)
  }
}

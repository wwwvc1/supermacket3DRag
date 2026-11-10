import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { Result } from '@/types/api'

/**
 * axios 实例：统一使用相对路径（由 Vite 代理转发到后端，规避 CORS）
 * 商户端接口均为 permitAll，无需携带 Token
 */
const instance = axios.create({
  baseURL: '',
  timeout: 60000
})

/**
 * 统一请求方法：自动拆包 Result<T>
 * - code === 200 返回 data
 * - 其余情况弹出错误提示并抛出异常
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const resp = await instance.request<Result<T>>(config)
    const body = resp.data
    if (body && body.code === 200) {
      return body.data
    }
    const msg = body?.message || '请求失败'
    ElMessage.error(msg)
    throw new Error(msg)
  } catch (err: unknown) {
    // 网络层 / HTTP 状态码错误：尽量取后端返回的 message
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as Partial<Result<unknown>> | undefined
      const msg = data?.message || err.message || '网络异常'
      ElMessage.error(msg)
      throw new Error(msg)
    }
    throw err
  }
}

export default instance

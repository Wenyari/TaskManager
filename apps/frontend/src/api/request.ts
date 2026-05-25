import axios, { type AxiosResponse } from 'axios'
import router from '@/router'

interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, data, message } = response.data
    if (code === 0) {
      return data as unknown as AxiosResponse
    }
    window.$message?.error(message || '请求失败')
    return Promise.reject(new Error(message))
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      router.push({ name: 'login' })
    }
    const message = error.response?.data?.message || error.message || '网络异常'
    window.$message?.error(message)
    return Promise.reject(error)
  }
)

export function post<T = unknown>(url: string, data?: Record<string, unknown>): Promise<T> {
  return instance.post(url, data) as unknown as Promise<T>
}

export default instance

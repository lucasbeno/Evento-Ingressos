import axios, { type AxiosError } from 'axios'
import type { ApiError } from '../types'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function apiErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.message ?? fallback
}

export function apiFieldErrors(error: unknown): Record<string, string> | null {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.fieldErrors ?? null
}

export default client

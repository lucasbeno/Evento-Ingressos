import client from './client'
import type { AuthResponse } from '../types'

export function login(email: string, password: string) {
  return client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data)
}

export function register(name: string, email: string, password: string) {
  return client.post<AuthResponse>('/auth/register', { name, email, password }).then((r) => r.data)
}

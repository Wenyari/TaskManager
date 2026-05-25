import { post } from './request'

export interface AuthResult {
  token: string
  userId: string
  username: string
}

export function login(username: string, password: string): Promise<AuthResult> {
  return post<AuthResult>('/auth/login', { username, password })
}

export function register(username: string, password: string): Promise<AuthResult> {
  return post<AuthResult>('/auth/register', { username, password })
}

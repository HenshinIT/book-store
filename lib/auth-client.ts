// Client-side auth utilities
'use client'

export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getUserFromStorage() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function saveAuthData(token: string, user: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}


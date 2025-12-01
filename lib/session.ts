import { cookies, headers } from 'next/headers'
import { verifyToken } from './jwt'
import { getUserById } from './auth'

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      console.log('🔍 getCurrentUser: No token found in cookies')
      return null
    }

    console.log('🔍 getCurrentUser: Token found, length:', token.length)

    const payload = verifyToken(token)
    if (!payload) {
      console.log('🔍 getCurrentUser: Token verification failed')
      return null
    }

    console.log('🔍 getCurrentUser: Token verified, userId:', payload.userId, 'role:', payload.role)

    // Try to get from header first (set by middleware)
    const headersList = await headers()
    const userId = headersList.get('x-user-id') || payload.userId

    const user = await getUserById(userId)
    if (!user) {
      console.log('🔍 getCurrentUser: User not found in database, userId:', userId)
      return null
    }

    console.log('🔍 getCurrentUser: User found:', user.email, user.role)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

import jwt from 'jsonwebtoken'
import type { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d' // Default 30 days

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export function generateToken(payload: JWTPayload, expiresIn?: string | number): string {
  const expiresInValue: string | number = expiresIn || JWT_EXPIRES_IN
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresInValue,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error: any) {
    console.error('Token verification failed:', {
      error: error.message,
      name: error.name,
      tokenLength: token?.length || 0,
      tokenPreview: token?.substring(0, 30) + '...',
      secretLength: JWT_SECRET?.length || 0,
      secretPreview: JWT_SECRET?.substring(0, 10) + '...',
    })
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}


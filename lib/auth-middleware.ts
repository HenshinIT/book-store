import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from './jwt'
import type { UserRole } from '@prisma/client'

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    role: UserRole
  }
}

export function withAuth(
  handler: (req: AuthRequest) => Promise<NextResponse>,
  requiredRole?: UserRole
) {
  return async (req: NextRequest) => {
    const token = getTokenFromRequest(req) || 
                  req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Check role if required
    if (requiredRole) {
      const roleHierarchy: Record<UserRole, number> = {
        ADMIN: 4,
        MANAGER: 3,
        STAFF: 2,
        CUSTOMER: 1,
      }

      if (roleHierarchy[payload.role] < roleHierarchy[requiredRole]) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Attach user to request
    const authReq = req as AuthRequest
    authReq.user = payload

    return handler(authReq)
  }
}


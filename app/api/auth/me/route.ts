import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/jwt'
import { getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || 
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    )
  }
}


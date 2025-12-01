import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
        { status: 400 }
      )
    }

    // Verify token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: payload.email,
    })
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xác thực token' },
      { status: 500 }
    )
  }
}


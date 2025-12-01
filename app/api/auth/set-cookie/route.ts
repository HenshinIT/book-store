import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// API route để set cookie từ client (nếu cookie không được set tự động)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ message: 'Cookie set successfully' })
    
    // Set cookie với cùng settings như login
    const maxAge = 60 * 60 * 24 * 30 // 30 days
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: maxAge,
      path: '/',
    })
    
    console.log('Cookie set via API:', {
      tokenLength: token.length,
      maxAge,
      secure: isProduction,
    })

    return response
  } catch (error) {
    console.error('Set cookie error:', error)
    return NextResponse.json(
      { error: 'Failed to set cookie' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
  rememberMe: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const user = await getUserByEmail(validatedData.email)
    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(validatedData.password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Generate token với thời gian hết hạn dài hơn nếu remember me
    const expiresIn = validatedData.rememberMe ? '30d' : '7d'
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, expiresIn)

    // Trả về JSON response (không set cookie, chỉ trả về token trong body)
    return NextResponse.json({
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng nhập' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}


import { NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await createUser(
      validatedData.email,
      validatedData.password,
      validatedData.name
    )

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        message: 'Đăng ký thành công',
        token: token, // Thêm token vào response
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )

    // Set HTTP-only cookie (30 days for new registration)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days for new users
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đăng ký' },
      { status: 500 }
    )
  }
}


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
      console.log('User not found:', validatedData.email)
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }
    
    console.log('User found:', {
      email: user.email,
      role: user.role,
      id: user.id,
    })

    const isValid = await verifyPassword(validatedData.password, user.password)
    if (!isValid) {
      console.log('Password verification failed:', {
        email: validatedData.email,
        providedPasswordLength: validatedData.password.length,
        hashedPasswordLength: user.password.length,
      })
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

    const response = NextResponse.json({
      message: 'Đăng nhập thành công',
      token: token, // Thêm token vào response
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Set HTTP-only cookie với thời gian dài hơn nếu remember me
    // Remember me: 30 ngày, không remember: 7 ngày
    const maxAge = validatedData.rememberMe 
      ? 60 * 60 * 24 * 30 // 30 days
      : 60 * 60 * 24 * 7  // 7 days

    // Set cookie với settings phù hợp
    // Trong development, không dùng secure để cookie hoạt động trên http://localhost
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Set cookie - Next.js sẽ tự động thêm vào Set-Cookie header
    // IMPORTANT: Set cookie trước khi return response
    // Không set domain để cho phép cookie hoạt động trên localhost
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: maxAge,
      path: '/',
      // Không set domain để cookie hoạt động trên mọi subdomain và localhost
    })
    
    // Log chi tiết cho ADMIN để debug
    if (user.role === 'ADMIN') {
      console.log('🔐 ADMIN LOGIN - Cookie settings:', {
        tokenLength: token.length,
        maxAge,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        httpOnly: true,
      })
      
      // Verify cookie was set trong response object
      const cookieCheck = response.cookies.get('token')
      console.log('🔐 ADMIN LOGIN - Cookie verification:', {
        exists: !!cookieCheck,
        valueMatch: cookieCheck?.value === token,
        length: cookieCheck?.value?.length || 0,
        tokenStart: token.substring(0, 20),
        cookieStart: cookieCheck?.value?.substring(0, 20),
      })
    } else {
      // Verify cookie was set trong response object
      const cookieCheck = response.cookies.get('token')
      console.log('Cookie set in response object:', {
        exists: !!cookieCheck,
        valueMatch: cookieCheck?.value === token,
        length: cookieCheck?.value?.length || 0,
      })
    }
    
    // Log để debug
    console.log('Login successful:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      maxAge,
      rememberMe: validatedData.rememberMe,
      canAccessCMS: user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'STAFF',
    })
    
    // Verify cookie was set
    const cookieValue = response.cookies.get('token')?.value
    console.log('Cookie set in response:', {
      hasCookie: !!cookieValue,
      cookieLength: cookieValue?.length || 0,
      cookiePreview: cookieValue ? cookieValue.substring(0, 20) + '...' : 'none',
    })

    return response
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


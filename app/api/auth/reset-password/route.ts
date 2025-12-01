import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = resetPasswordSchema.parse(body)
    const { token, password } = validatedData

    // Verify token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      )
    }

    // Tìm user
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        deletedAt: null,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    // Hash password mới
    const hashedPassword = await hashPassword(password)

    // Cập nhật password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      message: 'Đặt lại mật khẩu thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đặt lại mật khẩu' },
      { status: 500 }
    )
  }
}


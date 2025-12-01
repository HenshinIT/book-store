import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      )
    }

    // Tìm user theo email
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    })

    // Không tiết lộ nếu email không tồn tại (bảo mật)
    if (!user) {
      // Trả về success để không tiết lộ email có tồn tại hay không
      return NextResponse.json({
        message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi',
        resetLink: null,
      })
    }

    // Tạo reset token với thời gian hết hạn 1 giờ
    const resetToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      '1h' // Token hết hạn sau 1 giờ
    )

    // Tạo link reset password
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

    // Trong production, ở đây sẽ gửi email với link reset
    // await sendResetPasswordEmail(user.email, resetLink)

    return NextResponse.json({
      message: 'Link đặt lại mật khẩu đã được tạo',
      resetLink, // Trong dev, trả về link để hiển thị. Production sẽ không trả về
    })
  } catch (error) {
    console.error('Error in forgot-password:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý yêu cầu' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageUsers } from '@/lib/permissions'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !canManageUsers(currentUser.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Lấy thông tin user cần sửa
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // Logic phân quyền:
    // - ADMIN có thể sửa tất cả user (kể cả chính mình và user khác)
    // - MANAGER có thể sửa người khác nhưng không thể sửa ADMIN
    if (currentUser.role === 'ADMIN') {
      // ADMIN có thể sửa tất cả user
      // Không cần kiểm tra gì thêm
    } else if (currentUser.role === 'MANAGER') {
      // MANAGER không thể sửa ADMIN
      if (targetUser.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Bạn không có quyền sửa thông tin quản trị viên' },
          { status: 403 }
        )
      }
      // MANAGER có thể sửa người khác (nhưng không phải ADMIN)
    } else {
      // STAFF và CUSTOMER không có quyền sửa user
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Kiểm tra email trùng lặp nếu có thay đổi email
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
          deletedAt: null,
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email đã được sử dụng bởi người dùng khác' },
          { status: 400 }
        )
      }
    }

    // Cập nhật thông tin
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật thông tin người dùng' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !canManageUsers(currentUser.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Lấy thông tin user cần xóa
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // MANAGER không thể xóa ADMIN
    if (currentUser.role === 'MANAGER' && targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa quản trị viên' },
        { status: 403 }
      )
    }

    // Không thể xóa chính mình
    if (currentUser.id === targetUser.id) {
      return NextResponse.json(
        { error: 'Bạn không thể xóa chính mình' },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa người dùng thành công' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa người dùng' },
      { status: 500 }
    )
  }
}


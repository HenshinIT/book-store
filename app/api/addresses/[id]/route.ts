import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const addressSchema = z.object({
  name: z.string().min(1, 'Tên người nhận là bắt buộc').optional(),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ').optional(),
  address: z.string().min(1, 'Địa chỉ là bắt buộc').optional(),
  note: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
})

// GET - Lấy chi tiết địa chỉ
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Không tìm thấy địa chỉ' },
        { status: 404 }
      )
    }

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error fetching address:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin địa chỉ' },
      { status: 500 }
    )
  }
}

// PATCH - Cập nhật địa chỉ
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    // Kiểm tra địa chỉ thuộc về user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Không tìm thấy địa chỉ' },
        { status: 404 }
      )
    }

    // Nếu đặt làm mặc định, bỏ default của các địa chỉ khác
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          id: { not: id },
          isDefault: true,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.address && { address: validatedData.address }),
        ...(validatedData.note !== undefined && { note: validatedData.note }),
        ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
      },
    })

    return NextResponse.json(address)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật địa chỉ' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa địa chỉ (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Kiểm tra địa chỉ thuộc về user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Không tìm thấy địa chỉ' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.address.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDefault: false, // Bỏ default nếu đang là default
      },
    })

    return NextResponse.json({ message: 'Đã xóa địa chỉ' })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa địa chỉ' },
      { status: 500 }
    )
  }
}


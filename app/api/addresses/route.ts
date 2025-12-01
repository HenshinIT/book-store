import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const addressSchema = z.object({
  name: z.string().min(1, 'Tên người nhận là bắt buộc'),
  phone: z.string().min(1, 'Số điện thoại là bắt buộc').regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  note: z.string().nullable().optional(),
  isDefault: z.boolean().optional().default(false),
})

// GET - Lấy danh sách địa chỉ của user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      orderBy: [
        { isDefault: 'desc' }, // Địa chỉ mặc định lên đầu
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách địa chỉ' },
      { status: 500 }
    )
  }
}

// POST - Tạo địa chỉ mới
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    // Nếu đặt làm mặc định, bỏ default của các địa chỉ khác
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        phone: validatedData.phone,
        address: validatedData.address,
        note: validatedData.note || null,
        isDefault: validatedData.isDefault || false,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo địa chỉ' },
      { status: 500 }
    )
  }
}


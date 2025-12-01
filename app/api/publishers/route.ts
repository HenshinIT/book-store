import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const publisherSchema = z.object({
  name: z.string().min(1, 'Tên nhà xuất bản không được để trống'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Email không hợp lệ'), z.literal(''), z.null()]).optional(),
  website: z.union([z.string().url('URL không hợp lệ'), z.literal(''), z.null()]).optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const publishers = await prisma.publisher.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { books: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(publishers)
  } catch (error) {
    console.error('Error fetching publishers:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách nhà xuất bản' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = publisherSchema.parse(body)

    const publisher = await prisma.publisher.create({
      data: {
        name: validatedData.name,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        email: validatedData.email === '' || validatedData.email === null ? null : validatedData.email,
        website: validatedData.website === '' || validatedData.website === null ? null : validatedData.website,
      },
    })

    return NextResponse.json(publisher, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên nhà xuất bản đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error creating publisher:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo nhà xuất bản' },
      { status: 500 }
    )
  }
}


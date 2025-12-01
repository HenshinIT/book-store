import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  description: z.string().optional(),
  imageId: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { books: true }
        },
        image: {
          select: {
            id: true,
            url: true,
            path: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách danh mục' },
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
    const validatedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        imageId: validatedData.imageId || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên danh mục hoặc slug đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo danh mục' },
      { status: 500 }
    )
  }
}


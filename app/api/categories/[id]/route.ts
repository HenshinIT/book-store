import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  imageId: z.string().nullable().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
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
    })

    if (!category) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin danh mục' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.imageId !== undefined) updateData.imageId = validatedData.imageId || null

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên danh mục hoặc slug đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật danh mục' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if category has books
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    })

    if (!category) {
      return NextResponse.json({ error: 'Không tìm thấy danh mục' }, { status: 404 })
    }

    if (category._count.books > 0) {
      return NextResponse.json(
        { error: `Không thể xóa danh mục này vì có ${category._count.books} cuốn sách đang sử dụng` },
        { status: 400 }
      )
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa danh mục thành công' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa danh mục' },
      { status: 500 }
    )
  }
}


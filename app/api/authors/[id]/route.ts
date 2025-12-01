import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const authorSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
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
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            path: true,
          },
        },
        _count: {
          select: { books: true }
        }
      },
    })

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 })
    }

    return NextResponse.json(author)
  } catch (error) {
    console.error('Error fetching author:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin tác giả' },
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
    const validatedData = authorSchema.parse(body)

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio || null
    if (validatedData.imageId !== undefined) {
      updateData.imageId = validatedData.imageId || null
    }

    const author = await prisma.author.update({
      where: { id },
      data: updateData,
      include: {
        image: {
          select: {
            id: true,
            url: true,
            path: true,
          },
        },
      },
    })

    return NextResponse.json(author)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên tác giả đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error updating author:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật tác giả' },
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
    // Check if author has books
    const author = await prisma.author.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    })

    if (!author) {
      return NextResponse.json({ error: 'Không tìm thấy tác giả' }, { status: 404 })
    }

    if (author._count.books > 0) {
      return NextResponse.json(
        { error: `Không thể xóa tác giả này vì có ${author._count.books} cuốn sách đang sử dụng` },
        { status: 400 }
      )
    }

    await prisma.author.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa tác giả thành công' })
  } catch (error) {
    console.error('Error deleting author:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa tác giả' },
      { status: 500 }
    )
  }
}


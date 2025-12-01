import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const bookSeriesSchema = z.object({
  name: z.string().min(1, 'Tên bộ sách không được để trống'),
  description: z.string().optional(),
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

    const series = await prisma.bookSeries.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        books: {
          where: {
            deletedAt: null,
          },
          include: {
            author: true,
            category: true,
            thumbnail: {
              select: {
                id: true,
                url: true,
                path: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            books: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })

    if (!series) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ sách' },
        { status: 404 }
      )
    }

    return NextResponse.json(series)
  } catch (error) {
    console.error('Error fetching book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin bộ sách' },
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
    const validatedData = bookSeriesSchema.parse(body)

    // Kiểm tra bộ sách có tồn tại không
    const existingSeries = await prisma.bookSeries.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!existingSeries) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ sách' },
        { status: 404 }
      )
    }

    // Kiểm tra tên bộ sách đã tồn tại chưa (trừ chính nó)
    const duplicateSeries = await prisma.bookSeries.findFirst({
      where: {
        name: validatedData.name,
        deletedAt: null,
        NOT: {
          id,
        },
      },
    })

    if (duplicateSeries) {
      return NextResponse.json(
        { error: 'Tên bộ sách đã tồn tại' },
        { status: 400 }
      )
    }

    const series = await prisma.bookSeries.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    })

    return NextResponse.json(series)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Error updating book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật bộ sách' },
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

    // Soft delete
    await prisma.bookSeries.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    // Set seriesId = null cho tất cả sách thuộc bộ sách này
    await prisma.book.updateMany({
      where: {
        seriesId: id,
      },
      data: {
        seriesId: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa bộ sách' },
      { status: 500 }
    )
  }
}


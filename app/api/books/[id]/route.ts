import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const bookSchema = z.object({
  title: z.string().min(1).optional(),
  authorId: z.string().optional(),
  publisherId: z.string().optional(),
  seriesId: z.string().nullable().optional(),
  description: z.string().optional(),
  isbn: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  categoryId: z.string().nullable().optional(),
  thumbnailId: z.string().nullable().optional(),
  galleryMediaIds: z.array(z.string()).optional(),
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
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        publisher: true,
        series: {
          select: {
            id: true,
            name: true,
          },
        },
        thumbnail: true,
        gallery: {
          include: {
            media: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Không tìm thấy sách' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin sách' },
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
    const validatedData = bookSchema.parse(body)

    // Extract gallery media IDs
    const { galleryMediaIds, ...bookData } = validatedData

    // Prepare update data, handle null values
    const updateData: any = { ...bookData }
    if ('categoryId' in updateData && updateData.categoryId === null) {
      updateData.categoryId = null
    }
    if ('seriesId' in updateData) {
      updateData.seriesId = updateData.seriesId || null
    }
    if ('thumbnailId' in updateData) {
      updateData.thumbnailId = updateData.thumbnailId || null
    }

    // Handle gallery update
    if ('galleryMediaIds' in validatedData) {
      // Delete existing gallery entries
      await prisma.bookGallery.deleteMany({
        where: { bookId: id },
      })

      // Create new gallery entries if provided
      if (galleryMediaIds && galleryMediaIds.length > 0) {
        updateData.gallery = {
          create: galleryMediaIds.map((mediaId, index) => ({
            mediaId,
            order: index,
          })),
        }
      }
    }

    const book = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        thumbnail: true,
        gallery: {
          include: {
            media: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật sách' },
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
    await prisma.book.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa sách thành công' })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa sách' },
      { status: 500 }
    )
  }
}


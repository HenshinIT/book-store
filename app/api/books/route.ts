import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const bookSchema = z.object({
  title: z.string().min(1, 'Tên sách không được để trống'),
  authorId: z.string().optional(),
  publisherId: z.string().optional(),
  seriesId: z.string().nullable().optional(),
  description: z.string().optional(),
  isbn: z.string().optional(),
  price: z.number().positive('Giá phải lớn hơn 0'),
  stock: z.number().int().min(0, 'Số lượng tồn kho phải lớn hơn hoặc bằng 0'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  categoryId: z.string().nullable().optional(),
  thumbnailId: z.string().nullable().optional(),
  galleryMediaIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const books = await prisma.book.findMany({
      where: { deletedAt: null },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sách' },
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
    const validatedData = bookSchema.parse(body)

    // Extract gallery media IDs
    const { galleryMediaIds, ...bookData } = validatedData

    // Prepare create data
    const createData: any = {
      ...bookData,
      createdBy: user.id,
      thumbnailId: validatedData.thumbnailId || null,
      gallery: galleryMediaIds && galleryMediaIds.length > 0
        ? {
            create: galleryMediaIds.map((mediaId, index) => ({
              mediaId,
              order: index,
            })),
          }
        : undefined,
    }

    const book = await prisma.book.create({
      data: createData,
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

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo sách' },
      { status: 500 }
    )
  }
}


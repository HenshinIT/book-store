import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const book = await prisma.book.findFirst({
      where: {
        id,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
            image: {
              select: {
                id: true,
                url: true,
                path: true,
              },
            },
          },
        },
        publisher: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        thumbnail: {
          select: {
            id: true,
            url: true,
            path: true,
            filename: true,
            originalName: true,
          },
        },
        gallery: {
          include: {
            media: {
              select: {
                id: true,
                url: true,
                path: true,
                filename: true,
                originalName: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Không tìm thấy sách' },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error fetching public book:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin sách' },
      { status: 500 }
    )
  }
}

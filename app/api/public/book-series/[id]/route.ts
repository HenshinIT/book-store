import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
            status: 'ACTIVE',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
      },
    })

    if (!series) {
      return NextResponse.json(
        { error: 'Không tìm thấy bộ sách' },
        { status: 404 }
      )
    }

    // Tính tổng giá và giá sau giảm 10%
    const totalPrice = series.books.reduce((sum, book) => sum + book.price, 0)
    const discountedPrice = totalPrice * 0.9 // Giảm 10%

    return NextResponse.json({
      ...series,
      totalPrice,
      discountedPrice,
      discount: totalPrice - discountedPrice,
    })
  } catch (error) {
    console.error('Error fetching public book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin bộ sách' },
      { status: 500 }
    )
  }
}


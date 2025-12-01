import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Get book series with pagination
    const [series, total] = await Promise.all([
      prisma.bookSeries.findMany({
        where: { deletedAt: null },
        include: {
          books: {
            where: {
              deletedAt: null,
              status: 'ACTIVE',
            },
            select: {
              id: true,
              price: true,
              stock: true,
            },
          },
          _count: {
            select: {
              books: {
                where: {
                  deletedAt: null,
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookSeries.count({
        where: { deletedAt: null },
      }),
    ])

    // Tính giá cho mỗi bộ sách
    const seriesWithPrices = series.map((s) => {
      const totalPrice = s.books.reduce((sum, book) => sum + book.price, 0)
      const discountedPrice = totalPrice * 0.9
      const allInStock = s.books.every((book) => book.stock > 0)
      const minStock = s.books.length > 0 
        ? Math.min(...s.books.map((book) => book.stock))
        : 0

      return {
        ...s,
        totalPrice,
        discountedPrice,
        discount: totalPrice - discountedPrice,
        allInStock,
        minStock,
      }
    })

    return NextResponse.json({
      series: seriesWithPrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching public book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách bộ sách' },
      { status: 500 }
    )
  }
}


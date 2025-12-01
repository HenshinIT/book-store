import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Không tìm thấy danh mục' },
        { status: 404 }
      )
    }

    // Get books in this category
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: {
          categoryId: category.id,
          deletedAt: null,
          status: 'ACTIVE',
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
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
            },
          },
          thumbnail: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
          gallery: {
            include: {
              media: {
                select: {
                  id: true,
                  url: true,
                  path: true,
                },
              },
            },
            orderBy: { order: 'asc' },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.book.count({
        where: {
          categoryId: category.id,
          deletedAt: null,
          status: 'ACTIVE',
        },
      }),
    ])

    return NextResponse.json({
      category,
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching category books:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sách theo danh mục' },
      { status: 500 }
    )
  }
}

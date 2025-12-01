import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const authorId = searchParams.get('author')
    const publisherId = searchParams.get('publisher')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      deletedAt: null,
      status: 'ACTIVE', // Chỉ lấy sách đang hoạt động
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
        deletedAt: null,
      }
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (publisherId) {
      where.publisherId = publisherId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        {
          author: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    // Get books with pagination
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
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
            take: 5, // Limit gallery images for list view
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching public books:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sách' },
      { status: 500 }
    )
  }
}

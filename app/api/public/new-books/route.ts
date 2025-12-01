import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    // New books - sách mới nhất
    const books = await prisma.book.findMany({
      where: {
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
          take: 3, // Limit gallery for list view
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ books })
  } catch (error) {
    console.error('Error fetching new books:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách sách mới' },
      { status: 500 }
    )
  }
}

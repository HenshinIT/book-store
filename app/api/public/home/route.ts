import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Lấy dữ liệu song song để tối ưu performance
    const [featuredBooks, newBooks, categories, stats] = await Promise.all([
      // Featured books - lấy 6 sách đầu tiên (có thể thay đổi logic sau)
      prisma.book.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),

      // New books - sách mới nhất (6 cuốn)
      prisma.book.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),

      // Categories với số lượng sách
      prisma.category.findMany({
        where: { deletedAt: null },
        include: {
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
        orderBy: { name: 'asc' },
        take: 6, // Top 6 categories
      }),

      // Stats
      Promise.all([
        prisma.book.count({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        }),
        prisma.category.count({
          where: { deletedAt: null },
        }),
        prisma.author.count({
          where: { deletedAt: null },
        }),
      ]).then(([totalBooks, totalCategories, totalAuthors]) => ({
        totalBooks,
        totalCategories,
        totalAuthors,
      })),
    ])

    return NextResponse.json({
      featuredBooks,
      newBooks,
      categories,
      stats,
    })
  } catch (error) {
    console.error('Error fetching home data:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy dữ liệu trang chủ' },
      { status: 500 }
    )
  }
}

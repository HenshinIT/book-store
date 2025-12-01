import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
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
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching public categories:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách danh mục' },
      { status: 500 }
    )
  }
}

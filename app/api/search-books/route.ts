import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const q = searchParams.get('q')?.trim() || ''
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  // Tạo bộ lọc giá
  let priceFilter: any = {}
  if (minPrice) priceFilter.gte = Number(minPrice)
  if (maxPrice) priceFilter.lte = Number(maxPrice)

  const books = await prisma.book.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',

      AND: [
        // FILTER THEO GIÁ (nếu có)
        Object.keys(priceFilter).length > 0
          ? { price: priceFilter }
          : {},

        // FILTER TỪ KHÓA
        q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { author: { name: { contains: q, mode: 'insensitive' } } },
                { category: { name: { contains: q, mode: 'insensitive' } } },
              ]
            }
          : {},
      ],
    },

    select: {
      id: true,
      title: true,
      price: true,
      thumbnail: { select: { url: true } },
      author: { select: { name: true } },
      category: { select: { name: true } }
    },

    orderBy: { price: 'asc' },
    take: 30,
  })

  return NextResponse.json(books)
}

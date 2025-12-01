import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const bookSeriesSchema = z.object({
  name: z.string().min(1, 'Tên bộ sách không được để trống'),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const series = await prisma.bookSeries.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            books: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(series)
  } catch (error) {
    console.error('Error fetching book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách bộ sách' },
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
    const validatedData = bookSeriesSchema.parse(body)

    // Kiểm tra tên bộ sách đã tồn tại chưa
    const existingSeries = await prisma.bookSeries.findFirst({
      where: {
        name: validatedData.name,
        deletedAt: null,
      },
    })

    if (existingSeries) {
      return NextResponse.json(
        { error: 'Tên bộ sách đã tồn tại' },
        { status: 400 }
      )
    }

    const series = await prisma.bookSeries.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    })

    return NextResponse.json(series, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Error creating book series:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo bộ sách' },
      { status: 500 }
    )
  }
}


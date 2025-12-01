import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const authorSchema = z.object({
  name: z.string().min(1, 'Tên tác giả không được để trống'),
  bio: z.string().optional(),
  imageId: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authors = await prisma.author.findMany({
      where: { deletedAt: null },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            path: true,
          },
        },
        _count: {
          select: { books: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(authors)
  } catch (error) {
    console.error('Error fetching authors:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách tác giả' },
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
    const validatedData = authorSchema.parse(body)

    const author = await prisma.author.create({
      data: {
        name: validatedData.name,
        bio: validatedData.bio || null,
        imageId: validatedData.imageId || null,
      },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            path: true,
          },
        },
      },
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên tác giả đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error creating author:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo tác giả' },
      { status: 500 }
    )
  }
}


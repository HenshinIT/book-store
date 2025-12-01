import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'
import { z } from 'zod'

const publisherSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        _count: {
          select: { books: true }
        }
      },
    })

    if (!publisher) {
      return NextResponse.json({ error: 'Không tìm thấy nhà xuất bản' }, { status: 404 })
    }

    return NextResponse.json(publisher)
  } catch (error) {
    console.error('Error fetching publisher:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin nhà xuất bản' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = publisherSchema.parse(body)

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email === '' || validatedData.email === null ? null : validatedData.email
    }
    if (validatedData.website !== undefined) {
      updateData.website = validatedData.website === '' || validatedData.website === null ? null : validatedData.website
    }

    const publisher = await prisma.publisher.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(publisher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên nhà xuất bản đã tồn tại' },
        { status: 400 }
      )
    }

    console.error('Error updating publisher:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Có lỗi xảy ra khi cập nhật nhà xuất bản: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if publisher has books
    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    })

    if (!publisher) {
      return NextResponse.json({ error: 'Không tìm thấy nhà xuất bản' }, { status: 404 })
    }

    if (publisher._count.books > 0) {
      return NextResponse.json(
        { error: `Không thể xóa nhà xuất bản này vì có ${publisher._count.books} cuốn sách đang sử dụng` },
        { status: 400 }
      )
    }

    await prisma.publisher.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa nhà xuất bản thành công' })
  } catch (error) {
    console.error('Error deleting publisher:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa nhà xuất bản' },
      { status: 500 }
    )
  }
}


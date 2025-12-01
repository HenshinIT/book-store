import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
})

// PATCH - Cập nhật số lượng item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { quantity } = updateCartItemSchema.parse(body)

    // Lấy cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        book: true,
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Không tìm thấy item trong giỏ hàng' },
        { status: 404 }
      )
    }

    // Kiểm tra user có sở hữu cart này không
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Kiểm tra stock
    if (quantity > cartItem.book.stock) {
      return NextResponse.json(
        { error: `Số lượng không đủ. Chỉ còn ${cartItem.book.stock} cuốn` },
        { status: 400 }
      )
    }

    // Cập nhật quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        book: {
          include: {
            thumbnail: {
              select: {
                id: true,
                url: true,
                path: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật giỏ hàng' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa item khỏi giỏ hàng
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Lấy cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Không tìm thấy item trong giỏ hàng' },
        { status: 404 }
      )
    }

    // Kiểm tra user có sở hữu cart này không
    if (cartItem.cart.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.cartItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa item khỏi giỏ hàng' })
  } catch (error) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa item khỏi giỏ hàng' },
      { status: 500 }
    )
  }
}

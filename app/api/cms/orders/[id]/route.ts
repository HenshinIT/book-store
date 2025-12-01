import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canAccessCMS } from '@/lib/permissions'
import { z } from 'zod'

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  shippingPhone: z.string().min(1, 'Số điện thoại là bắt buộc').optional(),
})

const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

// PATCH - Cập nhật trạng thái đơn hàng (admin/manager)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canAccessCMS(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateOrderStatusSchema.parse(body)

    // Lấy đơn hàng hiện tại
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            book: { select: { id: true, title: true, stock: true } },
          },
        },
      },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    if (currentOrder.deletedAt) {
      return NextResponse.json({ error: 'Đơn hàng đã bị xóa' }, { status: 400 })
    }

    // Ràng buộc: không được quay ngược trạng thái
    const oldIndex = statusFlow.indexOf(currentOrder.status)
    const newIndex = statusFlow.indexOf(validatedData.status)

    if (
      newIndex < oldIndex && // quay ngược trạng thái
      validatedData.status !== 'CANCELLED' // trừ trường hợp hủy
    ) {
      return NextResponse.json(
        {
          error: `Không thể quay lại trạng thái đơn hàng sau khi bấm xác nhận trạng thái !!!`
        },
        { status: 400 }
      )
    }

    //  Kiểm tra số điện thoại giao hàng
    if (!currentOrder.shippingPhone || currentOrder.shippingPhone.trim() === '') {
      if (!validatedData.shippingPhone || validatedData.shippingPhone.trim() === '') {
        return NextResponse.json(
          { error: 'Đơn hàng phải có số điện thoại giao hàng' },
          { status: 400 }
        )
      }
    }

    // Xử lý riêng khi hủy đơn hàng - khôi phục stock
    if (validatedData.status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of currentOrder.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: { stock: { increment: item.quantity } },
          })
        }

        await tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            shippingPhone: validatedData.shippingPhone || currentOrder.shippingPhone,
          },
        })
      })

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  thumbnail: { select: { id: true, url: true, path: true } },
                },
              },
            },
          },
        },
      })

      return NextResponse.json({ order: updatedOrder })
    }

    //  Xử lý các trạng thái khác (bình thường)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: validatedData.status,
        shippingPhone: validatedData.shippingPhone || currentOrder.shippingPhone,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                thumbnail: { select: { id: true, url: true, path: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng' },
      { status: 500 }
    )
  }
}

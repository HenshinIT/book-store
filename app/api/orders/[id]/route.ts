import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const cancelOrderSchema = z.object({
  status: z.literal('CANCELLED'),
})

// GET - Lấy chi tiết đơn hàng
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
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
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    // Kiểm tra quyền - chỉ chủ đơn hàng mới xem được
    if (order.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin đơn hàng' },
      { status: 500 }
    )
  }
}

// PATCH - Hủy đơn hàng (chỉ user sở hữu đơn hàng mới được hủy)
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
    const validatedData = cancelOrderSchema.parse(body)

    // Chỉ cho phép hủy đơn hàng nếu status là CANCELLED
    if (validatedData.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Chỉ có thể hủy đơn hàng từ endpoint này' },
        { status: 400 }
      )
    }

    // Lấy đơn hàng hiện tại
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                stock: true,
              },
            },
          },
        },
      },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 })
    }

    // Kiểm tra quyền - chỉ chủ đơn hàng mới hủy được
    if (currentOrder.userId !== user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền hủy đơn hàng này' },
        { status: 403 }
      )
    }

    // Chỉ cho phép hủy đơn hàng ở trạng thái PENDING hoặc CONFIRMED
    if (
      currentOrder.status !== 'PENDING' &&
      currentOrder.status !== 'CONFIRMED'
    ) {
      return NextResponse.json(
        {
          error: `Không thể hủy đơn hàng ở trạng thái "${currentOrder.status}". Chỉ có thể hủy đơn hàng chờ xác nhận hoặc đã xác nhận.`,
        },
        { status: 400 }
      )
    }

    // Nếu đơn hàng đã bị xóa (soft delete)
    if (currentOrder.deletedAt) {
      return NextResponse.json(
        { error: 'Đơn hàng đã bị xóa' },
        { status: 400 }
      )
    }

    // Hủy đơn hàng và khôi phục stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Khôi phục stock cho từng item
      for (const item of currentOrder.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      // Cập nhật trạng thái đơn hàng
      return await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          items: {
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
                },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi hủy đơn hàng' },
      { status: 500 }
    )
  }
}


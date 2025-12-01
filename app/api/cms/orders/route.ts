import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canAccessCMS } from '@/lib/permissions'

// GET - Lấy danh sách tất cả đơn hàng (admin/manager)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !canAccessCMS(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }

    if (status) {
      where.status = status
    }

    // ==============================================
    // TÌM KIẾM NÂNG CAO (tên, email, SĐT, mã đơn, tổng tiền)
    // ==============================================
    if (search.trim()) {
      const searchTrimmed = search.trim()
      const searchConditions: any[] = [
        { id: { contains: searchTrimmed, mode: 'insensitive' } },
        { shippingName: { contains: searchTrimmed, mode: 'insensitive' } },
        { shippingPhone: { contains: searchTrimmed, mode: 'insensitive' } },
        { shippingAddress: { contains: searchTrimmed, mode: 'insensitive' } },
        { user: { email: { contains: searchTrimmed, mode: 'insensitive' } } },
      ]

      // Hỗ trợ tìm theo khoảng: 100000-500000
      const rangeMatch = searchTrimmed.match(/^(\d+)\s*-\s*(\d+)$/)
      if (rangeMatch) {
        const min = Number(rangeMatch[1])
        const max = Number(rangeMatch[2])
        if (!isNaN(min) && !isNaN(max)) {
          searchConditions.push({ total: { gte: min, lte: max } })
        }
      }

      //  Hỗ trợ so sánh: >100000, <500000, >=200000, <=1000000
      const numericMatch = searchTrimmed.match(/^(>=|<=|>|<)?\s*(\d+(\.\d+)?)$/)
      if (numericMatch) {
        const operator = numericMatch[1]
        const numberValue = Number(numericMatch[2])
        if (!isNaN(numberValue)) {
          switch (operator) {
            case '>':
              searchConditions.push({ total: { gt: numberValue } })
              break
            case '<':
              searchConditions.push({ total: { lt: numberValue } })
              break
            case '>=':
              searchConditions.push({ total: { gte: numberValue } })
              break
            case '<=':
              searchConditions.push({ total: { lte: numberValue } })
              break
            default:
              searchConditions.push({ total: numberValue })
          }
        }
      }

      where.OR = searchConditions
    }

    // ==============================================
    // TRUY VẤN DỮ LIỆU
    // ==============================================
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
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
            take: 3, // Preview 3 sản phẩm đầu
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    // Tính tổng số sản phẩm cho mỗi đơn
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await prisma.orderItem.count({
          where: { orderId: order.id },
        })
        return {
          ...order,
          totalItems: itemCount,
        }
      })
    )

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      orders: ordersWithItemCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách đơn hàng' },
      { status: 500 }
    )
  }
}

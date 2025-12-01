import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN, MANAGER, STAFF mới được xem thống kê
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Thống kê cơ bản
    const [
      totalBooks,
      totalUsers,
      totalOrders,
      outOfStockBooks,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      // Tổng số sách
      prisma.book.count({
        where: { deletedAt: null },
      }),
      // Tổng số người dùng
      prisma.user.count({
        where: { deletedAt: null },
      }),
      // Tổng số đơn hàng
      prisma.order.count({
        where: { deletedAt: null },
      }),
      // Sách hết hàng
      prisma.book.count({
        where: { status: 'OUT_OF_STOCK', deletedAt: null },
      }),
      // Tổng doanh thu (chỉ đơn hàng đã giao)
      prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
        },
        _sum: {
          total: true,
        },
      }),
      // Doanh thu hôm nay
      prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: { gte: todayStart },
        },
        _sum: {
          total: true,
        },
      }),
      // Doanh thu 7 ngày qua
      prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: { gte: weekStart },
        },
        _sum: {
          total: true,
        },
      }),
      // Doanh thu tháng này
      prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: { gte: monthStart },
        },
        _sum: {
          total: true,
        },
      }),
      // Doanh thu năm này
      prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: { gte: yearStart },
        },
        _sum: {
          total: true,
        },
      }),
      // Đơn hàng hôm nay
      prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: todayStart },
        },
      }),
      // Đơn hàng 7 ngày qua
      prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: weekStart },
        },
      }),
      // Đơn hàng tháng này
      prisma.order.count({
        where: {
          deletedAt: null,
          createdAt: { gte: monthStart },
        },
      }),
      // Đơn hàng chờ xác nhận
      prisma.order.count({
        where: {
          deletedAt: null,
          status: 'PENDING',
        },
      }),
      // Đơn hàng đã xác nhận
      prisma.order.count({
        where: {
          deletedAt: null,
          status: 'CONFIRMED',
        },
      }),
      // Đơn hàng đã giao
      prisma.order.count({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
        },
      }),
      // Đơn hàng đã hủy
      prisma.order.count({
        where: {
          deletedAt: null,
          status: 'CANCELLED',
        },
      }),
    ])

    // Top sách bán chạy (10 cuốn)
    const topBooks = await prisma.orderItem.groupBy({
      by: ['bookId'],
      where: {
        order: {
          deletedAt: null,
          status: { not: 'CANCELLED' },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    })

    // Lấy thông tin chi tiết sách
    const topBooksWithDetails = await Promise.all(
      topBooks.map(async (item) => {
        const book = await prisma.book.findUnique({
          where: { id: item.bookId },
          select: {
            id: true,
            title: true,
            price: true,
            thumbnail: {
              select: {
                url: true,
              },
            },
          },
        })
        return {
          bookId: item.bookId,
          title: book?.title || 'Đã xóa',
          price: book?.price || 0,
          thumbnail: book?.thumbnail?.url || null,
          totalSold: item._sum.quantity || 0,
          orderCount: item._count.id || 0,
        }
      })
    )

    // Thống kê doanh thu 7 ngày gần nhất
    const revenueByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayStart)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayRevenue = await prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      })

      revenueByDay.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue._sum.total || 0,
        orderCount: dayRevenue._count.id || 0,
      })
    }

    // Thống kê doanh thu theo tháng (12 tháng gần nhất)
    const revenueByMonth = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const monthRevenue = await prisma.order.aggregate({
        where: {
          deletedAt: null,
          status: 'DELIVERED',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      })

      revenueByMonth.push({
        month: date.toISOString().slice(0, 7),
        revenue: monthRevenue._sum.total || 0,
        orderCount: monthRevenue._count.id || 0,
      })
    }

    // Thống kê theo danh mục
    const categoryStats = await prisma.book.groupBy({
      by: ['categoryId'],
      where: {
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    })

    const categoryStatsWithDetails = await Promise.all(
      categoryStats.map(async (stat) => {
        if (!stat.categoryId) {
          return {
            categoryId: null,
            categoryName: 'Chưa phân loại',
            bookCount: stat._count.id,
          }
        }
        const category = await prisma.category.findUnique({
          where: { id: stat.categoryId },
          select: { name: true },
        })
        return {
          categoryId: stat.categoryId,
          categoryName: category?.name || 'Đã xóa',
          bookCount: stat._count.id,
        }
      })
    )

    return NextResponse.json({
      overview: {
        totalBooks,
        totalUsers,
        totalOrders,
        outOfStockBooks,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0,
        week: weekRevenue._sum.total || 0,
        month: monthRevenue._sum.total || 0,
        year: yearRevenue._sum.total || 0,
      },
      orders: {
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
        byStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },
      topBooks: topBooksWithDetails,
      revenueByDay,
      revenueByMonth,
      categoryStats: categoryStatsWithDetails,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thống kê' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const createOrderSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'COD']),
  shippingName: z.string().min(1, 'Tên người nhận là bắt buộc'),
  shippingPhone: z.string().min(1, 'Số điện thoại là bắt buộc'),
  shippingAddress: z.string().min(1, 'Địa chỉ giao hàng là bắt buộc'),
  shippingNote: z.string().nullable().optional(),
})

// GET - Lấy danh sách đơn hàng của user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    // Tính tổng số items cho mỗi order và tạo preview
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await prisma.orderItem.count({
          where: { orderId: order.id },
        })
        return {
          ...order,
          totalItems: itemCount,
          previewItems: order.items.slice(0, 3), // Chỉ preview 3 items đầu
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để đặt hàng' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' },
        { status: 400 }
      )
    }

    let validatedData
    try {
      validatedData = createOrderSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        return NextResponse.json(
          { error: firstError.message || 'Dữ liệu không hợp lệ' },
          { status: 400 }
        )
      }
      throw error
    }

    // Sử dụng transaction để đảm bảo tính nguyên tử
    // Thêm timeout để tránh transaction quá dài
    const order = await prisma.$transaction(
      async (tx) => {
      // Lấy giỏ hàng với lock để tránh race condition
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  stock: true,
                },
              },
            },
          },
        },
      })

      if (!cart || cart.items.length === 0) {
        throw new Error('Giỏ hàng trống')
      }

      // Lấy thông tin series cho các sách trong cart
      const bookIds = cart.items.map((item) => item.bookId)
      const booksWithSeries = await tx.book.findMany({
        where: {
          id: { in: bookIds },
          deletedAt: null,
        },
        select: {
          id: true,
          seriesId: true,
          series: {
            select: {
              id: true,
              name: true,
              books: {
                where: {
                  deletedAt: null,
                  status: 'ACTIVE',
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      })

      // Nhóm sách theo series
      const seriesMap = new Map<string, { series: any; bookIds: Set<string>; cartBookIds: Set<string> }>()
      
      booksWithSeries.forEach((book) => {
        if (book.seriesId && book.series) {
          if (!seriesMap.has(book.seriesId)) {
            seriesMap.set(book.seriesId, {
              series: book.series,
              bookIds: new Set(book.series.books.map((b) => b.id)),
              cartBookIds: new Set(),
            })
          }
          const seriesData = seriesMap.get(book.seriesId)!
          const cartItem = cart.items.find((item) => item.bookId === book.id)
          if (cartItem) {
            seriesData.cartBookIds.add(book.id)
          }
        }
      })

      // Kiểm tra stock và tính tổng với giảm giá cho bộ sách
      let total = 0
      const stockChecks: Array<{
        bookId: string
        quantity: number
        title: string
        price: number
      }> = []
      const appliedSeries = new Set<string>()

      // Xử lý các bộ sách hoàn chỉnh trước
      for (const [seriesId, seriesData] of seriesMap.entries()) {
        const hasAllBooks = seriesData.bookIds.size === seriesData.cartBookIds.size &&
          Array.from(seriesData.bookIds).every((id) => seriesData.cartBookIds.has(id))

        if (hasAllBooks) {
          // Kiểm tra stock và tính giá cho bộ sách
          const seriesBooksInCart = cart.items.filter((item) =>
            seriesData.cartBookIds.has(item.bookId)
          )
          
          // Lấy thông tin tất cả sách trong bộ cùng lúc để tối ưu
          const seriesBookIds = seriesBooksInCart.map((item) => item.bookId)
          const seriesBooksData = await tx.book.findMany({
            where: {
              id: { in: seriesBookIds },
              deletedAt: null,
            },
            select: { id: true, title: true, price: true, stock: true },
          })

          // Tạo map để truy cập nhanh
          const booksMap = new Map(seriesBooksData.map((b) => [b.id, b]))
          
          let seriesTotal = 0
          for (const item of seriesBooksInCart) {
            const book = booksMap.get(item.bookId)

            if (!book) {
              throw new Error(`Sách không tồn tại`)
            }

            if (book.stock < item.quantity) {
              throw new Error(
                `Sách "${book.title}" chỉ còn ${book.stock} cuốn. Vui lòng cập nhật giỏ hàng.`
              )
            }

            seriesTotal += book.price * item.quantity
            stockChecks.push({
              bookId: item.bookId,
              quantity: item.quantity,
              title: book.title,
              price: book.price,
            })
          }

          // Áp dụng giảm giá 10%
          total += seriesTotal * 0.9
          appliedSeries.add(seriesId)
        }
      }

      // Xử lý các sách không thuộc bộ hoặc bộ chưa đủ
      // Lấy danh sách sách cần xử lý
      const nonSeriesItems = cart.items.filter((item) => {
        const book = booksWithSeries.find((b) => b.id === item.bookId)
        return !book || !book.seriesId || !appliedSeries.has(book.seriesId)
      })

      if (nonSeriesItems.length > 0) {
        // Lấy thông tin tất cả sách cùng lúc để tối ưu
        const nonSeriesBookIds = nonSeriesItems.map((item) => item.bookId)
        const nonSeriesBooksData = await tx.book.findMany({
          where: {
            id: { in: nonSeriesBookIds },
            deletedAt: null,
          },
            select: { id: true, title: true, price: true, stock: true },
          })

        // Tạo map để truy cập nhanh
        const nonSeriesBooksMap = new Map(nonSeriesBooksData.map((b) => [b.id, b]))

        for (const item of nonSeriesItems) {
          const bookData = nonSeriesBooksMap.get(item.bookId)

          if (!bookData) {
            throw new Error(`Sách không tồn tại`)
          }

          if (bookData.stock < item.quantity) {
            throw new Error(
              `Sách "${bookData.title}" chỉ còn ${bookData.stock} cuốn. Vui lòng cập nhật giỏ hàng.`
            )
          }

          total += bookData.price * item.quantity
          stockChecks.push({
            bookId: item.bookId,
            quantity: item.quantity,
            title: bookData.title,
            price: bookData.price,
          })
        }
      }

      // Tạo đơn hàng
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          status: 'PENDING',
          paymentMethod: validatedData.paymentMethod as 'BANK_TRANSFER' | 'COD',
          shippingName: validatedData.shippingName,
          shippingPhone: validatedData.shippingPhone,
          shippingAddress: validatedData.shippingAddress,
          shippingNote: validatedData.shippingNote || null,
          items: {
            create: stockChecks.map((check) => ({
              bookId: check.bookId,
              quantity: check.quantity,
              price: check.price,
            })),
          },
        },
      })

      // Cập nhật stock với kiểm tra để tránh stock âm
      // Tối ưu bằng cách sử dụng updateMany với điều kiện và kiểm tra kết quả
      for (const check of stockChecks) {
        // Cập nhật stock với điều kiện để đảm bảo không bị stock âm
        // Chỉ update nếu stock >= quantity
        const updateResult = await tx.book.updateMany({
          where: {
            id: check.bookId,
            stock: {
              gte: check.quantity, // Chỉ update nếu stock >= quantity
            },
            deletedAt: null, // Đảm bảo sách chưa bị xóa
          },
          data: {
            stock: {
              decrement: check.quantity,
            },
          },
        })

        // Nếu không có record nào được update, có nghĩa là stock không đủ
        if (updateResult.count === 0) {
          // Lấy thông tin sách để hiển thị lỗi chính xác
          const bookInfo = await tx.book.findUnique({
            where: { id: check.bookId },
            select: { stock: true, title: true },
          })
          
          if (!bookInfo) {
            throw new Error(`Sách "${check.title}" không tồn tại`)
          }
          
          throw new Error(
            `Sách "${bookInfo.title}" chỉ còn ${bookInfo.stock} cuốn. Vui lòng cập nhật giỏ hàng.`
          )
        }
      }

      // Xóa giỏ hàng
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // Lấy lại order với đầy đủ thông tin
      return await tx.order.findUnique({
        where: { id: newOrder.id },
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
      },
      {
        maxWait: 10000, // Đợi tối đa 10 giây để bắt đầu transaction
        timeout: 30000, // Timeout sau 30 giây nếu transaction chưa hoàn thành
      }
    )

    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    // Xử lý lỗi từ transaction
    if (error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo đơn hàng' },
      { status: 500 }
    )
  }
}


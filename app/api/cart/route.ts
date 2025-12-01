import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { z } from 'zod'

const addToCartSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  quantity: z.number().int().positive().default(1),
})

// GET - Lấy giỏ hàng của user hiện tại
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tìm hoặc tạo cart cho user
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
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
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Tạo cart mới nếu chưa có
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
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
                  author: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    // Lấy thông tin series cho các sách trong cart
    const bookIds = cart.items.map((item) => item.bookId)
    const booksWithSeries = await prisma.book.findMany({
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

    // Nhóm sách theo series và tính giảm giá
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

    // Tính tổng tiền với giảm giá cho các bộ sách hoàn chỉnh
    let total = 0
    let seriesDiscount = 0
    const appliedSeries = new Set<string>()

    for (const [seriesId, seriesData] of seriesMap.entries()) {
      // Kiểm tra xem có đủ tất cả sách trong bộ không
      const hasAllBooks = seriesData.bookIds.size === seriesData.cartBookIds.size &&
        Array.from(seriesData.bookIds).every((id) => seriesData.cartBookIds.has(id))

      if (hasAllBooks) {
        // Tính giá gốc của bộ sách trong cart
        const seriesBooksInCart = cart.items.filter((item) =>
          seriesData.cartBookIds.has(item.bookId)
        )
        const seriesTotal = seriesBooksInCart.reduce(
          (sum, item) => sum + item.book.price * item.quantity,
          0
        )
        const seriesDiscounted = seriesTotal * 0.9
        seriesDiscount += seriesTotal - seriesDiscounted
        total += seriesDiscounted
        appliedSeries.add(seriesId)
      }
    }

    // Tính giá cho các sách không thuộc bộ hoặc bộ chưa đủ
    cart.items.forEach((item) => {
      const book = booksWithSeries.find((b) => b.id === item.bookId)
      if (!book || !book.seriesId || !appliedSeries.has(book.seriesId)) {
        total += item.book.price * item.quantity
      }
    })

    return NextResponse.json({
      cart,
      total,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      seriesDiscount,
      appliedSeries: Array.from(appliedSeries),
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy giỏ hàng' },
      { status: 500 }
    )
  }
}

// POST - Thêm sách vào giỏ hàng
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.log('Cart POST: Unauthorized - no user')
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thêm vào giỏ hàng' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Cart POST: Invalid JSON body', error)
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      )
    }

    let bookId: string
    let quantity: number
    try {
      const parsed = addToCartSchema.parse(body)
      bookId = parsed.bookId
      quantity = parsed.quantity
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Cart POST: Validation error', error.errors)
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // Kiểm tra sách có tồn tại và còn hàng không
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Không tìm thấy sách' },
        { status: 404 }
      )
    }

    if (book.stock < quantity) {
      return NextResponse.json(
        { error: `Số lượng không đủ. Chỉ còn ${book.stock} cuốn` },
        { status: 400 }
      )
    }

    // Tìm hoặc tạo cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      })
    }

    // Kiểm tra xem sách đã có trong giỏ hàng chưa
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_bookId: {
          cartId: cart.id,
          bookId: bookId,
        },
      },
    })

    let cartItem
    if (existingItem) {
      // Cập nhật quantity
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > book.stock) {
        return NextResponse.json(
          { error: `Số lượng vượt quá tồn kho. Chỉ còn ${book.stock} cuốn` },
          { status: 400 }
        )
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Tạo item mới
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          bookId: bookId,
          quantity: quantity,
        },
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
    }

    console.log('Cart POST: Successfully added item', {
      cartItemId: cartItem.id,
      bookId: cartItem.bookId,
      quantity: cartItem.quantity,
    })

    return NextResponse.json(cartItem, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error adding to cart:', error)
    
    // Log chi tiết lỗi để debug
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Có lỗi xảy ra khi thêm vào giỏ hàng',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa toàn bộ giỏ hàng
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    })

    if (cart) {
      await prisma.cart.delete({
        where: { id: cart.id },
      })
    }

    return NextResponse.json({ message: 'Đã xóa giỏ hàng' })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa giỏ hàng' },
      { status: 500 }
    )
  }
}

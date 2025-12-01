import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import BookImage from '@/components/BookImage'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

function getPaymentMethodName(method: string | null) {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Chuyển khoản ngân hàng'
    case 'COD':
      return 'Thanh toán khi nhận hàng (COD)'
    default:
      return 'Chưa chọn'
  }
}

function getStatusName(status: string) {
  const statusMap: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đã giao hàng',
    DELIVERED: 'Đã nhận hàng',
    CANCELLED: 'Đã hủy',
  }
  return statusMap[status] || status
}

export default async function OrderPage({ params }: PageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
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
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  // Kiểm tra user có phải chủ sở hữu đơn hàng không
  if (order.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/orders"
              className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách đơn hàng
            </Link>

            <Link
              href="/"
              className="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-2">Thông tin đơn hàng</h1>
          <p className="text-gray-700 mt-2">
            Mã đơn hàng:{' '}
            <strong className="font-mono">{order.id}</strong>
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Trạng thái đơn hàng</h2>
              <p className="text-2xl font-bold text-blue-600">
                {getStatusName(order.status)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Ngày đặt hàng</p>
              <p className="text-gray-900 font-medium">
                {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Ordered Products */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đã đặt</h2>

          <div className="space-y-4">
            {order.items.map((item) => {
              const thumbnailUrl = item.book.thumbnail?.url || '/placeholder-book.svg'
              const authorName = item.book.author?.name || 'Không rõ tác giả'
              const itemTotal = item.price * item.quantity

              return (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  <Link
                    href={`/books/${item.book.id}`}
                    className="w-24 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                  >
                    <BookImage
                      src={thumbnailUrl}
                      alt={item.book.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/books/${item.book.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition">
                        {item.book.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-gray-600 mb-2">{authorName}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                      <p className="text-lg font-bold text-blue-600">{formatPrice(itemTotal)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shipping + Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin giao hàng</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Người nhận:</strong> {order.shippingName}</p>
              <p><strong>Điện thoại:</strong> {order.shippingPhone}</p>
              <p><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
              {order.shippingNote && (
                <p><strong>Ghi chú:</strong> {order.shippingNote}</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin thanh toán</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Phương thức:</strong>{' '}
                {getPaymentMethodName(order.paymentMethod)}
              </p>

              {order.paymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="font-medium text-yellow-800 mb-1">Thông tin chuyển khoản:</p>
                  <p className="text-yellow-700">Số tài khoản: <strong>1234567890</strong></p>
                  <p className="text-yellow-700">Chủ tài khoản: <strong>STOREBOOK</strong></p>
                  <p className="text-yellow-700">Ngân hàng: <strong>Vietcombank</strong></p>
                  <p className="text-yellow-700">Nội dung: <strong>ĐH {order.id}</strong></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính:</span>
              <span>{formatPrice(order.total)}</span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển:</span>
              <span className="text-green-600">Miễn phí</span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md"
          >
            Tiếp tục mua sắm
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  )
}

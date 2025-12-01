'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookImage from '@/components/BookImage'

interface OrderItem {
  id: string
  quantity: number
  price: number
  book: {
    id: string
    title: string
    thumbnail: {
      id: string
      url: string
      path: string
    } | null
  }
}

interface Order {
  id: string
  total: number
  status: string
  paymentMethod: string | null
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  createdAt: string
  items: OrderItem[]
  totalItems?: number
  previewItems?: OrderItem[]
}

interface OrdersData {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusName(status: string) {
  const statusMap: Record<string, { name: string; color: string }> = {
    PENDING: { name: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
    CONFIRMED: { name: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    PROCESSING: { name: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-800' },
    SHIPPED: { name: 'Đã giao hàng', color: 'bg-purple-100 text-purple-800' },
    DELIVERED: { name: 'Đã nhận hàng', color: 'bg-green-100 text-green-800' },
    CANCELLED: { name: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  }
  return statusMap[status] || { name: status, color: 'bg-gray-100 text-gray-800' }
}

function getPaymentMethodName(method: string | null) {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Chuyển khoản'
    case 'COD':
      return 'Thanh toán khi nhận hàng'
    default:
      return 'Chưa chọn'
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', currentPage.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrdersData(data)
      } else if (response.status === 401) {
        router.push('/login?redirect=/orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // ⭐ LOADING PAGE WITH GRADIENT
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // ⭐ EMPTY PAGE WITH GRADIENT
  // ============================================
  if (!ordersData || ordersData.orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← Về trang chủ
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          </div>

          {/* Status Filter */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Tất cả
              </button>

              {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
                const statusInfo = getStatusName(status)
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? statusInfo.color + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusInfo.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tiếp tục mua sắm
            </Link>
          </div>

        </div>
      </div>
    )
  }

  // ============================================
  // ⭐ MAIN PAGE WITH GRADIENT
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Về trang chủ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-gray-700 mt-2">
            Tổng cộng {ordersData.pagination.total} đơn hàng
          </p>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>

            <button
              onClick={() => {
                setStatusFilter('')
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                !statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Tất cả
            </button>

            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => {
              const statusInfo = getStatusName(status)
              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? statusInfo.color + ' ring-2 ring-offset-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusInfo.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {ordersData.orders.map((order) => {
            const statusInfo = getStatusName(order.status)
            const previewItems = order.previewItems || order.items
            const totalItems = order.totalItems || order.items.length
            const hasMoreItems = totalItems > previewItems.length

            return (
              <div key={order.id} className="bg-white rounded-xl shadow hover:shadow-md transition">
                <div className="p-6">

                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Đơn hàng #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.name}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Thanh toán: {getPaymentMethodName(order.paymentMethod)}
                      </p>
                    </div>

                    <p className="text-2xl font-bold text-blue-600">{formatPrice(order.total)}</p>
                  </div>

                  {/* Product Preview */}
                  <div className="mb-4">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {previewItems.map((item) => {
                        const url = item.book.thumbnail?.url || '/placeholder-book.svg'
                        return (
                          <Link
                            key={item.id}
                            href={`/books/${item.book.id}`}
                            className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-gray-100"
                          >
                            <BookImage src={url} alt={item.book.title} className="w-full h-full object-cover" />
                          </Link>
                        )
                      })}

                      {hasMoreItems && (
                        <div className="w-16 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{totalItems - previewItems.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      {totalItems} sản phẩm
                    </p>
                  </div>

                  {/* Shipping */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Người nhận:</strong> {order.shippingName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Địa chỉ:</strong> {order.shippingAddress}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">

                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700">
                          ⏳ Đang chờ xác nhận
                        </span>
                      )}
                      {order.status === 'SHIPPED' && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-700">
                          📦 Đang giao hàng
                        </span>
                      )}
                      {order.status === 'DELIVERED' && (
                        <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">
                          ✓ Đã nhận hàng
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5
                          c4.478 0 8.268 2.943 9.542 7
                          -1.274 4.057-5.064 7-9.542 7
                          -4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Xem thông tin
                    </Link>

                  </div>

                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {ordersData.pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>

            <span className="px-4 py-2 text-gray-700">
              Trang {currentPage} / {ordersData.pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(ordersData.pagination.totalPages, p + 1))}
              disabled={currentPage === ordersData.pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

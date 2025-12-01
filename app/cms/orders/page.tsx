'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  shippingNote: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
  items: OrderItem[]
  totalItems?: number
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
      return 'COD'
    default:
      return 'Chưa chọn'
  }
}

export default function CMSOrdersPage() {
  const router = useRouter()
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [minTotal, setMinTotal] = useState<string>('')  
  const [maxTotal, setMaxTotal] = useState<string>('')  
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
  fetchOrders()
}, [statusFilter, currentPage])

// Khi xóa hết nội dung ô tìm kiếm → load lại toàn bộ đơn hàng
useEffect(() => {
  if (searchQuery.trim() === '') {
    setCurrentPage(1)
    fetchOrders()
  }
}, [searchQuery])


  const fetchOrders = async (overrideSearch?: string) => {
  try {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    if (statusFilter) {
      params.append('status', statusFilter)
    }

    // Nếu overrideSearch tồn tại → dùng nó thay vì searchQuery state
    if (overrideSearch !== undefined) {
      params.append('search', overrideSearch)
    } else if (searchQuery) {
      params.append('search', searchQuery)
    }

    params.append('page', currentPage.toString())
    params.append('limit', '20')

    const response = await fetch(`/api/cms/orders?${params.toString()}`)
    if (response.ok) {
      const data = await response.json()
      setOrdersData(data)
    } else if (response.status === 401) {
      router.push('/login')
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    setLoading(false)
  }
}

  const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  setCurrentPage(1)
  fetchOrders() // Chỉ fetch khi người dùng nhấn nút
}


  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId)
      const response = await fetch(`/api/cms/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh orders list
        await fetchOrders()
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Không thể kết nối đến server. Vui lòng thử lại.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Đơn hàng</h1>
        <p className="text-gray-600 mt-2">
          Tổng cộng {ordersData?.pagination.total || 0} đơn hàng
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">

        {/* SEARCH TEXT */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã đơn, tên khách, email, SĐT..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm 
                      focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </form>

        {/* TIÊU ĐỀ */}
        <div className="text-gray-700 font-medium mb-2">Lọc theo tổng tiền</div>

        {/* 3 CỘT: TỪ - ĐẾN - TÌM KIẾM */}
        <form
          onSubmit={(e) => {
            e.preventDefault()

            let query = ''

            if (minTotal && maxTotal) {
              query = `${minTotal}-${maxTotal}`
            } else if (minTotal && !maxTotal) {
              query = `>=${minTotal}`
            } else if (!minTotal && maxTotal) {
              query = `<=${maxTotal}`
            }

            setSearchQuery(query)      // cập nhật UI
            setCurrentPage(1)
            fetchOrders(query)         // gọi API NGAY LẬP TỨC — không chờ state
          }}
          className="grid grid-cols-3 gap-4 mb-5"
        >

          <input
            type="number"
            min={0}
            value={minTotal}
            onChange={(e) => setMinTotal(e.target.value)}
            placeholder="Từ..."
            className="px-4 py-3 border border-gray-300 rounded-xl 
                      focus:ring-2 focus:ring-green-500 focus:outline-none"
          />

          <input
            type="number"
            min={0}
            value={maxTotal}
            onChange={(e) => setMaxTotal(e.target.value)}
            placeholder="Đến..."
            className="px-4 py-3 border border-gray-300 rounded-xl 
                      focus:ring-2 focus:ring-green-500 focus:outline-none"
          />

          <button
            type="submit"
            className="px-4 py-3 bg-blue-600 text-white rounded-xl 
                      hover:bg-blue-700 transition-colors font-medium w-full"
          >
            Tìm kiếm
          </button>
        </form>

        {/* PRESET FILTER BUTTONS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: '< 100k', value: '<100000' },
            { label: '100k - 300k', value: '100000-300000' },
            { label: '300k - 1 triệu', value: '300000-1000000' },
            { label: '> 1 triệu', value: '>1000000' },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                setSearchQuery(preset.value)     // để hiển thị trên ô search
                setCurrentPage(1)
                fetchOrders(preset.value)        // gọi API ngay lập tức
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm 
                        hover:bg-gray-200 transition shadow-sm border border-gray-200"
            >
              {preset.label}
            </button>

          ))}
        </div>

        {/* STATUS FILTER */}
        <div className="text-gray-700 font-medium mb-2">Lọc theo trạng thái</div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setStatusFilter('')
              setCurrentPage(1)
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              !statusFilter
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  statusFilter === status
                    ? statusInfo.color + ' shadow ring-2 ring-offset-2 ring-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {statusInfo.name}
              </button>
            )
          })}
        </div>

      </div>

      {/* Orders Table */}
      {!ordersData || ordersData.orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersData.orders.map((order) => {
                  const statusInfo = getStatusName(order.status)
                  const previewItems = order.items.slice(0, 3)
                  const hasMoreItems = (order.totalItems || order.items.length) > 3

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{order.shippingName}</div>
                          <div className="text-gray-500">{order.user.email}</div>
                          <div className="text-xs text-gray-400">{order.shippingPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {previewItems.map((item) => {
                            const thumbnailUrl = item.book.thumbnail?.url || '/placeholder-book.svg'
                            return (
                              <div key={item.id} className="w-10 h-14 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <BookImage
                                  src={thumbnailUrl}
                                  alt={item.book.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )
                          })}
                          {hasMoreItems && (
                            <div className="w-10 h-14 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                +{(order.totalItems || order.items.length) - 3}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(order.totalItems || order.items.length)} sản phẩm
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">
                          {formatPrice(order.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingOrderId === order.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white ${statusInfo.color} ${
                                updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                              }`}
                              style={{
                                minWidth: '140px',
                              }}
                            >
                              <option value="PENDING">Chờ xác nhận</option>
                              <option value="CONFIRMED">Đã xác nhận</option>
                              <option value="PROCESSING">Đang xử lý</option>
                              <option value="SHIPPED">Đã giao hàng</option>
                              <option value="DELIVERED">Đã nhận hàng</option>
                              <option value="CANCELLED">Đã hủy</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                              <svg className="h-4 w-4 fill-current text-gray-700" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                          {updatingOrderId === order.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodName(order.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersData.pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Hiển thị {(currentPage - 1) * ordersData.pagination.limit + 1} -{' '}
                {Math.min(currentPage * ordersData.pagination.limit, ordersData.pagination.total)} trong tổng số{' '}
                {ordersData.pagination.total} đơn hàng
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Trang {currentPage} / {ordersData.pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(ordersData.pagination.totalPages, p + 1))}
                  disabled={currentPage === ordersData.pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


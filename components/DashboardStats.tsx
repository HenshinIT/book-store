'use client'

import { useState, useEffect } from 'react'

interface DashboardData {
  overview: {
    totalBooks: number
    totalUsers: number
    totalOrders: number
    outOfStockBooks: number
  }
  revenue: {
    total: number
    today: number
    week: number
    month: number
    year: number
  }
  orders: {
    today: number
    week: number
    month: number
    byStatus: {
      pending: number
      confirmed: number
      delivered: number
      cancelled: number
    }
  }
  topBooks: Array<{
    bookId: string
    title: string
    price: number
    thumbnail: string | null
    totalSold: number
    orderCount: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    orderCount: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    orderCount: number
  }>
  categoryStats: Array<{
    categoryId: string | null
    categoryName: string
    bookCount: number
  }>
}

export default function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'day' | 'month'>('day')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Không thể tải thống kê')
      }
      const stats = await response.json()
      setData(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const revenueData = timeRange === 'day' ? data.revenueByDay : data.revenueByMonth
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Thống kê doanh thu */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Doanh thu tổng
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {formatCurrency(data.revenue.total)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Hôm nay
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {formatCurrency(data.revenue.today)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                7 ngày qua
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-600">
                {formatCurrency(data.revenue.week)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Tháng này
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-purple-600">
                {formatCurrency(data.revenue.month)}
              </dd>
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Năm này
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-indigo-600">
                {formatCurrency(data.revenue.year)}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Thống kê đơn hàng */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Đơn hàng theo thời gian
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Hôm nay</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(data.orders.today)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">7 ngày qua</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(data.orders.week)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tháng này</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(data.orders.month)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Đơn hàng theo trạng thái
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Chờ xác nhận</span>
                <span className="text-lg font-semibold text-yellow-600">
                  {formatNumber(data.orders.byStatus.pending)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đã xác nhận</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatNumber(data.orders.byStatus.confirmed)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đã giao</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatNumber(data.orders.byStatus.delivered)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Đã hủy</span>
                <span className="text-lg font-semibold text-red-600">
                  {formatNumber(data.orders.byStatus.cancelled)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Biểu đồ doanh thu
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                7 ngày
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                12 tháng
              </button>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full">
              {/* Chart container */}
              <div className="relative w-full" style={{ height: '280px', paddingBottom: '40px' }}>
                <div className="absolute inset-0 flex items-end justify-between gap-1 px-2 pb-10">
                  {revenueData.map((item, index) => {
                    const heightPercent = maxRevenue > 0 
                      ? Math.max((item.revenue / maxRevenue) * 100, 3) 
                      : 3
                    const label =
                      timeRange === 'day'
                        ? new Date(item.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })
                        : new Date(item.month + '-01').toLocaleDateString('vi-VN', {
                            month: 'short',
                            year: 'numeric',
                          })
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center group relative"
                        style={{ height: '100%' }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 pointer-events-none">
                          <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                          <div className="text-gray-300 text-xs">
                            {item.orderCount} đơn hàng
                          </div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                        
                        {/* Bar container */}
                        <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t hover:from-blue-600 hover:to-blue-700 transition-all cursor-pointer shadow-sm hover:shadow-md relative group/bar"
                            style={{ 
                              height: `${heightPercent}%`,
                              minHeight: '8px'
                            }}
                            title={`${label}: ${formatCurrency(item.revenue)}`}
                          >
                            {heightPercent > 15 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-[10px] font-semibold px-1">
                                  {formatCurrency(item.revenue).replace('₫', '').replace(/\s/g, '')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Labels row */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 px-2">
                  {revenueData.map((item, index) => {
                    const label =
                      timeRange === 'day'
                        ? new Date(item.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })
                        : new Date(item.month + '-01').toLocaleDateString('vi-VN', {
                            month: 'short',
                            year: 'numeric',
                          })
                    return (
                      <div
                        key={index}
                        className="flex-1 text-xs text-gray-600 text-center"
                      >
                        <div className="truncate" title={label}>
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top sách bán chạy */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top 10 sách bán chạy
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sách
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã bán
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số đơn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topBooks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-center text-sm text-gray-500"
                    >
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topBooks.map((book, index) => (
                    <tr key={book.bookId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {book.thumbnail && (
                            <img
                              src={book.thumbnail}
                              alt={book.title}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {book.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(book.totalSold)} cuốn
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(book.orderCount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(book.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thống kê theo danh mục */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thống kê theo danh mục
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categoryStats.map((stat) => (
              <div
                key={stat.categoryId || 'null'}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="text-sm font-medium text-gray-900">
                  {stat.categoryName}
                </div>
                <div className="mt-1 text-2xl font-semibold text-gray-700">
                  {formatNumber(stat.bookCount)} sách
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


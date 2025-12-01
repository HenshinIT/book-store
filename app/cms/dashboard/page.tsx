import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/DashboardStats'

export default async function CMSDashboard() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Lấy thống kê cơ bản từ server (để hiển thị ngay, không cần chờ API)
  const basicStats = await Promise.all([
    prisma.book.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: { deletedAt: null },
    }),
    prisma.order.count({
      where: { deletedAt: null },
    }),
    prisma.book.count({
      where: { status: 'OUT_OF_STOCK', deletedAt: null },
    }),
  ])

  const [totalBooks, totalUsers, totalOrders, outOfStockBooks] = basicStats

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Tổng quan hệ thống quản lý sách</p>
      </div>

      {/* Thống kê cơ bản */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-blue-500"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số sách
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalBooks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-green-500"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng người dùng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-yellow-500"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng đơn hàng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalOrders}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-md bg-red-500"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sách hết hàng
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {outOfStockBooks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component thống kê chi tiết (client-side) */}
      <DashboardStats />
    </div>
  )
}

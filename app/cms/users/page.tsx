import { prisma } from '@/lib/prisma'
import UsersList from '@/components/UsersList'
import { getCurrentUser } from '@/lib/session'
import { canManageUsers } from '@/lib/permissions'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user || !canManageUsers(user.role as any)) {
    redirect('/unauthorized')
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
        <p className="mt-2 text-gray-600">Danh sách tất cả người dùng trong hệ thống</p>
      </div>

      <UsersList 
        users={users} 
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    </div>
  )
}


import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { canAccessCMS } from '@/lib/permissions'
import CMSSidebar from '@/components/CMSSidebar'

export const dynamic = 'force-dynamic'

export default async function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    console.log('CMS Layout: No user found, redirecting to login')
    redirect('/login')
  }

  // Log đặc biệt cho ADMIN
  if (user.role === 'ADMIN') {
    console.log('🔐 CMS Layout - ADMIN user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    })
  }

  if (!canAccessCMS(user.role as any)) {
    console.log('CMS Layout: Access denied for role:', user.role)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bạn chưa có quyền truy cập CMS
          </h1>
          <p className="text-gray-600 mb-4">
            Tài khoản của bạn có vai trò <strong>{user.role}</strong>. 
            Bạn cần có quyền STAFF trở lên để truy cập CMS.
          </p>
          <p className="text-sm text-gray-500">
            Vui lòng liên hệ quản trị viên để được cấp quyền.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <CMSSidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}


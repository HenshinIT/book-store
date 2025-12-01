'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { clearAuthStorage } from '@/lib/auth-client'

interface CMSNavbarProps {
  user: {
    id: string
    email: string
    name?: string | null
    role: UserRole
  }
}

export default function CMSNavbar({ user }: CMSNavbarProps) {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      // Clear localStorage
      clearAuthStorage()
      
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear storage and redirect even if API fails
      clearAuthStorage()
      router.push('/login')
    }
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/cms" className="text-xl font-bold text-gray-900">
                Quản lý Sách
              </Link>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/cms/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/cms/books"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Quản lý Sách
              </Link>
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <Link
                  href="/cms/users"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Quản lý Người dùng
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user.name || user.email}</span>
              <span className="ml-2 text-gray-500">({user.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}


'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clearAuthStorage } from '@/lib/auth-client'

interface UserMenuProps {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

    // Role: ADMIN, MANAGER, STAFF → vào CMS
  // Role: CUSTOMER → vào dashboard thường
  const isCMSUser = ['ADMIN', 'MANAGER', 'STAFF'].includes(user.role)

  const dashboardLink = isCMSUser ? '/cms/dashboard' : '/dashboard'
  const dashboardText = isCMSUser ? 'CMS Dashboard' : 'Dashboard'


  const handleLogout = async () => {
    try {
      // Clear localStorage
      clearAuthStorage()
      
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Close menu and redirect
      setIsOpen(false)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear storage and redirect even if API fails
      clearAuthStorage()
      setIsOpen(false)
      router.push('/login')
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-gray-700 font-medium hidden md:block">
          {user.name || user.email}
        </span>
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
          {/* Chỉ hiện Dashboard khi user thuộc ADMIN / MANAGER / STAFF */}
          {isCMSUser && (
            <Link
              href={dashboardLink}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {dashboardText}
            </Link>
          )}
          {
            <>
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đơn hàng của tôi
              </Link>
              <Link
                href="/addresses"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Địa chỉ giao hàng
              </Link>
            </>
          }
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}


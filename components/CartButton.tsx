'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartButton() {
  const router = useRouter()
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCartCount()
    // Refresh cart count when route changes
    const interval = setInterval(fetchCartCount, 3000) // Refresh every 3 seconds
    // Listen to storage events for cross-tab updates
    const handleStorageChange = () => {
      fetchCartCount()
    }
    window.addEventListener('storage', handleStorageChange)
    // Listen to custom cart update events
    window.addEventListener('cartUpdated', fetchCartCount)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', fetchCartCount)
    }
  }, [])

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setItemCount(data.itemCount || 0)
      } else if (response.status === 401) {
        // Not logged in - set count to 0
        setItemCount(0)
      }
    } catch (error) {
      // User not logged in or error - set to 0
      setItemCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // If user clicks cart, check if logged in
    // The cart page will handle redirect to login if needed
  }

  return (
    <Link
      href="/cart"
      onClick={handleClick}
      className="relative inline-flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
      title="Giỏ hàng"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {!loading && itemCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
      {loading && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full transform translate-x-1/2 -translate-y-1/2 animate-pulse" />
      )}
    </Link>
  )
}

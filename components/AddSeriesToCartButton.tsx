'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AddSeriesToCartButtonProps {
  seriesId: string
  disabled?: boolean
  className?: string
  showInfo?: boolean
}

interface SeriesInfo {
  name: string
  books: Array<{ id: string; title: string; price: number; stock: number }>
  totalPrice: number
  discountedPrice: number
  discount: number
}

export default function AddSeriesToCartButton({
  seriesId,
  disabled = false,
  className = '',
  showInfo = false,
}: AddSeriesToCartButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (showInfo) {
      fetchSeriesInfo()
    }
  }, [seriesId, showInfo])

  const fetchSeriesInfo = async () => {
    try {
      const response = await fetch(`/api/public/book-series/${seriesId}`)
      if (response.ok) {
        const data = await response.json()
        setSeriesInfo({
          name: data.name,
          books: data.books.map((book: any) => ({
            id: book.id,
            title: book.title,
            price: book.price,
            stock: book.stock,
          })),
          totalPrice: data.totalPrice,
          discountedPrice: data.discountedPrice,
          discount: data.discount,
        })
      }
    } catch (error) {
      console.error('Error fetching series info:', error)
    }
  }

  const handleAddSeriesToCart = async () => {
    if (disabled || loading) return

    setLoading(true)
    setSuccess(false)

    try {
      // Lấy thông tin bộ sách
      const seriesResponse = await fetch(`/api/public/book-series/${seriesId}`)
      if (!seriesResponse.ok) {
        throw new Error('Không tìm thấy bộ sách')
      }

      const seriesData = await seriesResponse.json()
      const books = seriesData.books || []

      if (books.length === 0) {
        alert('Bộ sách này chưa có sách nào')
        return
      }

      // Kiểm tra stock cho tất cả sách trong bộ
      for (const book of books) {
        if (book.stock < 1) {
          alert(`Sách "${book.title}" đã hết hàng`)
          setLoading(false)
          return
        }
      }

      // Thêm tất cả sách trong bộ vào giỏ hàng
      let allSuccess = true
      for (const book of books) {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, quantity: 1 }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error(`Error adding ${book.title}:`, error)
          allSuccess = false
        }
      }

      if (allSuccess) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/cart')
          router.refresh()
        }, 1000)
      } else {
        alert('Có một số sách không thể thêm vào giỏ hàng. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error adding series to cart:', error)
      alert('Có lỗi xảy ra khi thêm bộ sách vào giỏ hàng')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="w-full">
      {showInfo && seriesInfo && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{seriesInfo.name}</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {showDetails ? 'Ẩn' : 'Chi tiết'}
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {seriesInfo.books.length} cuốn sách
            </span>
            <div className="text-right">
              <div className="text-gray-500 line-through text-xs">
                {formatPrice(seriesInfo.totalPrice)}
              </div>
              <div className="text-green-600 font-bold">
                {formatPrice(seriesInfo.discountedPrice)}
              </div>
              <div className="text-green-600 text-xs">
                Tiết kiệm: {formatPrice(seriesInfo.discount)}
              </div>
            </div>
          </div>
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                Danh sách sách trong bộ:
              </p>
              <ul className="space-y-1">
                {seriesInfo.books.map((book, index) => (
                  <li key={book.id} className="text-xs text-gray-600 flex items-center justify-between">
                    <span>
                      Tập {index + 1}: {book.title}
                    </span>
                    <span className="text-gray-500">
                      {formatPrice(book.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <button
        onClick={handleAddSeriesToCart}
        disabled={disabled || loading}
        className={`${className} w-full ${
          disabled || loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-green-700'
        } ${
          success
            ? 'bg-green-600'
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        } text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Đang thêm...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Đã thêm vào giỏ hàng!
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Mua cả bộ (Giảm 10%)
          </span>
        )}
      </button>
    </div>
  )
}


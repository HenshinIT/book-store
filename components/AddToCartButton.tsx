'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AddToCartButtonProps {
  bookId: string
  stock: number
  disabled?: boolean
  className?: string
}

export default function AddToCartButton({
  bookId,
  stock,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1)
    } else if (newQuantity > stock) {
      setQuantity(stock) // giới hạn số lượng lớn nhất = tồn kho stock
    } else {
      setQuantity(newQuantity)
    }
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1) //giảm số lượng 0 thể < 1 
    }
  }

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1) //tăng số lượng 0 được > stock
    }
  }

  const handleAddToCart = async () => {
    if (disabled || stock === 0 || loading || quantity < 1 || quantity > stock) return

    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, quantity }),
      })

      // Kiểm tra content-type trước khi parse JSON
      const contentType = response.headers.get('content-type')
      let data: any = {}
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError)
          const text = await response.text()
          console.error('Response text:', text)
          throw new Error('Invalid JSON response from server')
        }
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        data = { error: text || 'Unknown error occurred' }
      }

      if (response.ok) {
        setSuccess(true)
        // Chờ 300ms để UX mượt hơn rồi chuyển sang trang giỏ hàng
        setTimeout(() => {
          router.push('/cart')  //TỰ ĐỘNG ĐI ĐẾN /cart
        }, 300)

        router.refresh()
        window.dispatchEvent(new Event('cartUpdated'))
        return
      }
      else {
        console.error('Add to cart error:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          error: data,
        })
        
        if (response.status === 401) {
          const errorMsg = data.error || 'Vui lòng đăng nhập để thêm vào giỏ hàng'
          alert(errorMsg)
          router.push(`/login?redirect=/books/${bookId}`)
        } else if (response.status === 404) {
          alert(data.error || 'Không tìm thấy sách. Vui lòng thử lại sau.')
        } else if (response.status === 400) {
          alert(data.error || 'Số lượng không hợp lệ')
        } else {
          alert(data.error || `Có lỗi xảy ra khi thêm vào giỏ hàng (${response.status}). Vui lòng thử lại.`)
        }
      }
    } catch (error) {
      console.error('Add to cart network error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      alert('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (stock === 0 || disabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center border border-gray-300 rounded-lg p-2">
          <span className="text-gray-500 font-medium">Số lượng:</span>
          <span className="ml-2 text-gray-400">0</span>
        </div>
        <button
          disabled
          className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors bg-gray-300 text-gray-500 cursor-not-allowed ${className}`}
        >
          Hết hàng
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Số lượng:
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || loading}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
            aria-label="Giảm số lượng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>
          <input
            type="number"
            min="1"
            max={stock}
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1
              handleQuantityChange(value)
            }}
            disabled={loading}
            className="w-20 px-4 py-2 text-center border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            aria-label="Số lượng"
          />
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= stock || loading}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
            aria-label="Tăng số lượng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
        <span className="text-sm text-gray-500">
          (Còn {stock} cuốn)
        </span>
      </div>

      {/* Add to Cart Button */}
      {success ? (
        <button
          disabled
          className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors bg-green-600 text-white ${className}`}
        >
          ✓ Đã thêm {quantity} {quantity === 1 ? 'sản phẩm' : 'sản phẩm'} vào giỏ hàng
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={loading || quantity < 1 || quantity > stock}
          className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
            loading || quantity < 1 || quantity > stock
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white ${className}`}
        >
          {loading ? 'Đang thêm...' : `Thêm ${quantity} ${quantity === 1 ? 'sản phẩm' : 'sản phẩm'} vào giỏ hàng`}
        </button>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BookImage from '@/components/BookImage'

interface CartItem {
  id: string
  quantity: number
  book: {
    id: string
    title: string
    price: number
    stock: number
    thumbnail: {
      id: string
      url: string
      path: string
    } | null
    author: {
      id: string
      name: string
    } | null
  }
}

interface CartData {
  cart: {
    id: string
    items: CartItem[]
  }
  total: number
  itemCount: number
  seriesDiscount?: number
  appliedSeries?: string[]
}

interface Address {
  id: string
  name: string
  phone: string
  address: string
  note: string | null
  isDefault: boolean
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

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
  createdAt: string
  items: OrderItem[]
  totalItems?: number
  previewItems?: OrderItem[]
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
      return 'Thanh toán khi nhận hàng'
    default:
      return 'Chưa chọn'
  }
}

export default function CartPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart')
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    isDefault: false,
  })
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCart()
    fetchAddresses()
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
        const defaultAddress = data.find((addr: Address) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
      } else if (response.status === 401) {
        router.push('/login?redirect=/cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await fetch('/api/orders?page=1&limit=10')
      if (response.ok) {
        const data = await response.json()
        setOrdersData(data)
      } else if (response.status === 401) {
        router.push('/login?redirect=/cart')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId)
      return
    }

    setUpdating(itemId)
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        await fetchCart()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi cập nhật')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCart()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa')
    } finally {
      setUpdating(null)
    }
  }

  const clearCart = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCart()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa giỏ hàng')
    }
  }

  const validateAddressForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!addressForm.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên người nhận'
    }
    
    if (!addressForm.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(addressForm.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)'
    }
    
    if (!addressForm.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ'
    }
    
    setAddressErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddAddress = async () => {
    if (!validateAddressForm()) return

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addressForm,
          note: addressForm.note || null,
        }),
      })

      if (response.ok) {
        const newAddress = await response.json()
        await fetchAddresses()
        setSelectedAddressId(newAddress.id)
        setShowAddressForm(false)
        setAddressForm({
          name: '',
          phone: '',
          address: '',
          note: '',
          isDefault: false,
        })
        setAddressErrors({})
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error adding address:', error)
      alert('Có lỗi xảy ra khi thêm địa chỉ')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return
    }

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAddresses()
        if (selectedAddressId === id) {
          setSelectedAddressId(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Có lỗi xảy ra khi xóa địa chỉ')
    }
  }

  const handleCheckout = () => {
    if (selectedAddressId) {
      localStorage.setItem('selectedAddressId', selectedAddressId)
      router.push('/checkout')
    } else {
      alert('Vui lòng chọn địa chỉ giao hàng trước khi thanh toán')
    }
  }

  // ⭐⭐⭐ LOADING STATE — Gradient Pastel ⭐⭐⭐
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  // ⭐⭐⭐ EMPTY CART — Gradient Pastel ⭐⭐⭐
  // Chỉ hiển thị empty cart khi đang ở tab cart và giỏ hàng trống
  if (activeTab === 'cart' && (!cart || cart.cart.items.length === 0) && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng & Đơn hàng</h1>
            
            {/* Tabs */}
            <div className="mt-4 flex gap-2 border-b border-gray-300">
              <button
                onClick={() => setActiveTab('cart')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'cart'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Giỏ hàng
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab !== 'cart'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đơn hàng đã đặt
              </button>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto text-center bg-white rounded-lg shadow p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng</h2>
          <p className="text-gray-600 mb-8">Giỏ hàng của bạn đang trống</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Tiếp tục mua sắm
          </Link>
          </div>
        </div>
      </div>
    )
  }

  // ⭐⭐⭐ MAIN CART PAGE — Gradient Pastel ⭐⭐⭐
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng & Đơn hàng</h1>
          
          {/* Tabs */}
          <div className="mt-4 flex gap-2 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'cart'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Giỏ hàng {cart && cart.itemCount > 0 && `(${cart.itemCount})`}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đơn hàng đã đặt
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
              </div>
            ) : !ordersData || ordersData.orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 mb-4">Bạn chưa có đơn hàng nào</p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersData.orders.map((order) => {
                  const statusInfo = getStatusName(order.status)
                  const previewItems = order.previewItems || order.items
                  const totalItems = order.totalItems || order.items.length
                  const hasMoreItems = totalItems > previewItems.length

                  return (
                    <div key={order.id} className="bg-white rounded-xl shadow hover:shadow-md transition">
                      <div className="p-6">
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-4 pb-4 border-b">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Đơn hàng #{order.id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Ngày đặt: {formatDate(order.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Thanh toán: {getPaymentMethodName(order.paymentMethod)}
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{formatPrice(order.total)}</p>
                        </div>

                        {/* Product Preview */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-3">
                            {previewItems.map((item) => {
                              const url = item.book.thumbnail?.url || '/placeholder-book.svg'
                              return (
                                <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                  <div className="w-12 h-16 rounded overflow-hidden bg-gray-100">
                                    <BookImage
                                      src={url}
                                      alt={item.book.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {item.book.title}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      SL: {item.quantity} × {formatPrice(item.price)}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                            {hasMoreItems && (
                              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2 px-4">
                                <p className="text-sm text-gray-600">
                                  +{totalItems - previewItems.length} sản phẩm khác
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          <Link
                            href={`/orders/${order.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && cart && cart.cart.items.length > 0 && (
          <>
            <p className="text-gray-600 mb-4">
              {cart.itemCount} {cart.itemCount === 1 ? 'sản phẩm' : 'sản phẩm'}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column – Cart Items */}
              <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sản phẩm trong giỏ hàng
                </h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Xóa tất cả
                </button>
              </div>

              <div className="space-y-4">
                {cart.cart.items.map((item) => {
                  const thumbnailUrl = item.book.thumbnail?.url || '/placeholder-book.svg'
                  const authorName = item.book.author?.name || 'Không rõ tác giả'
                  const itemTotal = item.book.price * item.quantity

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <Link
                        href={`/books/${item.book.id}`}
                        className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <BookImage
                          src={thumbnailUrl}
                          alt={item.book.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/books/${item.book.id}`} className="block">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                            {item.book.title}
                          </h3>
                        </Link>

                        <p className="text-sm text-gray-600 mb-2">{authorName}</p>
                        <p className="text-lg font-bold text-blue-600 mb-4">
                          {formatPrice(item.book.price)}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id || item.quantity <= 1}
                              className="px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 min-w-[60px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id || item.quantity >= item.book.stock}
                              className="px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                            className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                          >
                            Xóa
                          </button>

                          <div className="ml-auto text-right">
                            <p className="text-sm text-gray-500">Thành tiền</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(itemTotal)}
                            </p>
                          </div>
                        </div>

                        {item.quantity > item.book.stock && (
                          <p className="text-sm text-red-600 mt-2">
                            ⚠️ Số lượng vượt quá tồn kho (Còn {item.book.stock} cuốn)
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column – Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Địa chỉ giao hàng
                </h2>
                <Link
                  href="/addresses"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Quản lý →
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">Chưa có địa chỉ</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === address.id}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="mt-0.5"
                              />
                              <span className="font-medium text-gray-900 text-sm">
                                {address.name}
                              </span>
                              {address.isDefault && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 ml-5">📞 {address.phone}</p>
                            <p className="text-xs text-gray-700 ml-5 line-clamp-2">
                              📍 {address.address}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteAddress(address.id)
                            }}
                            className="text-red-600 hover:text-red-700 text-xs px-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
              )}

              {/* Address Modal */}
              {showAddressForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Thêm địa chỉ mới
                        </h3>
                        <button
                          onClick={() => {
                            setShowAddressForm(false)
                            setAddressForm({
                              name: '',
                              phone: '',
                              address: '',
                              note: '',
                              isDefault: false,
                            })
                            setAddressErrors({})
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleAddAddress()
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên người nhận <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={addressForm.name}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, name: e.target.value })
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${
                              addressErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tên người nhận"
                          />
                          {addressErrors.name && (
                            <p className="mt-1 text-xs text-red-500">{addressErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, phone: e.target.value })
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${
                              addressErrors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập số điện thoại"
                          />
                          {addressErrors.phone && (
                            <p className="mt-1 text-xs text-red-500">{addressErrors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={addressForm.address}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, address: e.target.value })
                            }
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${
                              addressErrors.address ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập địa chỉ chi tiết"
                          />
                          {addressErrors.address && (
                            <p className="mt-1 text-xs text-red-500">{addressErrors.address}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú (tùy chọn)
                          </label>
                          <textarea
                            value={addressForm.note}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, note: e.target.value })
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            placeholder="Ghi chú cho địa chỉ này..."
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) =>
                              setAddressForm({ ...addressForm, isDefault: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                            Đặt làm địa chỉ mặc định
                          </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            Thêm địa chỉ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false)
                              setAddressForm({
                                name: '',
                                phone: '',
                                address: '',
                                note: '',
                                isDefault: false,
                              })
                              setAddressErrors({})
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                          >
                            Hủy
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SUMMARY */}
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(cart.total + (cart.seriesDiscount || 0))}</span>
                </div>
                {cart.seriesDiscount && cart.seriesDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá bộ sách (10%):</span>
                    <span className="font-semibold">-{formatPrice(cart.seriesDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{formatPrice(cart.total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!selectedAddressId && addresses.length > 0}
                className={`w-full px-6 py-3 rounded-lg font-semibold text-lg mb-4 transition-colors ${
                  !selectedAddressId && addresses.length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {!selectedAddressId && addresses.length > 0
                  ? 'Vui lòng chọn địa chỉ'
                  : 'Thanh toán'}
              </button>

              <Link
                href="/"
                className="block text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
            </div>
          </>
        )}

        {/* Empty Cart Message */}
        {activeTab === 'cart' && cart && cart.cart.items.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Giỏ hàng của bạn đang trống</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

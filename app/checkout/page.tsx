'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

type PaymentMethod = 'BANK_TRANSFER' | 'COD'

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [shippingName, setShippingName] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingNote, setShippingNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCart()
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data)

        const savedAddressId =
          typeof window !== 'undefined'
            ? localStorage.getItem('selectedAddressId')
            : null

        let addressToSelect: Address | undefined

        if (savedAddressId) {
          addressToSelect = data.find((a: Address) => a.id === savedAddressId)
          if (addressToSelect) localStorage.removeItem('selectedAddressId')
        }

        if (!addressToSelect) {
          addressToSelect = data.find((a: Address) => a.isDefault)
        }

        if (addressToSelect) {
          setSelectedAddressId(addressToSelect.id)
          setUseNewAddress(false)
          setShippingName(addressToSelect.name)
          setShippingPhone(addressToSelect.phone)
          setShippingAddress(addressToSelect.address)
          setShippingNote(addressToSelect.note || '')
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleAddressSelect = (addressId: string) => {
    const address = addresses.find((a) => a.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      setUseNewAddress(false)
      setShippingName(address.name)
      setShippingPhone(address.phone)
      setShippingAddress(address.address)
      setShippingNote(address.note || '')
      setErrors({})
    }
  }

  const handleUseNewAddress = () => {
    setUseNewAddress(true)
    setSelectedAddressId(null)
    setShippingName('')
    setShippingPhone('')
    setShippingAddress('')
    setShippingNote('')
    setErrors({})
  }

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
      } else if (response.status === 401) {
        router.push('/login?redirect=/checkout')
      } else {
        alert('Không thể tải giỏ hàng')
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Có lỗi xảy ra')
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!useNewAddress && selectedAddressId) {
    } else {
      if (!shippingName.trim()) {
        newErrors.shippingName = 'Vui lòng nhập tên người nhận'
      }
      if (!shippingPhone.trim()) {
        newErrors.shippingPhone = 'Vui lòng nhập số điện thoại'
      } else if (!/^[0-9]{10,11}$/.test(shippingPhone.replace(/\s/g, ''))) {
        newErrors.shippingPhone = 'Số điện thoại không hợp lệ'
      }
      if (!shippingAddress.trim()) {
        newErrors.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng'
      }
    }

    if (!useNewAddress && !selectedAddressId && addresses.length > 0) {
      newErrors.address = 'Vui lòng chọn địa chỉ hoặc nhập địa chỉ mới'
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !cart || submitting) return

    setSubmitting(true)

    try {
      // Đảm bảo paymentMethod được set
      if (!paymentMethod) {
        setErrors({ paymentMethod: 'Vui lòng chọn phương thức thanh toán' })
        return
      }

      // Lấy thông tin địa chỉ từ địa chỉ đã chọn nếu có
      let finalShippingName = shippingName.trim()
      let finalShippingPhone = shippingPhone.trim()
      let finalShippingAddress = shippingAddress.trim()
      let finalShippingNote = shippingNote.trim() || null

      if (!useNewAddress && selectedAddressId) {
        const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
        if (selectedAddress) {
          finalShippingName = selectedAddress.name
          finalShippingPhone = selectedAddress.phone
          finalShippingAddress = selectedAddress.address
          finalShippingNote = selectedAddress.note || null
        }
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          shippingName: finalShippingName,
          shippingPhone: finalShippingPhone,
          shippingAddress: finalShippingAddress,
          shippingNote: finalShippingNote,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Có lỗi xảy ra khi đặt hàng' }))
        alert(data.error || 'Có lỗi xảy ra khi đặt hàng')
        return
      }

      const data = await response.json()
      router.push(`/orders/${data.order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Không thể kết nối đến server. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  // ⭐⭐⭐ 1) LOADING — thêm UI gradient ⭐⭐⭐
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Đang tải...</p>
        </div>
      </div>
    )
  }

  // ⭐⭐⭐ 2) EMPTY CART — thêm UI gradient ⭐⭐⭐
  if (!cart || cart.cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thanh toán</h1>
          <p className="text-gray-600 mb-8">Giỏ hàng của bạn đang trống</p>

          <Link
            href="/cart"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    )
  }

  // ⭐⭐⭐ 3) MAIN CHECKOUT UI — thêm gradient + padding ⭐⭐⭐
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <Link href="/cart" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Quay lại giỏ hàng
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Thanh toán</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* INFORMATION BLOCK */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Thông tin giao hàng</h2>
                  {addresses.length > 0 && (
                    <Link href="/addresses" className="text-sm text-blue-600 hover:text-blue-700">
                      Quản lý địa chỉ →
                    </Link>
                  )}
                </div>

                {/* ADDRESS LIST */}
                {addresses.length > 0 && !useNewAddress && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Chọn địa chỉ đã lưu <span className="text-red-500">*</span>
                    </label>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === address.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            checked={selectedAddressId === address.id}
                            onChange={() => handleAddressSelect(address.id)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {address.name}
                              </span>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">📞 {address.phone}</p>
                            <p className="text-sm text-gray-700">📍 {address.address}</p>
                            {address.note && (
                              <p className="text-xs text-gray-500 italic mt-1">{address.note}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleUseNewAddress}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Sử dụng địa chỉ mới
                    </button>

                    {errors.address && (
                      <p className="mt-2 text-sm text-red-500">{errors.address}</p>
                    )}
                  </div>
                )}

                {/* NEW ADDRESS */}
                {(!addresses.length || useNewAddress) && (
                  <div className="mb-6">
                    {addresses.length > 0 && (
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Địa chỉ mới</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setUseNewAddress(false)
                            const defaultAddr =
                              addresses.find((a) => a.isDefault) || addresses[0]
                            if (defaultAddr) handleAddressSelect(defaultAddr.id)
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          ← Chọn địa chỉ đã lưu
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Họ tên người nhận *
                        </label>
                        <input
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.shippingName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Số điện thoại *
                        </label>
                        <input
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.shippingPhone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Địa chỉ giao hàng *
                        </label>
                        <textarea
                          rows={3}
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Ghi chú (tuỳ chọn)
                        </label>
                        <textarea
                          rows={2}
                          value={shippingNote}
                          onChange={(e) => setShippingNote(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT METHOD */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Phương thức thanh toán *
                </h2>

                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mb-3">{errors.paymentMethod}</p>
                )}

                <div className="space-y-3">
                  {/* COD */}
                  <label
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'COD'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-semibold">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-gray-600 text-sm mt-1">
                        Thanh toán bằng tiền mặt khi nhận hàng.
                      </p>
                    </div>
                  </label>

                  {/* BANK */}
                  <label
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">Chuyển khoản ngân hàng</p>
                      <p className="text-gray-600 text-sm mt-1">
                        Chuyển khoản trước khi đơn hàng được xử lý.
                      </p>

                      {paymentMethod === 'BANK_TRANSFER' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                          <p className="font-medium text-yellow-800">Thông tin chuyển khoản:</p>
                          <p className="text-yellow-800 mt-1">
                            Số tài khoản: <strong>106872082261</strong>
                          </p>
                          <p className="text-yellow-800">
                            Chủ tài khoản: <strong>NGUYEN HUYNH CUONG QUOC</strong>
                          </p>
                          <p className="text-yellow-800">
                            Ngân hàng: <strong>Vietinbank</strong>
                          </p>
                          <p className="text-yellow-800">
                            Nội dung: <strong>ĐH  +  [Mã đơn hàng]</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Đơn hàng của bạn
                </h2>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cart.cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-2 border-b">
                      <div className="w-16 h-20 rounded bg-gray-100 overflow-hidden">
                        <BookImage
                          src={item.book.thumbnail?.url || '/placeholder-book.svg'}
                          className="w-full h-full object-cover"
                          alt={item.book.title}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{item.book.title}</h3>
                        <p className="text-xs text-gray-500">{item.book.author?.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} × {formatPrice(item.book.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-3">
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
                    <span className="text-green-700">Miễn phí</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg text-gray-900">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{formatPrice(cart.total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

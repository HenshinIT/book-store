'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Address {
  id: string
  name: string
  phone: string
  address: string
  note: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    isDefault: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data)
      } else if (response.status === 401) {
        router.push('/login?redirect=/addresses')
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      note: address.note || '',
      isDefault: address.isDefault,
    })
    setShowForm(true)
    setErrors({})
  }

  const handleAddNew = () => {
    setEditingId(null)
    setFormData({
      name: '',
      phone: '',
      address: '',
      note: '',
      isDefault: false,
    })
    setShowForm(true)
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên người nhận'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses'
      const method = editingId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          note: formData.note || null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: '',
          phone: '',
          address: '',
          note: '',
          isDefault: false,
        })
        await fetchAddresses()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Có lỗi xảy ra khi lưu địa chỉ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return
    }

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAddresses()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Có lỗi xảy ra khi xóa địa chỉ')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Về trang chủ
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Địa chỉ giao hàng</h1>
            {!showForm && (
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Thêm địa chỉ mới
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên người nhận"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập số điện thoại"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập địa chỉ chi tiết"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ghi chú cho địa chỉ này..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'Cập nhật' : 'Thêm địa chỉ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      name: '',
                      phone: '',
                      address: '',
                      note: '',
                      isDefault: false,
                    })
                    setErrors({})
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ nào</p>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {address.name}
                      </h3>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">
                      📞 {address.phone}
                    </p>
                    <p className="text-gray-700 mb-2">
                      📍 {address.address}
                    </p>
                    {address.note && (
                      <p className="text-sm text-gray-500 italic">
                        Ghi chú: {address.note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(address)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


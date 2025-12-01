'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BookSeries {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  _count?: {
    books: number
  }
}

export default function BookSeriesPage() {
  const [series, setSeries] = useState<BookSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      const response = await fetch('/api/book-series')
      if (response.ok) {
        const data = await response.json()
        setSeries(data)
      }
    } catch (error) {
      console.error('Error fetching book series:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingSeries ? `/api/book-series/${editingSeries.id}` : '/api/book-series'
      const method = editingSeries ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ name: '', description: '' })
        setEditingSeries(null)
        fetchSeries()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra')
    }
  }

  const handleEdit = (seriesItem: BookSeries) => {
    setEditingSeries(seriesItem)
    setFormData({
      name: seriesItem.name,
      description: seriesItem.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ sách này?')) {
      return
    }

    try {
      const response = await fetch(`/api/book-series/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchSeries()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi xóa bộ sách')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa bộ sách')
    }
  }

  const filteredSeries = series.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Bộ Sách</h1>
          <p className="mt-2 text-gray-600">Quản lý các bộ sách trong hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditingSeries(null)
            setFormData({ name: '', description: '' })
            setShowModal(true)
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm bộ sách mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm bộ sách..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tên bộ sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Số sách
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredSeries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy bộ sách nào
                </td>
              </tr>
            ) : (
              filteredSeries.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <Link
                      href={`/cms/book-series/${item.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.description ? (
                      <span className="line-clamp-2">{item.description}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {item._count?.books || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/cms/book-series/${item.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Chi tiết
                    </Link>
                    <button
                      onClick={() => handleEdit(item)}
                      className="ml-4 text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowModal(false)}
            ></div>
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">
                {editingSeries ? 'Sửa bộ sách' : 'Thêm bộ sách mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên bộ sách *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingSeries(null)
                      setFormData({ name: '', description: '' })
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingSeries ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


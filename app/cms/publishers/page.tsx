'use client'

import { useState, useEffect } from 'react'
import type { Publisher } from '@prisma/client'

interface PublisherWithCount extends Publisher {
  _count?: { books: number }
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<PublisherWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPublisher, setEditingPublisher] = useState<PublisherWithCount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })

  useEffect(() => {
    fetchPublishers()
  }, [])

  const fetchPublishers = async () => {
    try {
      const response = await fetch('/api/publishers')
      if (response.ok) {
        const data = await response.json()
        setPublishers(data)
      }
    } catch (error) {
      console.error('Error fetching publishers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPublisher ? `/api/publishers/${editingPublisher.id}` : '/api/publishers'
      const method = editingPublisher ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ name: '', address: '', phone: '', email: '', website: '' })
        setEditingPublisher(null)
        fetchPublishers()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra')
    }
  }

  const handleEdit = (publisher: PublisherWithCount) => {
    setEditingPublisher(publisher)
    setFormData({
      name: publisher.name,
      address: publisher.address || '',
      phone: publisher.phone || '',
      email: publisher.email || '',
      website: publisher.website || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhà xuất bản này?')) {
      return
    }

    try {
      const response = await fetch(`/api/publishers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPublishers()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi xóa nhà xuất bản')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa nhà xuất bản')
    }
  }

  const filteredPublishers = publishers.filter((publisher) =>
    publisher.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Nhà Xuất Bản</h1>
          <p className="mt-2 text-gray-600">Quản lý các nhà xuất bản trong hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditingPublisher(null)
            setFormData({ name: '', address: '', phone: '', email: '', website: '' })
            setShowModal(true)
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm nhà xuất bản mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm nhà xuất bản..."
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
                Tên nhà xuất bản
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Địa chỉ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Điện thoại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
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
            {filteredPublishers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy nhà xuất bản nào
                </td>
              </tr>
            ) : (
              filteredPublishers.map((publisher) => (
                <tr key={publisher.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {publisher.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {publisher.address || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {publisher.phone || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {publisher.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {publisher._count?.books || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(publisher)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(publisher.id)}
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
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingPublisher ? 'Sửa nhà xuất bản' : 'Thêm nhà xuất bản mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên nhà xuất bản *
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
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPublisher(null)
                      setFormData({ name: '', address: '', phone: '', email: '', website: '' })
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingPublisher ? 'Cập nhật' : 'Tạo mới'}
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


'use client'

import { useState, useEffect } from 'react'
import type { Author } from '@prisma/client'
import MediaPicker from '@/components/MediaPicker'

interface AuthorWithCount extends Author {
  _count?: { books: number }
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<AuthorWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<AuthorWithCount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    imageId: '',
  })

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/authors')
      if (response.ok) {
        const data = await response.json()
        setAuthors(data)
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingAuthor ? `/api/authors/${editingAuthor.id}` : '/api/authors'
      const method = editingAuthor ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ name: '', bio: '', imageId: '' })
        setEditingAuthor(null)
        fetchAuthors()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra')
    }
  }

  const handleEdit = (author: AuthorWithCount) => {
    setEditingAuthor(author)
    setFormData({
      name: author.name,
      bio: author.bio || '',
      imageId: (author as any).imageId || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tác giả này?')) {
      return
    }

    try {
      const response = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAuthors()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi xóa tác giả')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa tác giả')
    }
  }

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Tác Giả</h1>
          <p className="mt-2 text-gray-600">Quản lý các tác giả trong hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditingAuthor(null)
            setFormData({ name: '', bio: '', imageId: '' })
            setShowModal(true)
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm tác giả mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm tác giả..."
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
                Tên tác giả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tiểu sử
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
            {filteredAuthors.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy tác giả nào
                </td>
              </tr>
            ) : (
              filteredAuthors.map((author) => (
                <tr key={author.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {author.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {author.bio ? (
                      <span className="line-clamp-2">{author.bio}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {author._count?.books || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(author)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(author.id)}
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
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4">
                {editingAuthor ? 'Sửa tác giả' : 'Thêm tác giả mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tác giả *
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
                    Tiểu sử
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <MediaPicker
                  label="Ảnh đại diện"
                  value={formData.imageId}
                  onChange={(mediaId) => setFormData({ ...formData, imageId: mediaId })}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingAuthor(null)
                      setFormData({ name: '', bio: '', imageId: '' })
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingAuthor ? 'Cập nhật' : 'Tạo mới'}
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


'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@prisma/client'
import MediaPicker from '@/components/MediaPicker'

interface CategoryWithCount extends Category {
  _count?: { books: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [imageId, setImageId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const slug = formData.slug || generateSlug(formData.name)

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slug, imageId: imageId || null }),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ name: '', slug: '', description: '' })
        setImageId('')
        setEditingCategory(null)
        fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra')
    }
  }

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    })
    setImageId(category.imageId || '')
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi xóa danh mục')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa danh mục')
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Danh Mục</h1>
          <p className="mt-2 text-gray-600">Quản lý các danh mục sách trong hệ thống</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: '', slug: '', description: '' })
            setImageId('')
            setShowModal(true)
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm danh mục mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
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
                Tên danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
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
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy danh mục nào
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {category._count?.books || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (!editingCategory) {
                        setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="mb-4">
                  <MediaPicker
                    value={imageId}
                    onChange={setImageId}
                    label="Ảnh thumbnail danh mục"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCategory(null)
                      setFormData({ name: '', slug: '', description: '' })
                      setImageId('')
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingCategory ? 'Cập nhật' : 'Tạo mới'}
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


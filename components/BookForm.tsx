'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, Category, Author, Publisher } from '@prisma/client'
import MediaPicker from './MediaPicker'

interface BookFormProps {
  book?: Book & { 
    category: Category | null
    author: Author | null
    publisher: Publisher | null
    thumbnail?: { id: string; url: string } | null
    gallery?: Array<{ mediaId: string; media: { id: string; url: string } }>
  }
}

export default function BookForm({ book }: BookFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [bookSeries, setBookSeries] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [thumbnailId, setThumbnailId] = useState(book?.thumbnailId || '')
  const [galleryMediaIds, setGalleryMediaIds] = useState<string[]>(
    book?.gallery && Array.isArray(book.gallery)
      ? book.gallery.map((g) => g.mediaId)
      : []
  )
  const [formData, setFormData] = useState({
    title: book?.title || '',
    authorId: book?.authorId || '',
    publisherId: book?.publisherId || '',
    seriesId: (book as any)?.seriesId || '',
    description: book?.description || '',
    isbn: book?.isbn || '',
    price: book?.price || 0,
    stock: book?.stock || 0,
    status: book?.status || 'ACTIVE',
    categoryId: book?.categoryId || '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((res) => res.json()).catch(() => []),
      fetch('/api/authors').then((res) => res.json()).catch(() => []),
      fetch('/api/publishers').then((res) => res.json()).catch(() => []),
      fetch('/api/book-series').then((res) => res.json()).catch(() => []),
    ]).then(([categoriesData, authorsData, publishersData, seriesData]) => {
      setCategories(categoriesData)
      setAuthors(authorsData)
      setPublishers(publishersData)
      setBookSeries(seriesData)
    })
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = book ? `/api/books/${book.id}` : '/api/books'
      const method = book ? 'PATCH' : 'POST'

      const submitData = {
        ...formData,
        thumbnailId: thumbnailId || null,
        galleryMediaIds: galleryMediaIds.length > 0 ? galleryMediaIds : null,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        router.push('/cms/books')
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu sách')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Tên sách *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="authorId" className="block text-sm font-medium text-gray-700">
            Tác giả
          </label>
          <select
            id="authorId"
            name="authorId"
            value={formData.authorId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Chọn tác giả</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="publisherId" className="block text-sm font-medium text-gray-700">
            Nhà xuất bản
          </label>
          <select
            id="publisherId"
            name="publisherId"
            value={formData.publisherId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Chọn nhà xuất bản</option>
            {publishers.map((publisher) => (
              <option key={publisher.id} value={publisher.id}>
                {publisher.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
          ISBN
        </label>
        <input
          type="text"
          id="isbn"
          name="isbn"
          value={formData.isbn}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Giá (VND) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            step="1000"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Tồn kho *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            required
            min="0"
            value={formData.stock}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="ACTIVE">Đang bán</option>
            <option value="INACTIVE">Ngừng bán</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
          </select>
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Danh mục
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="seriesId" className="block text-sm font-medium text-gray-700">
          Bộ sách
        </label>
        <select
          id="seriesId"
          name="seriesId"
          value={formData.seriesId}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">Chọn bộ sách (tùy chọn)</option>
          {bookSeries.map((series) => (
            <option key={series.id} value={series.id}>
              {series.name}
            </option>
          ))}
        </select>
      </div>

      {/* Thumbnail Image */}
      <div>
        <MediaPicker
          value={thumbnailId}
          onChange={setThumbnailId}
          label="Ảnh thumbnail (1 ảnh)"
        />
      </div>

      {/* Gallery Images */}
      <div>
        <MediaPicker
          value=""
          onChange={() => {}}
          label="Ảnh mô tả (nhiều ảnh)"
          allowMultiple={true}
          multipleValues={galleryMediaIds}
          onMultipleChange={setGalleryMediaIds}
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : book ? 'Cập nhật' : 'Tạo mới'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Hủy
        </button>
      </div>
    </form>
  )
}


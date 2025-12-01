'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Book, Category, Publisher } from '@prisma/client'

interface AuthorWithImage {
  id: string
  name: string
  bio: string | null
  image: {
    id: string
    url: string
    path: string
  } | null
}

interface BookWithCategory extends Book {
  category: Category | null
  author: AuthorWithImage | null
  publisher: Publisher | null
  series: {
    id: string
    name: string
  } | null
  thumbnail: {
    id: string
    url: string
    path: string
  } | null
}

interface BooksListProps {
  books: BookWithCategory[]
}

export default function BooksList({ books: initialBooks }: BooksListProps) {
  const [books, setBooks] = useState(initialBooks)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      return
    }

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBooks(books.filter((book) => book.id !== id))
      } else {
        alert('Có lỗi xảy ra khi xóa sách')
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa sách')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
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
                Tên sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tác giả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Bộ sách
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tồn kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không tìm thấy sách nào
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => (
                <tr key={book.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {book.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {book.author?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {book.series ? (
                      <Link
                        href={`/cms/book-series/${book.series.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {book.series.name}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(book.price)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {book.stock}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        book.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : book.status === 'OUT_OF_STOCK'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {book.status === 'ACTIVE'
                        ? 'Đang bán'
                        : book.status === 'OUT_OF_STOCK'
                          ? 'Hết hàng'
                          : 'Ngừng bán'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/cms/books/${book.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(book.id)}
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
    </div>
  )
}


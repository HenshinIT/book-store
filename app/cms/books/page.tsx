import { prisma } from '@/lib/prisma'
import BooksList from '@/components/BooksList'
import Link from 'next/link'

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          bio: true,
          image: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
        },
      },
      publisher: true,
      series: {
        select: {
          id: true,
          name: true,
        },
      },
      thumbnail: {
        select: {
          id: true,
          url: true,
          path: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Sách</h1>
          <p className="mt-2 text-gray-600">Danh sách tất cả sách trong hệ thống</p>
        </div>
        <Link
          href="/cms/books/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm sách mới
        </Link>
      </div>

      <BooksList books={books} />
    </div>
  )
}


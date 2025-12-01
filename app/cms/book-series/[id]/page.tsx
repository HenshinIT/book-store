import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookImage from '@/components/BookImage'

export default async function BookSeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  const series = await prisma.bookSeries.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: {
      books: {
        where: {
          deletedAt: null,
        },
        include: {
          author: true,
          category: true,
          thumbnail: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!series) {
    return (
      <div>
        <p>Không tìm thấy bộ sách</p>
        <Link href="/cms/book-series">Quay lại</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/cms/book-series"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Quay lại danh sách bộ sách
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{series.name}</h1>
        {series.description && (
          <p className="mt-2 text-gray-600">{series.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Tổng số sách: {series.books.length}
        </p>
      </div>

      {series.books.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Bộ sách này chưa có sách nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/cms/books/${book.id}/edit`}>
                <div className="aspect-[3/4] bg-gray-100">
                  {book.thumbnail ? (
                    <BookImage
                      src={book.thumbnail.url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Không có ảnh
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/cms/books/${book.id}/edit`}>
                  <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600">
                    {book.title}
                  </h3>
                </Link>
                {book.author && (
                  <p className="text-sm text-gray-600 mb-2">{book.author.name}</p>
                )}
                <p className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(book.price)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Tồn kho: {book.stock} cuốn
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


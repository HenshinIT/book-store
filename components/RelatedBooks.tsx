import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BookImage from '@/components/BookImage'

interface RelatedBooksProps {
  categoryId: string
  excludeBookId: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export default async function RelatedBooks({ categoryId, excludeBookId }: RelatedBooksProps) {
  const relatedBooks = await prisma.book.findMany({
    where: {
      categoryId,
      id: { not: excludeBookId },
      deletedAt: null,
      status: 'ACTIVE',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          image: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
        },
      },
      publisher: {
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
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  if (relatedBooks.length === 0) {
    return null
  }

  const category = relatedBooks[0]?.category

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Sách cùng danh mục
        </h2>
        {category && (
          <Link
            href={`/categories/${category.slug}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem tất cả →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {relatedBooks.map((relatedBook) => {
          const thumbnailUrl = relatedBook.thumbnail?.url || '/placeholder-book.svg'
          const authorName = relatedBook.author?.name || 'Không rõ tác giả'

          return (
            <Link
              key={relatedBook.id}
              href={`/books/${relatedBook.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden">
                <BookImage
                  src={thumbnailUrl}
                  alt={relatedBook.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {relatedBook.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{authorName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">
                    {formatPrice(relatedBook.price)}
                  </span>
                  {relatedBook.stock > 0 ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Còn hàng
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

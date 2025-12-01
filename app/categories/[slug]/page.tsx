import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookImage from '@/components/BookImage'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page = '1' } = await searchParams
  const currentPage = parseInt(typeof page === 'string' ? page : '1')
  const limit = 12
  const skip = (currentPage - 1) * limit

  // Get category
  const category = await prisma.category.findFirst({
    where: {
      slug,
      deletedAt: null,
    },
  })

  if (!category) {
    notFound()
  }

  // Get books in this category
  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: {
        categoryId: category.id,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.book.count({
      where: {
        categoryId: category.id,
        deletedAt: null,
        status: 'ACTIVE',
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Về trang chủ
            </Link>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-600">{category.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {total} {total === 1 ? 'cuốn sách' : 'cuốn sách'}
          </p>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Chưa có sách nào trong danh mục này</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Xem các danh mục khác
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => {
                const thumbnailUrl = book.thumbnail?.url || '/placeholder-book.svg'
                const authorName = book.author?.name || 'Không rõ tác giả'
                
                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <BookImage
                        src={thumbnailUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{authorName}</p>
                      {book.publisher && (
                        <p className="text-xs text-gray-500 mb-3">{book.publisher.name}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-600">
                          {formatPrice(book.price)}
                        </span>
                        {book.stock > 0 ? (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <Link
                  href={`/categories/${slug}?page=${currentPage - 1}`}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                  onClick={(e) => currentPage === 1 && e.preventDefault()}
                >
                  Trước
                </Link>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Link
                        key={pageNum}
                        href={`/categories/${slug}?page=${pageNum}`}
                        className={`px-4 py-2 rounded-md ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-2 text-gray-500">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
                
                <Link
                  href={`/categories/${slug}?page=${currentPage + 1}`}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                  onClick={(e) => currentPage === totalPages && e.preventDefault()}
                >
                  Sau
                </Link>
              </div>
            )}
          </>
        )}
      </div>
      {/* Floating Chat Buttons (Messenger + Zalo + Hotline with animation) */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">

          {/* Messenger */}
          <a
            href="https://m.me/itgamo2002"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#0084FF] to-[#006AFF] shadow-lg hover:shadow-[#0084FF]/50 transition-all duration-300 hover:scale-110"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-md group-hover:animate-pulse"
              viewBox="0 0 36 36"
              fill="currentColor"
            >
              <path d="M18 3C9.164 3 2 9.626 2 17.5c0 3.692 1.667 7.045 4.445 9.522L5.5 33l6.526-3.604A16.636 16.636 0 0 0 18 32c8.836 0 16-6.626 16-14.5S26.836 3 18 3zm.3 16.96-3.31-3.5-5.23 3.5 5.95-6.4 3.28 3.5 5.23-3.5-5.92 6.4z" />
            </svg>
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-[#0084FF] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Liên hệ qua Messenger
            </span>
          </a>

          {/* Zalo */}
          <a
            href="https://zalo.me/0394200962"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#0180FF] to-[#00B4FF] shadow-lg hover:shadow-[#00B4FF]/40 transition-all duration-300 hover:scale-110"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-md group-hover:animate-pulse"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d="M410.7 64H101.3C79.3 64 64 79.3 64 101.3v309.3C64 432.7 79.3 448 101.3 448h309.3c22 0 37.3-15.3 37.3-37.3V101.3C448 79.3 432.7 64 410.7 64zM179 341H112V308l59-84h-57V192h99v33l-59 83h60v33zm67 0h-38V192h38v149zm124 0h-41l-53-149h41l33 103 33-103h41l-54 149z" />
            </svg>
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-[#00AEEF] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Liên hệ qua Zalo
            </span>
          </a>

          {/* Hotline - ringing effect */}
          <a
            href="tel:0394200962"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#FF4D4D] to-[#FF9900] shadow-lg hover:shadow-[#FF4D4D]/60 transition-all duration-300 hover:scale-110 animate-phone-ring"
          >
            {/* Halo pulse effect */}
            <span className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-[#FF4D4D]/30 to-[#FF9900]/30 animate-halo-pulse"></span>

            {/* Phone Icon */}
            <svg
              className="relative w-7 h-7 text-white drop-shadow-md animate-phone-vibrate"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .65 2.73 2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.73.65A2 2 0 0 1 22 16.92z" />
            </svg>

            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-gradient-to-r from-[#FF4D4D] to-[#FF9900] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Gọi ngay 0394 200 962
            </span>
          </a>
        </div>
      <PublicFooter />
    </div>
  )
}

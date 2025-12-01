import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BookImage from '@/components/BookImage'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export default async function BookSeriesListPage() {
  const seriesList = await prisma.bookSeries.findMany({
    where: { deletedAt: null },
    include: {
      books: {
        where: {
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          price: true,
          stock: true,
          thumbnail: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
        },
      },
      _count: {
        select: {
          books: {
            where: {
              deletedAt: null,
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Tính giá cho mỗi bộ sách
  const seriesWithPrices = seriesList.map((s) => {
    const totalPrice = s.books.reduce((sum, book) => sum + book.price, 0)
    const discountedPrice = totalPrice * 0.9 // giảm 10%
    const allInStock = s.books.every((book) => book.stock > 0)
    const firstBookThumbnail = s.books.find((book) => book.thumbnail)?.thumbnail

    return {
      ...s,
      totalPrice,
      discountedPrice,
      discount: totalPrice - discountedPrice,
      allInStock,
      thumbnail: firstBookThumbnail,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Bộ sách</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bộ Sách</h1>
          <p className="text-lg text-gray-600">
            Mua cả bộ và tiết kiệm 10% so với mua từng cuốn
          </p>
        </div>

        {seriesWithPrices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Chưa có bộ sách nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seriesWithPrices.map((series) => (
              <Link
                key={series.id}
                href={`/book-series/${series.id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {series.thumbnail ? (
                    <BookImage
                      src={series.thumbnail.url}
                      alt={series.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-24 h-24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Giảm 10%
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {series.name}
                  </h3>
                  {series.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {series.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Số lượng sách</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {series._count.books} cuốn
                      </p>
                    </div>
                    {!series.allInStock && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Một số sách hết hàng
                      </span>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Giá gốc:</span>
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(series.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        Giá sau giảm:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(series.discountedPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1 text-right">
                      Tiết kiệm: {formatPrice(series.discount)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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


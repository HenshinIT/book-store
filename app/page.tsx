import { getCurrentUser } from '@/lib/session'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import CartButton from '@/components/CartButton'
import { prisma } from '@/lib/prisma'
import BookImage from '@/components/BookImage'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

// Fetch home data directly from database
async function getHomeData() {
  try {
    const [featuredBooks, bookSeries, categories, stats] = await Promise.all([
      // Featured books - lấy 6 sách đầu tiên
      prisma.book.findMany({
        where: {
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
              imageId: true,
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
        take: 6,
      }),

      // Book Series - lấy 6 bộ sách đầu tiên
      prisma.bookSeries.findMany({
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
        take: 6,
      }),

      // Categories với số lượng sách
      prisma.category.findMany({
        where: { deletedAt: null },
        include: {
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
          image: {
            select: {
              id: true,
              url: true,
              path: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 6,
      }),

      // Stats
      Promise.all([
        prisma.book.count({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        }),
        prisma.category.count({
          where: { deletedAt: null },
        }),
        prisma.author.count({
          where: { deletedAt: null },
        }),
      ]).then(([totalBooks, totalCategories, totalAuthors]) => ({
        totalBooks,
        totalCategories,
        totalAuthors,
      })),
    ])

    return {
      featuredBooks,
      bookSeries,
      categories,
      stats,
    }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return {
      featuredBooks: [],
      bookSeries: [],
      categories: [],
      stats: { totalBooks: 0, totalCategories: 0, totalAuthors: 0 },
    }
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()
  const { featuredBooks, bookSeries, categories, stats } = await getHomeData()
  
  // Tính giá cho mỗi bộ sách
  const seriesWithPrices = bookSeries.map((s) => {
    const totalPrice = s.books.reduce((sum, book) => sum + book.price, 0)
    const discountedPrice = totalPrice * 0.9 //giảm 10%
    const firstBookThumbnail = s.books.find((book) => book.thumbnail)?.thumbnail
    return {
      ...s,
      totalPrice,
      discountedPrice,
      discount: totalPrice - discountedPrice,
      thumbnail: firstBookThumbnail,
    }
  })

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMS4xLS45LTItMi0ySDhjLS41IDAtMS0uMy0xLjEtLjhMMCAyNGgxNGMyIDAgNC0yIDQtNHYtMmMwLTIgMi00IDQtNGgyNGMyIDAgNCAyIDQgNHYxNGMwIDItMiA0LTQgNGgtNGMwIDAtLjUtLjEtLjgtLjRsLS4yLS4yYzAtMS0uOS0yLTItMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-lg blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-purple-400/20 rounded-lg blur-lg animate-pulse delay-500"></div>
        </div>

        {/* Book Icons Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-10 left-10 w-16 h-16 text-white/10 animate-float" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
          <svg className="absolute top-20 right-20 w-20 h-20 text-white/10 animate-float-delayed" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
          <svg className="absolute bottom-20 left-1/3 w-14 h-14 text-white/10 animate-float-slow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">Nền tảng sách trực tuyến hàng đầu</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight font-[Inter] mb-8 animate-fade-in-up">
              <span
                className="block bg-gradient-to-r from-[#ffffff] via-[#dbeafe] to-[#f5d0fe] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]">
                KHÁM PHÁ THẾ GIỚI
              </span>

              <span
                className="block bg-gradient-to-r from-[#fbcfe8] via-[#ddd6fe] to-[#c7d2fe] bg-clip-text text-transparent mt-3 drop-shadow-[0_2px_6px_rgba(255,255,255,0.35)]">
                TRI THỨC VÔ TẬN
              </span>
            </h1>
            {/* Description */}
            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto animate-fade-in-up-delayed">
              Hàng ngàn cuốn sách hay đang chờ bạn khám phá. 
              Tìm kiếm kiến thức mới và mở rộng tầm nhìn của bạn.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in-up-delayed-2">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalBooks.toLocaleString('vi-VN')}</div>
                <div className="text-white/70 text-sm md:text-base">Cuốn Sách</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalCategories}</div>
                <div className="text-white/70 text-sm md:text-base">Danh Mục</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stats.totalAuthors}</div>
                <div className="text-white/70 text-sm md:text-base">Tác Giả</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delayed-2">
              <Link
                href="#books"
                className="group relative px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Xem Sách Nổi Bật
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                href="#categories"
                className="group px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:border-white/50"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Khám Phá Danh Mục
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Featured Books Section */}
      <section id="books" className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-4 py-2 rounded-full">
                Bộ Sưu Tập
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold md:font-extrabold text-gray-900 tracking-tight leading-tight font-[Inter] mb-4">
              Sách Nổi Bật
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Những cuốn sách được yêu thích nhất hiện tại - được lựa chọn đặc biệt cho bạn
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBooks.length > 0 ? (
              featuredBooks.map((book, index) => {
                const thumbnailUrl = book.thumbnail?.url || '/placeholder-book.svg'
                const authorName = book.author?.name || 'Không rõ tác giả'
                
                return (
                  <div
                    key={book.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Link href={`/books/${book.id}`}>
                      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                        <BookImage
                          src={thumbnailUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-6">
                      <Link href={`/books/${book.id}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 hover:text-indigo-600 transition-colors group-hover:text-indigo-600">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {authorName}
                      </p>
                      <p className="text-sm text-gray-500 mb-5 line-clamp-2 min-h-[2.5rem]">
                        {book.description || 'Không có mô tả'}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-2xl font-extrabold text-indigo-600">
                            {formatPrice(book.price)}
                          </span>
                        </div>
                        <Link
                          href={`/books/${book.id}`}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          Xem Chi Tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Chưa có sách nổi bật</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Book Series Section */}
      {seriesWithPrices.length > 0 && (
        <section id="book-series" className="py-20 bg-gradient-to-b from-white via-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-block mb-4">
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-4 py-2 rounded-full">
                  Tiết Kiệm
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold md:font-extrabold tracking-tight leading-tight text-gray-900 font-[Inter] mb-4">
                Bộ Sách - Giảm 10%
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Mua cả bộ và tiết kiệm 10% so với mua từng cuốn
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {seriesWithPrices.map((series, index) => (
                <Link
                  key={series.id}
                  href={`/book-series/${series.id}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                    {series.thumbnail ? (
                      <BookImage
                        src={series.thumbnail.url}
                        alt={series.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-24 h-24 text-gray-300"
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
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Giảm 10%
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
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
            <div className="text-center mt-12">
              <Link
                href="/book-series"
                className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Xem Tất Cả Bộ Sách →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section id="categories" className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-4 py-2 rounded-full">
                Khám Phá
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold md:font-extrabold tracking-tight leading-tight text-gray-900 font-[Inter] mb-4">
              Khám Phá Theo Danh Mục
            </h2>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tìm sách theo sở thích và mối quan tâm của bạn
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.length > 0 ? (
              categories.map((category, index) => {
                const bookCount = category._count?.books || 0
                const categoryImageUrl = category.image?.url
                // Generate gradient color based on category name
                const colors = [
                  'from-indigo-600 via-purple-600 to-pink-600',
                  'from-emerald-600 via-teal-600 to-cyan-600',
                  'from-orange-600 via-red-600 to-rose-600',
                  'from-pink-600 via-rose-600 to-red-600',
                  'from-blue-600 via-indigo-600 to-purple-600',
                  'from-cyan-600 via-blue-600 to-indigo-600',
                ]
                const colorIndex = category.id ? parseInt(category.id) % colors.length : 0
                const gradient = colors[colorIndex]
                
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 aspect-square"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Background Image or Gradient */}
                    {categoryImageUrl ? (
                      <>
                        <div className="absolute inset-0">
                          <BookImage
                            src={categoryImageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
                      </>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                      </div>
                    )}
                    
                    {/* Hover overlay effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                      <div className="transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                        <h3 className="text-white font-bold text-lg mb-2 drop-shadow-lg">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-white/90 text-sm mb-2 line-clamp-2 drop-shadow">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-white/90 text-sm font-medium">
                            {bookCount} cuốn sách
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">Chưa có danh mục</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-indigo-600 bg-white px-4 py-2 rounded-full shadow-sm">
                Về Chúng Tôi
              </span>
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold md:font-extrabold tracking-tight leading-tight text-gray-900 font-[Inter] mb-6">
              StoreBook - Nền Tảng Bán Sách Trực Tuyến Hàng Đầu
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              StoreBook không chỉ là nơi mua sắm sách, mà là hệ sinh thái quản lý và khám phá tri thức toàn diện. 
              Với giao diện trực quan, dữ liệu phong phú và công nghệ tìm kiếm thông minh,
              StoreBook giúp bạn tiếp cận nhanh chóng những cuốn sách yêu thích, từ kinh điển đến xu hướng mới nhất.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Hàng Ngàn Sách</h3>
              <p className="text-lg text-gray-600 mb-2 font-semibold">{stats.totalBooks.toLocaleString('vi-VN')}</p>
              <p className="text-gray-600">Cuốn sách đa dạng</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Đảm Bảo Chất Lượng</h3>
              <p className="text-gray-600">Sách chính hãng</p>
              <p className="text-gray-600">Chất lượng cao</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Giao Hàng Nhanh</h3>
              <p className="text-gray-600">Vận chuyển nhanh chóng</p>
              <p className="text-gray-600">An toàn, đáng tin cậy</p>
            </div>
          </div>
        </div>
      </section>
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

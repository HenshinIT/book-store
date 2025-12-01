import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookImage from '@/components/BookImage'
import RelatedBooks from '@/components/RelatedBooks'
import AddToCartButton from '@/components/AddToCartButton'
import AddSeriesToCartButton from '@/components/AddSeriesToCartButton'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params

  const book = await prisma.book.findFirst({
    where: {
      id,
      deletedAt: null,
      status: 'ACTIVE',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
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
      publisher: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          website: true,
        },
      },
      series: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      thumbnail: {
        select: {
          id: true,
          url: true,
          path: true,
          filename: true,
          originalName: true,
        },
      },
      gallery: {
        include: {
          media: {
            select: {
              id: true,
              url: true,
              path: true,
              filename: true,
              originalName: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!book) {
    notFound()
  }

  const thumbnailUrl = book.thumbnail?.url || '/placeholder-book.svg'
  const authorName = book.author?.name || 'Không rõ tác giả'
  const galleryImages = book.gallery.map((g) => g.media).filter(Boolean)

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
            {book.category && (
              <>
                <Link
                  href={`/categories/${book.category.slug}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {book.category.name}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-600">{book.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {/* Main Thumbnail */}
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <BookImage
                  src={thumbnailUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Gallery Images */}
              {galleryImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh khác ({galleryImages.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer"
                      >
                        <BookImage
                          src={image.url}
                          alt={image.originalName || book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Book Info */}
            <div className="space-y-6">
              {/* Title & Category */}
              <div>
                {book.category && (
                  <Link
                    href={`/categories/${book.category.slug}`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-700 mb-2"
                  >
                    {book.category.name}
                  </Link>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {book.title}
                </h1>
              </div>

              {/* Author */}
              {book.author && (
                <div className="flex items-center space-x-4">
                  {book.author.image && (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <BookImage
                        src={book.author.image.url}
                        alt={book.author.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Tác giả</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {book.author.name}
                    </p>
                    {book.author.bio && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {book.author.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price & Stock */}
              <div className="border-t border-b py-6">
                <div className="flex items-baseline space-x-4 mb-4">
                  <span className="text-4xl font-bold text-blue-600">
                    {formatPrice(book.price)}
                  </span>
                  {book.stock > 0 ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Còn hàng ({book.stock} cuốn)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Hết hàng
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <AddToCartButton
                    bookId={book.id}
                    stock={book.stock}
                  />
                  {book.series && (
                    <AddSeriesToCartButton
                      seriesId={book.series.id}
                      disabled={book.stock === 0}
                      showInfo={true}
                    />
                  )}
                </div>
              </div>

              {/* Book Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Thông tin sách
                  </h3>
                  <div className="space-y-2 text-sm">
                    {book.isbn && (
                      <div className="flex">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          ISBN:
                        </span>
                        <span className="text-gray-900">{book.isbn}</span>
                      </div>
                    )}
                    {book.publisher && (
                      <div className="flex">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          NXB:
                        </span>
                        <span className="text-gray-900">{book.publisher.name}</span>
                      </div>
                    )}
                    {book.category && (
                      <div className="flex">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          Danh mục:
                        </span>
                        <Link
                          href={`/categories/${book.category.slug}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {book.category.name}
                        </Link>
                      </div>
                    )}
                    {book.series && (
                      <div className="flex">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          Bộ sách:
                        </span>
                        <Link
                          href={`/book-series/${book.series.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {book.series.name}
                        </Link>
                      </div>
                    )}
                    <div className="flex">
                      <span className="text-gray-500 w-24 flex-shrink-0">
                        Tồn kho:
                      </span>
                      <span className="text-gray-900">{book.stock} cuốn</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Mô tả
                    </h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {book.description}
                    </div>
                  </div>
                )}

                {/* Publisher Info */}
                {book.publisher && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Nhà xuất bản
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">
                        {book.publisher.name}
                      </p>
                      {book.publisher.address && (
                        <p>Địa chỉ: {book.publisher.address}</p>
                      )}
                      {book.publisher.phone && (
                        <p>Điện thoại: {book.publisher.phone}</p>
                      )}
                      {book.publisher.email && (
                        <p>Email: {book.publisher.email}</p>
                      )}
                      {book.publisher.website && (
                        <a
                          href={book.publisher.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Website: {book.publisher.website}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Books Section - Same Category */}
        {book.category && (
          <RelatedBooks categoryId={book.category.id} excludeBookId={book.id} />
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

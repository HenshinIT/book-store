import { getCurrentUser } from '@/lib/session'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'
import CartButton from '@/components/CartButton'

export default async function PublicHeader() {
  const user = await getCurrentUser()

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">StoreBook</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#books" className="text-gray-700 hover:text-blue-600 transition-colors">
              Sách Nổi Bật
            </Link>
            <Link href="/book-series" className="text-gray-700 hover:text-blue-600 transition-colors">
              Bộ Sách
            </Link>
            <Link href="/#categories" className="text-gray-700 hover:text-blue-600 transition-colors">
              Danh Mục
            </Link>
            <Link href="/#about" className="text-gray-700 hover:text-blue-600 transition-colors">
              Giới Thiệu
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <CartButton />
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

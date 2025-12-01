import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-white">StoreBook</span>
            </div>
            <p className="text-gray-400">
              Hệ thống quản lý và mua sắm sách trực tuyến hàng đầu.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Liên Kết Nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#books" className="hover:text-white transition-colors">
                  Sách Nổi Bật
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-white transition-colors">
                  Danh Mục
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  Về Chúng Tôi
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Đăng Nhập
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Hỗ Trợ</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Câu Hỏi Thường Gặp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính Sách Vận Chuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính Sách Đổi Trả
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Liên Hệ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Theo Dõi</h3>
            <p className="text-gray-400 mb-4">Kết nối với chúng tôi qua mạng xã hội</p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/itgamo2002"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/quick_master02/"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@nhacdodambocali_2002"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <span className="sr-only">TikTok</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.66 2c.09 1.03.46 1.99 1.08 2.79.72.92 1.75 1.57 2.91 1.8.31.06.63.09.95.09v2.19a6.34 6.34 0 01-3.86-1.3v6.48a5.43 5.43 0 11-5.43-5.43c.24 0 .48.02.72.05v2.3a3.1 3.1 0 101.52 5.85V2h2.11Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} StoreBook – Nơi tri thức hội tụ mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}


import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-800">
          Không có quyền truy cập
        </h2>
        <p className="mt-4 text-gray-600">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}


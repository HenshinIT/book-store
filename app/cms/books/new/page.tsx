import BookForm from '@/components/BookForm'

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Thêm sách mới</h1>
        <p className="mt-2 text-gray-600">Điền thông tin sách bên dưới</p>
      </div>

      <BookForm />
    </div>
  )
}


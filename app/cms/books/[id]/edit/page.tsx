import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BookForm from '@/components/BookForm'

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      category: true,
      author: true,
      publisher: true,
      thumbnail: true,
      gallery: {
        include: {
          media: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!book) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa sách</h1>
        <p className="mt-2 text-gray-600">Cập nhật thông tin sách</p>
      </div>

      <BookForm book={book} />
    </div>
  )
}


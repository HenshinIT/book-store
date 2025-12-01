import MediaManager from '@/components/MediaManager'

export default function MediaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Media</h1>
        <p className="mt-2 text-gray-600">Upload và quản lý các file media của bạn</p>
      </div>
      <MediaManager />
    </div>
  )
}


'use client'

import { useState, useEffect, useRef } from 'react'
import type { Media, User } from '@prisma/client'

interface MediaWithUploader extends Media {
  uploader: Pick<User, 'id' | 'name' | 'email'> | null
}

export default function MediaManager() {
  const [media, setMedia] = useState<MediaWithUploader[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data = await response.json()
        setMedia(data)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchMedia()
        setSelectedFile(null)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        alert('Upload thành công!')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi upload')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Có lỗi xảy ra khi upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${filename}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMedia()
        alert('Xóa file thành công!')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi xóa')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Có lỗi xảy ra khi xóa')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('vi-VN')
  }

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith('image/')
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url)
    alert('Đã copy URL vào clipboard!')
  }

  const filteredMedia = media.filter((item) =>
    item.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upload File</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn file (Max 10MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {preview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs max-h-48 rounded border"
              />
            </div>
          )}

          {selectedFile && (
            <div className="text-sm text-gray-600">
              <p>
                <strong>File:</strong> {selectedFile.name}
              </p>
              <p>
                <strong>Size:</strong> {formatFileSize(selectedFile.size)}
              </p>
              <p>
                <strong>Type:</strong> {selectedFile.type}
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Đang upload...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Media List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Danh sách Media</h2>
            <input
              type="text"
              placeholder="Tìm kiếm file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : filteredMedia.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Không tìm thấy file nào' : 'Chưa có file nào được upload'}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {isImage(item.mimeType) ? (
                      <img
                        src={item.url}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">
                          {item.mimeType === 'application/pdf' ? '📄' : '📎'}
                        </div>
                        <p className="text-xs text-gray-500 truncate px-2">
                          {item.originalName}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {item.originalName}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>{formatFileSize(item.size)}</p>
                      <p>{formatDate(item.createdAt)}</p>
                      {item.uploader && (
                        <p>Upload bởi: {item.uploader.name || item.uploader.email}</p>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => copyToClipboard(item.url)}
                        className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.originalName)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect, useRef } from 'react'
import type { Media } from '@prisma/client'

interface MediaPickerProps {
  value: string // Media ID
  onChange: (mediaId: string) => void
  label: string
  allowMultiple?: boolean
  multipleValues?: string[] // Array of Media IDs
  onMultipleChange?: (mediaIds: string[]) => void
}

export default function MediaPicker({
  value,
  onChange,
  label,
  allowMultiple = false,
  multipleValues = [],
  onMultipleChange,
}: MediaPickerProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>(multipleValues || [])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevMultipleValuesRef = useRef<string[]>(multipleValues || [])

  useEffect(() => {
    fetchMedia()
  }, [])

  useEffect(() => {
    if (showModal) {
      fetchMedia()
    }
  }, [showModal])

  useEffect(() => {
    const newValues = multipleValues || []
    const prevValues = prevMultipleValuesRef.current
    
    // Only update if the arrays are actually different (deep comparison)
    const areEqual =
      prevValues.length === newValues.length &&
      prevValues.every((val, idx) => val === newValues[idx]) &&
      newValues.every((val, idx) => val === prevValues[idx])
    
    if (!areEqual) {
      prevMultipleValuesRef.current = newValues
      setSelectedMediaIds(newValues)
    }
  }, [multipleValues])

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

  const handleSelectMedia = (mediaId: string) => {
    if (allowMultiple && onMultipleChange) {
      if (selectedMediaIds.includes(mediaId)) {
        onMultipleChange(selectedMediaIds.filter((id) => id !== mediaId))
      } else {
        onMultipleChange([...selectedMediaIds, mediaId])
      }
    } else {
      onChange(mediaId)
      setShowModal(false)
    }
  }

  const handleRemoveImage = (mediaId: string) => {
    if (allowMultiple && onMultipleChange) {
      onMultipleChange(selectedMediaIds.filter((id) => id !== mediaId))
    } else {
      onChange('')
    }
  }

  const isSelected = (mediaId: string) => {
    if (allowMultiple) {
      return selectedMediaIds.includes(mediaId)
    }
    return value === mediaId
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh')
        return
      }
      setSelectedFile(file)
      // Create preview for images
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
        const uploadedMedia = await response.json()
        await fetchMedia()
        setSelectedFile(null)
        setPreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Auto-select the newly uploaded media
        if (allowMultiple && onMultipleChange) {
          onMultipleChange([...selectedMediaIds, uploadedMedia.id])
          // Switch to library tab to show the uploaded image
          setActiveTab('library')
        } else {
          onChange(uploadedMedia.id)
          // Close modal for single select mode
          setShowModal(false)
          setActiveTab('library')
          setSelectedFile(null)
          setPreview(null)
        }
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

  // Get selected media objects for preview
  const selectedMediaObjects = media.filter((m) => {
    if (allowMultiple) {
      return selectedMediaIds.includes(m.id)
    }
    return value === m.id
  })

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Preview Images */}
      {selectedMediaObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedMediaObjects.map((mediaItem) => (
            <div key={mediaItem.id} className="relative">
              <img
                src={mediaItem.url}
                alt={mediaItem.originalName}
                className="w-24 h-24 object-cover rounded border"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/placeholder-image.png'
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(mediaItem.id)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {allowMultiple ? 'Chọn ảnh từ Media' : 'Chọn ảnh từ Media'}
      </button>

      {/* Media Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {allowMultiple ? 'Chọn nhiều ảnh từ Media' : 'Chọn ảnh từ Media'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setActiveTab('library')
                  setSelectedFile(null)
                  setPreview(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b flex">
              <button
                onClick={() => setActiveTab('library')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'library'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Thư viện Media
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload Ảnh Mới
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'library' ? (
                // Library Tab
                <>
                  {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                  ) : media.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Chưa có media nào</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Upload ảnh đầu tiên
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {media
                        .filter((m) => m.mimeType.startsWith('image/'))
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                              isSelected(item.id)
                                ? 'border-blue-500 ring-2 ring-blue-300'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => handleSelectMedia(item.id)}
                          >
                            <img
                              src={item.url}
                              alt={item.originalName}
                              className="w-full h-32 object-cover"
                            />
                            {isSelected(item.id) && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                ✓
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                // Upload Tab
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn file ảnh
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    {preview && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Xem trước
                        </label>
                        <div className="relative border rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-contain bg-gray-50"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className={`w-full px-4 py-2 rounded-md font-medium ${
                        !selectedFile || uploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {uploading ? 'Đang upload...' : 'Upload Ảnh'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {allowMultiple && selectedMediaIds.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Đã chọn: {selectedMediaIds.length} ảnh
                  </span>
                  <button
                    onClick={() => {
                      if (onMultipleChange) {
                        onMultipleChange(selectedMediaIds)
                      }
                      setShowModal(false)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Xong
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


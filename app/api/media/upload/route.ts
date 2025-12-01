import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Loại file không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${extension}`

    // Create year/month/day directory structure
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    // Create upload directory path: public/media/year/month/day
    const uploadDir = join(process.cwd(), 'public', 'media', year, month, day)
    const filePath = join(uploadDir, filename)

    // Create directory structure if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate URL and relative path
    const relativePath = `media/${year}/${month}/${day}/${filename}`
    // Use API route to serve files in production for better reliability
    const url = `/api/media/serve/${year}/${month}/${day}/${filename}`

    // Save to database
    const media = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: relativePath,
        url,
        uploadedBy: user.id,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi upload file' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const filePath = pathArray.join('/')
    
    // Security: Only allow files from media directory
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Construct full path to file in public/media
    const fullPath = join(process.cwd(), 'public', 'media', filePath)

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(fullPath)
    
    // Determine content type based on file extension
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }
    const contentType = contentTypeMap[extension || ''] || 'application/octet-stream'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving media file:', error)
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    )
  }
}


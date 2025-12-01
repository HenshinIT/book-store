import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageBooks } from '@/lib/permissions'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageBooks(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const media = await prisma.media.findUnique({
      where: { id },
    })

    if (!media) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 })
    }

    // Delete file from disk (soft delete - just mark as deleted in DB for safety)
    // In production, you might want to keep the file for recovery
    // For now, we'll just soft delete in database
    
    // Uncomment below if you want to actually delete the file:
    // const filePath = join(process.cwd(), 'public', media.path)
    // if (existsSync(filePath)) {
    //   await unlink(filePath)
    // }

    // Soft delete in database
    await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Xóa file thành công' })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xóa file' },
      { status: 500 }
    )
  }
}


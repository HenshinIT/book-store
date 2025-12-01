import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { canManageUsers } from '@/lib/permissions'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !canManageUsers(user.role as any)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { role } = roleSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi cập nhật vai trò' },
      { status: 500 }
    )
  }
}


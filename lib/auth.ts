import { compare, hash } from 'bcryptjs'
import { prisma } from './prisma'
import type { UserRole } from '@prisma/client'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function createUser(
  email: string,
  password: string,
  name?: string,
  role: UserRole = 'CUSTOMER'
) {
  const hashedPassword = await hashPassword(password)
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { 
      email,
      deletedAt: null,
    },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })
}


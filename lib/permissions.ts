import type { UserRole } from '@prisma/client'

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  CUSTOMER: 1,
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessCMS(userRole: UserRole): boolean {
  return hasPermission(userRole, 'STAFF')
}

export function canManageUsers(userRole: UserRole): boolean {
  return hasPermission(userRole, 'MANAGER')
}

export function canManageBooks(userRole: UserRole): boolean {
  return hasPermission(userRole, 'STAFF')
}


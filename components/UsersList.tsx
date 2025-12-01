'use client'

import { useState } from 'react'
import type { UserRole } from '@prisma/client'

interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
}

interface UsersListProps {
  users: User[]
  currentUserId?: string
  currentUserRole?: UserRole
}

// ADMIN: Có thể đổi vai trò của bất kỳ ai (kể cả MANAGER, CUSTOMER, STAFF).
// MANAGER:
// Có thể đổi vai trò của STAFF ↔ CUSTOMER.
// Không thể đổi vai trò của ADMIN hoặc MANAGER (kể cả chính mình).
// Các vai trò khác: Không thể đổi vai trò của ai hết.
const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
}

export default function UsersList({
  users: initialUsers,
  currentUserId,
  currentUserRole,
}: UsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ email: '', name: '' })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Giới hạn vai trò mà currentUser được phép gán
  const getAllowedRoles = (targetUser: User): UserRole[] => {
    if (currentUserRole === 'ADMIN') return ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']
    if (currentUserRole === 'MANAGER') {
      // MANAGER chỉ được đổi vai trò của STAFF và CUSTOMER
      if (targetUser.role === 'ADMIN' || targetUser.role === 'MANAGER') return [targetUser.role]
      return ['STAFF', 'CUSTOMER']
    }
    return [targetUser.role]
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find((u) => u.id === userId)
    if (!targetUser || !currentUserRole) return

    //  Kiểm tra quyền trước khi gọi API
    const allowedRoles = getAllowedRoles(targetUser)
    if (!allowedRoles.includes(newRole)) {
      alert('Bạn không có quyền thay đổi vai trò này.')
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        )
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi cập nhật vai trò')
      }
    } catch {
      alert('Có lỗi xảy ra khi cập nhật vai trò')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({ email: user.email, name: user.name || '' })
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
        setIsEditModalOpen(false)
        setEditingUser(null)
        alert('Cập nhật thông tin thành công')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi cập nhật thông tin')
      }
    } catch {
      alert('Có lỗi xảy ra khi cập nhật thông tin')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId))
        alert('Xóa người dùng thành công')
      } else {
        const data = await response.json()
        alert(data.error || 'Có lỗi xảy ra khi xóa người dùng')
      }
    } catch {
      alert('Có lỗi xảy ra khi xóa người dùng')
    }
  }

  const canEditUser = (user: User) => {
    if (!currentUserId || !currentUserRole) return false
    if (currentUserRole === 'ADMIN') return true
    if (currentUserRole === 'MANAGER') return user.role !== 'ADMIN'
    return false
  }

  const canDeleteUser = (user: User) => {
    if (!currentUserId || !currentUserRole) return false
    if (currentUserRole === 'MANAGER')
      return user.role !== 'ADMIN' && currentUserId !== user.id
    if (currentUserRole === 'ADMIN') return currentUserId !== user.id
    return false
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ngày tạo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {user.name || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as UserRole)
                    }
                    disabled={getAllowedRoles(user).length === 1}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {getAllowedRoles(user).map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  {canEditUser(user) && (
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Sửa
                    </button>
                  )}
                  {canDeleteUser(user) && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsEditModalOpen(false)}
            ></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sửa thông tin người dùng
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

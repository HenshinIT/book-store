'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email hoặc mật khẩu không đúng')
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        await new Promise(resolve => setTimeout(resolve, 100))

        if (data.user?.role === 'CUSTOMER') {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/cms/dashboard'
        }
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fadeIn">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Đăng nhập vào hệ thống
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Quản lý cửa hàng sách của bạn
          </p>
        </div>
        <form className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow-xl transition-transform transform hover:scale-105" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Ghi nhớ đăng nhập
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

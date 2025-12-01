'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PublicHeaderClient from '@/components/PublicHeaderClient'
import PublicFooter from '@/components/PublicFooter'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Lấy token từ URL khi component mount (chỉ trên client)
  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    setToken(tokenParam)
  }, [])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Kiểm tra token khi component mount và khi token được set
  useEffect(() => {
    if (token === null) {
      // Đang đợi lấy token từ URL
      return
    }

    if (!token) {
      setTokenValid(false)
      setError('Token không hợp lệ hoặc đã hết hạn')
      return
    }

    // Verify token bằng cách gọi API
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
        if (response.ok) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          const data = await response.json()
          setError(data.error || 'Token không hợp lệ hoặc đã hết hạn')
        }
      } catch (error) {
        setTokenValid(false)
        setError('Có lỗi xảy ra khi xác thực token')
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token không hợp lệ')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Có lỗi xảy ra khi đặt lại mật khẩu')
      } else {
        setSuccess(true)
        // Redirect sau 2 giây
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  // Chờ component mount trên client để tránh hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PublicHeaderClient />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  // Hiển thị loading khi chưa có token hoặc đang verify
  if (token === null || tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PublicHeaderClient />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Đang xác thực token...</p>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PublicHeaderClient />
        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error || 'Token không hợp lệ hoặc đã hết hạn'}</p>
            </div>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Yêu cầu link đặt lại mật khẩu mới
              </Link>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeaderClient />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Đặt lại mật khẩu
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Nhập mật khẩu mới của bạn
            </p>
          </div>

          {success ? (
            <div className="mt-8 space-y-6">
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  Đặt lại mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập...
                </p>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
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
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Floating Chat Buttons (Messenger + Zalo + Hotline with animation) */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">

          {/* Messenger */}
          <a
            href="https://m.me/itgamo2002"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#0084FF] to-[#006AFF] shadow-lg hover:shadow-[#0084FF]/50 transition-all duration-300 hover:scale-110"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-md group-hover:animate-pulse"
              viewBox="0 0 36 36"
              fill="currentColor"
            >
              <path d="M18 3C9.164 3 2 9.626 2 17.5c0 3.692 1.667 7.045 4.445 9.522L5.5 33l6.526-3.604A16.636 16.636 0 0 0 18 32c8.836 0 16-6.626 16-14.5S26.836 3 18 3zm.3 16.96-3.31-3.5-5.23 3.5 5.95-6.4 3.28 3.5 5.23-3.5-5.92 6.4z" />
            </svg>
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-[#0084FF] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Liên hệ qua Messenger
            </span>
          </a>

          {/* Zalo */}
          <a
            href="https://zalo.me/0394200962"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#0180FF] to-[#00B4FF] shadow-lg hover:shadow-[#00B4FF]/40 transition-all duration-300 hover:scale-110"
          >
            <svg
              className="w-8 h-8 text-white drop-shadow-md group-hover:animate-pulse"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d="M410.7 64H101.3C79.3 64 64 79.3 64 101.3v309.3C64 432.7 79.3 448 101.3 448h309.3c22 0 37.3-15.3 37.3-37.3V101.3C448 79.3 432.7 64 410.7 64zM179 341H112V308l59-84h-57V192h99v33l-59 83h60v33zm67 0h-38V192h38v149zm124 0h-41l-53-149h41l33 103 33-103h41l-54 149z" />
            </svg>
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-[#00AEEF] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Liên hệ qua Zalo
            </span>
          </a>

          {/* Hotline - ringing effect */}
          <a
            href="tel:0394200962"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#FF4D4D] to-[#FF9900] shadow-lg hover:shadow-[#FF4D4D]/60 transition-all duration-300 hover:scale-110 animate-phone-ring"
          >
            {/* Halo pulse effect */}
            <span className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-[#FF4D4D]/30 to-[#FF9900]/30 animate-halo-pulse"></span>

            {/* Phone Icon */}
            <svg
              className="relative w-7 h-7 text-white drop-shadow-md animate-phone-vibrate"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .65 2.73 2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.73.65A2 2 0 0 1 22 16.92z" />
            </svg>

            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1 text-sm bg-gradient-to-r from-[#FF4D4D] to-[#FF9900] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-md whitespace-nowrap">
              Gọi ngay 0394 200 962
            </span>
          </a>
        </div>
      <PublicFooter />
    </div>
  )
}
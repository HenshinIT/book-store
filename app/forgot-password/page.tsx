'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicHeaderClient from '@/components/PublicHeaderClient'
import PublicFooter from '@/components/PublicFooter'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Có lỗi xảy ra')
      } else {
        setSuccess(true)
        setResetLink(data.resetLink)
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-blue-200">
      <PublicHeaderClient />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Quên mật khẩu
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Nhập email của bạn để nhận link đặt lại mật khẩu
            </p>
          </div>

          {!success ? (
            <form
              className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow-xl transition-transform transform hover:scale-105"
              onSubmit={handleSubmit}
            >
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
                  {loading ? 'Đang xử lý...' : 'Gửi link đặt lại mật khẩu'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow-xl animate-fadeIn">
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800 mb-4">
                  Link đặt lại mật khẩu đã được tạo thành công!
                </p>
                <div className="bg-white p-4 rounded border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Link đặt lại mật khẩu (sao chép link này):</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={resetLink}
                      className="flex-1 text-xs p-2 border border-gray-300 rounded bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(resetLink)
                        alert('Đã sao chép link!')
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Link này chỉ có hiệu lực trong 1 giờ. Trong môi trường production, link sẽ được gửi qua email.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <PublicFooter />

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

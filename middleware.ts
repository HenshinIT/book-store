import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/jwt'
import { canAccessCMS } from './lib/permissions'
import type { UserRole } from '@prisma/client'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null

  // Block access to login/register if already logged in
  if ((pathname === '/login' || pathname === '/register') && payload) {
    // Redirect based on role
    if (payload.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/cms/dashboard', request.url))
    }
  }

  // Public routes (allow access even if logged in)
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/public') ||
    pathname === '/dashboard' ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Allow login/register only if not logged in
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  // Protect CMS routes
  if (pathname.startsWith('/cms')) {
    const allCookies = request.cookies.getAll()
    const tokenCookie = request.cookies.get('token')
    const token = tokenCookie?.value

    // Log chi tiết hơn cho ADMIN
    const isAdminRoute = pathname.includes('/cms') && token
    
    if (isAdminRoute && token) {
      // Quick check để xem có phải ADMIN token không
      try {
        const tempPayload = verifyToken(token)
        if (tempPayload?.role === 'ADMIN') {
          console.log('🔐 ADMIN ACCESS CHECK:', {
            pathname,
            hasTokenCookie: !!tokenCookie,
            tokenLength: token?.length || 0,
            allCookiesCount: allCookies.length,
            allCookieNames: allCookies.map(c => c.name),
            tokenPreview: token.substring(0, 30) + '...',
          })
        }
      } catch (e) {
        // Ignore
      }
    } else {
      console.log('CMS route check:', {
        pathname,
        hasTokenCookie: !!tokenCookie,
        tokenLength: token?.length || 0,
        allCookiesCount: allCookies.length,
        allCookieNames: allCookies.map(c => c.name),
      })
    }

    if (!token) {
      console.log('CMS access denied: No token found in cookies')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('CMS access denied: Invalid token')
      console.log('Token details:', {
        length: token.length,
        preview: token.substring(0, 50) + '...',
        lastChars: token.substring(token.length - 20),
      })
      
      // KIÊNG XÓA COOKIE - để tránh redirect loop và timing issues
      // Cookie sẽ được xóa bởi logout API hoặc khi hết hạn tự động
      // Chỉ redirect về login, không xóa cookie để tránh loop
      console.log('⚠️ Invalid token - redirecting to login (NOT deleting cookie to avoid loop)')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Log đặc biệt cho ADMIN
    if (payload.role === 'ADMIN') {
      console.log('🔐 ✅ ADMIN CMS ACCESS GRANTED:', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      })
    } else {
      console.log('✅ CMS access granted:', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      })
    }

    if (!canAccessCMS(payload.role as UserRole)) {
      console.log('CMS access denied: Insufficient role', payload.role)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    console.log('CMS access granted:', payload.email, payload.role)
    // Add user info to headers for server components
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-role', payload.role)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/cms/:path*',
    '/api/books/:path*',
    '/api/users/:path*',
    '/login',
    '/register',
    '/dashboard',
  ],
  runtime: 'nodejs', // Use Node.js runtime instead of Edge Runtime to support jsonwebtoken
}

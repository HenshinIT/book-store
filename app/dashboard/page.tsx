import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Nếu là khách hàng (CUSTOMER) → đẩy về trang chủ
  if (user.role === 'CUSTOMER') {
    redirect('/')
  }

  // Nếu là STAFF, MANAGER, ADMIN → vào CMS
  redirect('/cms')
}

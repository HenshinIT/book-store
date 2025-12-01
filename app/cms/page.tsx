import { redirect } from 'next/navigation'

export default async function CMSPage() {
  // Redirect /cms to /cms/dashboard
  redirect('/cms/dashboard')
}


import { redirect } from 'next/navigation'
import { AccountPageClient } from '@/components/AccountPageClient'
import { createClient } from '@/lib/supabase/server'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  const user = data.user

  return <AccountPageClient user={user} />
}
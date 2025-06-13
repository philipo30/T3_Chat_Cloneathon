import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  const user = data.user

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div
        className="absolute inset-0 z-[-1]"
        style={{
          background: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
        }}
      />
      <div className="absolute inset-0 z-[-1] noise-bg" />
      <div className="absolute inset-0 z-[-1] bg-black/40" />
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="ghost" className="text-[rgb(212,199,225)] bg-transparent hover:bg-[rgb(212,199,221)]/10 hover:text-[rgb(212,199,221)]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>
      <Card className="w-full max-w-md border-0 bg-[rgb(31,26,36)]/80 text-[rgb(231,208,221)] backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
              <AvatarFallback>{user.user_metadata.full_name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <CardTitle className="text-2xl">{user.user_metadata.full_name}</CardTitle>
              <CardDescription className="text-[rgb(231,208,221)]/80">{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between rounded-lg border border-[rgb(50,32,40)] bg-[rgb(19,19,20)]/50 p-4">
            <div>
              <p className="text-sm font-medium">You are logged in.</p>
              <p className="text-sm text-[rgb(231,208,221)]/80">You can now access all features.</p>
            </div>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
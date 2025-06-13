import { LoginForm } from '@/components/login-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
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
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

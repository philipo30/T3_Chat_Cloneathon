"use client"

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useState } from 'react'
import { ChadLLMLogo } from './ChadLLMLogo'
import { Github } from 'lucide-react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col', className)} {...props}>
      <Card className="w-full max-w-md border-0 bg-login-form-background backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-32 self-center">
            <ChadLLMLogo />
          </div>
          <CardTitle className="text-2xl text-login-form-title-text">Welcome back!</CardTitle>
          <CardDescription className="text-login-form-description-text">
            Sign in to your account to continue your conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSocialLogin}>
            <div className="flex flex-col gap-4">
              {error && <p className="text-sm text-login-form-error-text text-center">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-b from-primary-button-gradient-from to-primary-button-gradient-to hover:from-primary-button-hover-gradient-from hover:to-primary-button-hover-gradient-to text-primary-button-text font-semibold text-sm border border-primary-button-border rounded-lg shadow-sm transition-colors duration-150"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Logging in...'
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Continue with Github
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

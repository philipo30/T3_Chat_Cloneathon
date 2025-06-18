import './globals.css'
import 'katex/dist/katex.min.css'
import '@/lib/console-suppression'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from './providers'

const metropolis = localFont({
  src: [
    {
      path: '../../public/fonts/Metropolis-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Metropolis-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-metropolis',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'T3 Chat Cloneathon',
  description: 'A chat application powered by OpenRouter and T3 Stack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={metropolis.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
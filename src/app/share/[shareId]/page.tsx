import { Suspense } from 'react'
import { SharedChatView } from '@/components/SharedChatView'
import { SharedChatSkeleton } from '@/components/SharedChatSkeleton'

interface SharedChatPageProps {
  params: Promise<{
    shareId: string
  }>
}

export default async function SharedChatPage({ params }: SharedChatPageProps) {
  const { shareId } = await params
  return (
    <div className="min-h-screen w-full text-white font-feature-settings-normal font-variant-normal font-variant-numeric-normal letter-spacing-normal outline-white text-decoration-white text-emphasis-white view-transition-name-root overflow-hidden">
      {/* Main background layers */}
      <div className="fixed inset-0 bg-app-page-background z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(closest-corner at 120px 36px, rgba(var(--app-page-gradient-start), 0.19), rgba(var(--app-page-gradient-start), 0.08)), linear-gradient(rgb(var(--app-page-gradient-mid)) 15%, rgb(var(--app-page-gradient-end)))`,
          }}
        />
        <div className="absolute inset-0 noise-bg" />
        <div className="absolute inset-0 bg-app-page-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Suspense fallback={<SharedChatSkeleton />}>
          <SharedChatView shareId={shareId} />
        </Suspense>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: SharedChatPageProps) {
  const { shareId } = await params
  // You could fetch the shared chat title here for better SEO
  return {
    title: 'Shared Chat - T3 Chat Cloneathon',
    description: 'View a shared chat conversation',
  }
}

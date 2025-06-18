import { useEffect, useRef, useCallback } from 'react'
import { useAutoScroll } from './useAutoScroll'

interface UseChatAutoScrollOptions {
  /**
   * Array of messages to monitor for changes
   */
  messages: any[]
  /**
   * Whether AI is currently streaming
   */
  isStreaming?: boolean
  /**
   * Whether user is currently loading/sending a message
   */
  isLoading?: boolean
  /**
   * Threshold in pixels from bottom to consider "at bottom"
   */
  threshold?: number
  /**
   * Whether auto-scroll is enabled
   */
  enabled?: boolean
}

interface UseChatAutoScrollReturn {
  /**
   * Ref to attach to the scrollable container
   */
  scrollRef: React.RefObject<HTMLDivElement>
  /**
   * Whether the user is currently at the bottom
   */
  isAtBottom: boolean
  /**
   * Whether the user has manually scrolled up
   */
  hasUserScrolled: boolean
  /**
   * Whether to show the scroll to bottom button
   */
  showScrollButton: boolean
  /**
   * Manually scroll to bottom
   */
  scrollToBottom: () => void
  /**
   * Call this when user sends a new message
   */
  onMessageSent: () => void
}

/**
 * Chat-specific auto-scroll hook that handles:
 * - Auto-scroll when user sends message
 * - Auto-scroll during AI streaming ONLY if user is at bottom
 * - Respects user's manual scroll position
 * - Conservative approach to prevent forced scrolling
 */
export function useChatAutoScroll(options: UseChatAutoScrollOptions): UseChatAutoScrollReturn {
  const {
    messages,
    isStreaming = false,
    isLoading = false,
    threshold = 30, // Very small threshold for precise "at bottom" detection
    enabled = true
  } = options

  const {
    scrollRef,
    isAtBottom,
    hasUserScrolled,
    scrollToBottom,
    resetUserScroll
  } = useAutoScroll({ threshold, enabled, smooth: true })

  const prevMessagesLength = useRef(messages.length)
  const lastMessageContent = useRef('')
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrollingRef = useRef(false)

  // Show scroll button when user is not at bottom (regardless of how they got there)
  const showScrollButton = !isAtBottom

  // Debounced scroll function to prevent excessive scrolling
  const debouncedScrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (isAtBottom && !isUserScrollingRef.current) {
        scrollToBottom()
      }
    }, 100)
  }, [isAtBottom, scrollToBottom])

  // Track user scrolling to prevent auto-scroll during manual scrolling
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      isUserScrollingRef.current = true
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isUserScrollingRef.current = false
      }, 150)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [scrollRef])

  // Handle new messages - only for user messages or when at bottom
  useEffect(() => {
    if (!enabled) return

    const currentLength = messages.length
    const prevLength = prevMessagesLength.current

    // New message added
    if (currentLength > prevLength) {
      const newMessage = messages[currentLength - 1]

      // If it's a user message, always scroll to bottom
      if (newMessage?.role === 'user') {
        resetUserScroll()
        isUserScrollingRef.current = false
        setTimeout(() => {
          scrollToBottom()
        }, 50)
      }
      // If it's an AI message and user is at bottom, scroll
      else if (newMessage?.role === 'assistant' && isAtBottom && !isUserScrollingRef.current) {
        setTimeout(() => {
          scrollToBottom()
        }, 50)
      }
    }

    prevMessagesLength.current = currentLength
  }, [messages.length, isAtBottom, scrollToBottom, resetUserScroll, enabled])

  // Handle streaming content updates - VERY conservative approach
  useEffect(() => {
    if (!enabled || !isStreaming) return

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'assistant') return

    const currentContent = lastMessage.content || ''

    // Only auto-scroll during streaming if:
    // 1. User is at bottom
    // 2. User is not currently scrolling
    // 3. Content actually changed
    if (isAtBottom && !isUserScrollingRef.current && currentContent !== lastMessageContent.current) {
      debouncedScrollToBottom()
    }

    lastMessageContent.current = currentContent
  }, [messages, isStreaming, isAtBottom, debouncedScrollToBottom, enabled])

  // Handle loading state (when user sends message)
  useEffect(() => {
    if (isLoading) {
      resetUserScroll()
      isUserScrollingRef.current = false
      setTimeout(() => {
        scrollToBottom()
      }, 50)
    }
  }, [isLoading, scrollToBottom, resetUserScroll])

  const onMessageSent = useCallback(() => {
    resetUserScroll()
    isUserScrollingRef.current = false
    setTimeout(() => {
      scrollToBottom()
    }, 50)
  }, [resetUserScroll, scrollToBottom])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    scrollRef,
    isAtBottom,
    hasUserScrolled,
    showScrollButton,
    scrollToBottom,
    onMessageSent
  }
}

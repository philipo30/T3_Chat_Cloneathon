import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoScrollOptions {
  /**
   * Threshold in pixels from bottom to consider "at bottom"
   * Default: 100
   */
  threshold?: number
  /**
   * Whether auto-scroll is enabled
   * Default: true
   */
  enabled?: boolean
  /**
   * Smooth scroll behavior
   * Default: true
   */
  smooth?: boolean
}

interface UseAutoScrollReturn {
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
   * Manually scroll to bottom
   */
  scrollToBottom: () => void
  /**
   * Reset the user scroll state (call when new message is sent)
   */
  resetUserScroll: () => void
}

/**
 * Custom hook for managing auto-scroll behavior in chat interfaces
 * 
 * Features:
 * - Automatically scrolls to bottom when user sends message or AI is streaming
 * - Respects user's scroll position - doesn't force scroll if user scrolled up
 * - Provides utilities for manual scroll control
 * - Smooth scrolling with configurable threshold
 */
export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const {
    threshold = 30, // Smaller default threshold
    enabled = true,
    smooth = true
  } = options

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasUserScrolled, setHasUserScrolled] = useState(false)
  const lastScrollTop = useRef(0)
  const isScrollingProgrammatically = useRef(false)

  // Check if user is at bottom of scroll area
  const checkIfAtBottom = useCallback(() => {
    const element = scrollRef.current
    if (!element) return false

    const { scrollTop, scrollHeight, clientHeight } = element
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= threshold
  }, [threshold])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current
    if (!element || !enabled) return

    isScrollingProgrammatically.current = true
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant'
    })

    // Reset programmatic scroll flag after animation
    setTimeout(() => {
      isScrollingProgrammatically.current = false
    }, smooth ? 300 : 0)
  }, [enabled, smooth])

  // Reset user scroll state
  const resetUserScroll = useCallback(() => {
    setHasUserScrolled(false)
    setIsAtBottom(true)
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const element = scrollRef.current
    if (!element || !enabled) return

    // Skip if we're scrolling programmatically
    if (isScrollingProgrammatically.current) return

    const { scrollTop } = element
    const atBottom = checkIfAtBottom()
    
    setIsAtBottom(atBottom)

    // Detect if user scrolled up manually
    if (scrollTop < lastScrollTop.current && !atBottom) {
      setHasUserScrolled(true)
    } else if (atBottom) {
      // User scrolled back to bottom, reset the flag
      setHasUserScrolled(false)
    }

    lastScrollTop.current = scrollTop
  }, [enabled, checkIfAtBottom])

  // Attach scroll listener
  useEffect(() => {
    const element = scrollRef.current
    if (!element || !enabled) return

    element.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, enabled])

  return {
    scrollRef,
    isAtBottom,
    hasUserScrolled,
    scrollToBottom,
    resetUserScroll
  }
}

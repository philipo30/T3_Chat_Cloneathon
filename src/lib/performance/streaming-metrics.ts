/**
 * Performance monitoring utilities for streaming optimization
 * Tracks key metrics to help identify bottlenecks and measure improvements
 */

interface StreamingMetrics {
  messageId: string
  startTime: number
  firstChunkTime?: number
  lastChunkTime?: number
  totalChunks: number
  totalCharacters: number
  dbWrites: number
  renderCount: number
  averageChunkSize: number
  timeToFirstChunk?: number
  totalStreamTime?: number
  chunksPerSecond?: number
}

class StreamingPerformanceMonitor {
  private metrics = new Map<string, StreamingMetrics>()
  private isEnabled = process.env.NODE_ENV === 'development'

  startTracking(messageId: string): void {
    if (!this.isEnabled) return

    this.metrics.set(messageId, {
      messageId,
      startTime: performance.now(),
      totalChunks: 0,
      totalCharacters: 0,
      dbWrites: 0,
      renderCount: 0,
      averageChunkSize: 0
    })
  }

  recordChunk(messageId: string, chunkSize: number): void {
    if (!this.isEnabled) return

    const metric = this.metrics.get(messageId)
    if (!metric) return

    const now = performance.now()
    
    if (!metric.firstChunkTime) {
      metric.firstChunkTime = now
      metric.timeToFirstChunk = now - metric.startTime
    }
    
    metric.lastChunkTime = now
    metric.totalChunks++
    metric.totalCharacters += chunkSize
    metric.averageChunkSize = metric.totalCharacters / metric.totalChunks
  }

  recordDbWrite(messageId: string): void {
    if (!this.isEnabled) return

    const metric = this.metrics.get(messageId)
    if (metric) {
      metric.dbWrites++
    }
  }

  recordRender(messageId: string): void {
    if (!this.isEnabled) return

    const metric = this.metrics.get(messageId)
    if (metric) {
      metric.renderCount++
    }
  }

  finishTracking(messageId: string): StreamingMetrics | null {
    if (!this.isEnabled) return null

    const metric = this.metrics.get(messageId)
    if (!metric) return null

    const now = performance.now()
    metric.totalStreamTime = now - metric.startTime
    
    if (metric.totalStreamTime > 0) {
      metric.chunksPerSecond = (metric.totalChunks / metric.totalStreamTime) * 1000
    }

    // Log performance summary
    console.group(`🚀 Streaming Performance - ${messageId.slice(0, 8)}`)
    console.log(`⏱️  Time to first chunk: ${metric.timeToFirstChunk?.toFixed(2)}ms`)
    console.log(`⏱️  Total stream time: ${metric.totalStreamTime.toFixed(2)}ms`)
    console.log(`📦 Total chunks: ${metric.totalChunks}`)
    console.log(`📝 Total characters: ${metric.totalCharacters}`)
    console.log(`📊 Average chunk size: ${metric.averageChunkSize.toFixed(1)} chars`)
    console.log(`⚡ Chunks per second: ${metric.chunksPerSecond?.toFixed(1)}`)
    console.log(`💾 Database writes: ${metric.dbWrites}`)
    console.log(`🎨 UI renders: ${metric.renderCount}`)
    console.log(`📈 Efficiency ratio: ${(metric.totalChunks / metric.dbWrites).toFixed(1)} chunks/write`)
    console.groupEnd()

    // Clean up
    this.metrics.delete(messageId)
    
    return metric
  }

  getMetrics(messageId: string): StreamingMetrics | undefined {
    return this.metrics.get(messageId)
  }

  getAllMetrics(): StreamingMetrics[] {
    return Array.from(this.metrics.values())
  }

  clear(): void {
    this.metrics.clear()
  }
}

// Export singleton instance
export const streamingMonitor = new StreamingPerformanceMonitor()

// Helper function to measure function execution time
export function measureAsync<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return fn()
  }

  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`)
  })
}

// Helper to measure sync function execution
export function measure<T>(fn: () => T, label: string): T {
  if (process.env.NODE_ENV !== 'development') {
    return fn()
  }

  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`)
  return result
}

// Performance thresholds for warnings
export const PERFORMANCE_THRESHOLDS = {
  TIME_TO_FIRST_CHUNK: 1000, // 1 second
  CHUNK_PROCESSING_TIME: 50, // 50ms per chunk
  DB_WRITE_FREQUENCY: 5, // Max 1 write per 5 chunks
  RENDER_FREQUENCY: 3, // Max 1 render per 3 chunks
} as const

// Check if metrics meet performance standards
export function validatePerformance(metrics: StreamingMetrics): {
  isOptimal: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (metrics.timeToFirstChunk && metrics.timeToFirstChunk > PERFORMANCE_THRESHOLDS.TIME_TO_FIRST_CHUNK) {
    warnings.push(`Slow first chunk: ${metrics.timeToFirstChunk.toFixed(0)}ms (target: <${PERFORMANCE_THRESHOLDS.TIME_TO_FIRST_CHUNK}ms)`)
  }

  const chunksPerWrite = metrics.totalChunks / metrics.dbWrites
  if (chunksPerWrite < PERFORMANCE_THRESHOLDS.DB_WRITE_FREQUENCY) {
    warnings.push(`Too frequent DB writes: ${chunksPerWrite.toFixed(1)} chunks/write (target: >${PERFORMANCE_THRESHOLDS.DB_WRITE_FREQUENCY})`)
  }

  const chunksPerRender = metrics.totalChunks / metrics.renderCount
  if (chunksPerRender < PERFORMANCE_THRESHOLDS.RENDER_FREQUENCY) {
    warnings.push(`Too frequent renders: ${chunksPerRender.toFixed(1)} chunks/render (target: >${PERFORMANCE_THRESHOLDS.RENDER_FREQUENCY})`)
  }

  return {
    isOptimal: warnings.length === 0,
    warnings
  }
}

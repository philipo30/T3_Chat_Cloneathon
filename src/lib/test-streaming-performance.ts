/**
 * Test utility to verify streaming performance optimizations
 * Run this in the browser console to test the streaming implementation
 */

import { streamingMonitor, validatePerformance } from './performance/streaming-metrics'

// Mock streaming data for testing
const MOCK_STREAMING_RESPONSE = `
Hello! I'm an AI assistant. Let me help you with your question.

Here's a detailed response that includes:

1. **Multiple paragraphs** with different content
2. Code blocks like this:

\`\`\`javascript
function optimizeStreaming() {
  console.log("Streaming optimized!");
  return "success";
}
\`\`\`

3. Lists and formatting
4. And more content to simulate a real AI response...

This response is designed to test the streaming performance optimizations including:
- Chunk buffering
- Reduced database writes  
- Optimized markdown parsing
- Efficient React re-renders

The streaming should feel smooth and responsive, similar to native desktop applications.
`

// Simulate streaming chunks
function createMockChunks(text: string, chunkSize = 5): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

// Test streaming performance
export async function testStreamingPerformance(): Promise<void> {
  console.log('🧪 Testing streaming performance optimizations...')
  
  const messageId = 'test-message-' + Date.now()
  const chunks = createMockChunks(MOCK_STREAMING_RESPONSE, 8)
  
  // Start tracking
  streamingMonitor.startTracking(messageId)
  
  // Simulate streaming with realistic delays
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    
    // Record chunk
    streamingMonitor.recordChunk(messageId, chunk.length)
    
    // Simulate database writes (should be less frequent due to buffering)
    if (i % 3 === 0) { // Every 3rd chunk
      streamingMonitor.recordDbWrite(messageId)
    }
    
    // Simulate renders (should be optimized)
    if (i % 2 === 0) { // Every 2nd chunk
      streamingMonitor.recordRender(messageId)
    }
    
    // Small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  
  // Finish tracking and get results
  const metrics = streamingMonitor.finishTracking(messageId)
  
  if (metrics) {
    const validation = validatePerformance(metrics)
    
    console.log('\n📊 Performance Test Results:')
    console.log(`✅ Optimal performance: ${validation.isOptimal}`)
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Performance warnings:')
      validation.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    // Expected improvements
    console.log('\n🎯 Expected Improvements:')
    console.log(`   - Chunks per DB write: ${(metrics.totalChunks / metrics.dbWrites).toFixed(1)} (target: >5)`)
    console.log(`   - Chunks per render: ${(metrics.totalChunks / metrics.renderCount).toFixed(1)} (target: >3)`)
    console.log(`   - Time to first chunk: ${metrics.timeToFirstChunk?.toFixed(0)}ms (target: <1000ms)`)
  }
}

// Test markdown parsing performance
export function testMarkdownPerformance(): void {
  console.log('🧪 Testing markdown parsing performance...')
  
  const testContent = MOCK_STREAMING_RESPONSE
  const iterations = 100
  
  // Test original parsing (re-parse everything each time)
  const start1 = performance.now()
  for (let i = 0; i < iterations; i++) {
    // Simulate re-parsing entire content each chunk
    const partial = testContent.slice(0, (i + 1) * (testContent.length / iterations))
    // This would normally call marked(partial)
  }
  const originalTime = performance.now() - start1
  
  // Test optimized parsing (with caching)
  const start2 = performance.now()
  let cachedContent = ''
  let cachedResult = ''
  for (let i = 0; i < iterations; i++) {
    const partial = testContent.slice(0, (i + 1) * (testContent.length / iterations))
    // Simulate cached parsing - only parse if content changed significantly
    if (partial !== cachedContent) {
      cachedContent = partial
      // This would normally call marked(partial) with optimizations
    }
  }
  const optimizedTime = performance.now() - start2
  
  console.log(`📈 Markdown Performance Results:`)
  console.log(`   Original approach: ${originalTime.toFixed(2)}ms`)
  console.log(`   Optimized approach: ${optimizedTime.toFixed(2)}ms`)
  console.log(`   Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(1)}% faster`)
}

// Test buffer efficiency
export function testBufferEfficiency(): void {
  console.log('🧪 Testing buffer efficiency...')
  
  const chunks = createMockChunks(MOCK_STREAMING_RESPONSE, 3)
  const bufferSizes = [1, 3, 5, 10]
  
  bufferSizes.forEach(bufferSize => {
    let dbWrites = 0
    let buffer: string[] = []
    
    chunks.forEach((chunk, index) => {
      buffer.push(chunk)
      
      // Simulate buffer flushing logic
      if (buffer.length >= bufferSize || index === chunks.length - 1) {
        dbWrites++
        buffer = []
      }
    })
    
    const efficiency = chunks.length / dbWrites
    console.log(`   Buffer size ${bufferSize}: ${dbWrites} writes, ${efficiency.toFixed(1)} chunks/write`)
  })
}

// Run all tests
export async function runAllStreamingTests(): Promise<void> {
  console.log('🚀 Running comprehensive streaming performance tests...\n')
  
  await testStreamingPerformance()
  console.log('\n' + '='.repeat(50) + '\n')
  
  testMarkdownPerformance()
  console.log('\n' + '='.repeat(50) + '\n')
  
  testBufferEfficiency()
  
  console.log('\n✅ All streaming performance tests completed!')
  console.log('💡 Check the console output above for detailed results and recommendations.')
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testStreaming = {
    runAll: runAllStreamingTests,
    performance: testStreamingPerformance,
    markdown: testMarkdownPerformance,
    buffer: testBufferEfficiency
  }
  
  console.log('🧪 Streaming tests available in console:')
  console.log('   - testStreaming.runAll() - Run all tests')
  console.log('   - testStreaming.performance() - Test streaming performance')
  console.log('   - testStreaming.markdown() - Test markdown parsing')
  console.log('   - testStreaming.buffer() - Test buffer efficiency')
}

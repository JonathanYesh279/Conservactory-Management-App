#!/usr/bin/env node

/**
 * Performance monitoring script for cascade deletion system
 * Tracks bundle sizes, render performance, and deletion operation metrics
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// Performance thresholds
const THRESHOLDS = {
  cascadeDeletionBundleSize: 200 * 1024, // 200KB
  totalBundleSize: 2 * 1024 * 1024, // 2MB
  componentRenderTime: 100, // 100ms
  deletionOperationTime: 30000, // 30 seconds
  memoryUsage: 100 * 1024 * 1024, // 100MB
}

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      bundleSizes: {},
      renderTimes: {},
      deletionMetrics: {},
      memoryUsage: {},
      timestamp: new Date().toISOString()
    }
  }

  async analyzeBundleSizes() {
    console.log('📊 Analyzing bundle sizes...')
    
    try {
      const distPath = path.join(projectRoot, 'dist')
      const statsPath = path.join(distPath, 'stats.json')
      
      // Check if build output exists
      const distExists = await fs.access(distPath).then(() => true).catch(() => false)
      if (!distExists) {
        console.warn('⚠️  Dist folder not found. Run "npm run build" first.')
        return
      }

      // Analyze bundle files
      const files = await fs.readdir(distPath, { withFileTypes: true })
      let cascadeSize = 0
      let totalSize = 0

      for (const file of files) {
        if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.css'))) {
          const filePath = path.join(distPath, file.name)
          const stats = await fs.stat(filePath)
          const size = stats.size

          totalSize += size

          if (file.name.includes('cascade') || file.name.includes('deletion')) {
            cascadeSize += size
            console.log(`  📁 ${file.name}: ${this.formatBytes(size)}`)
          }
        }
      }

      this.metrics.bundleSizes = {
        cascadeDeletionSize: cascadeSize,
        totalSize,
        cascadeSizeHuman: this.formatBytes(cascadeSize),
        totalSizeHuman: this.formatBytes(totalSize)
      }

      // Check thresholds
      const cascadeExceeded = cascadeSize > THRESHOLDS.cascadeDeletionBundleSize
      const totalExceeded = totalSize > THRESHOLDS.totalBundleSize

      console.log(`\n📊 Bundle Size Analysis:`)
      console.log(`  🎯 Cascade Deletion: ${this.formatBytes(cascadeSize)} ${cascadeExceeded ? '❌ EXCEEDS LIMIT' : '✅'}`)
      console.log(`  📦 Total Bundle: ${this.formatBytes(totalSize)} ${totalExceeded ? '❌ EXCEEDS LIMIT' : '✅'}`)

      if (cascadeExceeded || totalExceeded) {
        console.log('\n💡 Optimization suggestions:')
        if (cascadeExceeded) {
          console.log('  - Consider lazy loading cascade deletion components')
          console.log('  - Remove unused cascade deletion utilities')
          console.log('  - Optimize WebSocket client bundle size')
        }
        if (totalExceeded) {
          console.log('  - Enable tree shaking for unused dependencies')
          console.log('  - Split vendor chunks more aggressively')
          console.log('  - Consider dynamic imports for admin features')
        }
      }

    } catch (error) {
      console.error('❌ Error analyzing bundle sizes:', error.message)
    }
  }

  async monitorRuntimePerformance() {
    console.log('\n⚡ Runtime Performance Monitoring Setup...')
    
    const performanceScript = `
// Cascade deletion performance monitoring
window.cascadePerformanceMonitor = {
  // Track component render times
  trackRender: (componentName, startTime) => {
    const endTime = performance.now()
    const duration = endTime - startTime
    console.log(\`🎭 \${componentName} render time: \${duration.toFixed(2)}ms\`)
    
    if (duration > ${THRESHOLDS.componentRenderTime}) {
      console.warn(\`⚠️  Slow render detected for \${componentName}\`)
    }
  },
  
  // Track deletion operation performance
  trackDeletionOperation: async (operationType, operationFn) => {
    const startTime = performance.now()
    const startMemory = performance.memory?.usedJSHeapSize || 0
    
    try {
      const result = await operationFn()
      const endTime = performance.now()
      const endMemory = performance.memory?.usedJSHeapSize || 0
      
      const duration = endTime - startTime
      const memoryDelta = endMemory - startMemory
      
      console.log(\`🗑️ \${operationType} completed in \${duration.toFixed(2)}ms\`)
      console.log(\`💾 Memory delta: \${(memoryDelta / 1024 / 1024).toFixed(2)}MB\`)
      
      // Send to analytics if enabled
      if (window.gtag) {
        window.gtag('event', 'cascade_deletion_performance', {
          operation_type: operationType,
          duration: Math.round(duration),
          memory_delta: Math.round(memoryDelta / 1024)
        })
      }
      
      return result
    } catch (error) {
      console.error(\`❌ \${operationType} failed:, error\`)
      throw error
    }
  },
  
  // Memory monitoring
  checkMemoryUsage: () => {
    if (!performance.memory) return
    
    const used = performance.memory.usedJSHeapSize
    const limit = performance.memory.jsHeapSizeLimit
    const percentage = (used / limit) * 100
    
    console.log(\`💾 Memory usage: \${(used / 1024 / 1024).toFixed(2)}MB (\${percentage.toFixed(1)}%)\`)
    
    if (used > ${THRESHOLDS.memoryUsage}) {
      console.warn('⚠️  High memory usage detected')
    }
  }
}

// Auto-monitor memory every 30 seconds during deletion operations
setInterval(() => {
  if (window.cascadeOperationInProgress) {
    window.cascadePerformanceMonitor.checkMemoryUsage()
  }
}, 30000)
`

    // Write performance monitoring script
    const performanceScriptPath = path.join(projectRoot, 'public', 'cascade-performance-monitor.js')
    await fs.writeFile(performanceScriptPath, performanceScript)
    
    console.log('✅ Performance monitoring script generated at public/cascade-performance-monitor.js')
    console.log('   Include this script in your HTML to enable runtime monitoring')
  }

  async generateReport() {
    console.log('\n📋 Generating Performance Report...')
    
    const reportPath = path.join(projectRoot, 'performance-report.json')
    await fs.writeFile(reportPath, JSON.stringify(this.metrics, null, 2))
    
    console.log(`✅ Performance report saved to: ${reportPath}`)
    
    // Generate human-readable summary
    const summaryPath = path.join(projectRoot, 'PERFORMANCE_SUMMARY.md')
    const summary = this.generateMarkdownSummary()
    await fs.writeFile(summaryPath, summary)
    
    console.log(`📝 Performance summary saved to: ${summaryPath}`)
  }

  generateMarkdownSummary() {
    const { bundleSizes } = this.metrics
    
    return `# Cascade Deletion Performance Report

Generated: ${this.metrics.timestamp}

## Bundle Size Analysis

| Component | Size | Status |
|-----------|------|---------|
| Cascade Deletion | ${bundleSizes.cascadeSizeHuman || 'N/A'} | ${bundleSizes.cascadeDeletionSize > THRESHOLDS.cascadeDeletionBundleSize ? '❌ Exceeds limit' : '✅ Within limits'} |
| Total Bundle | ${bundleSizes.totalSizeHuman || 'N/A'} | ${bundleSizes.totalSize > THRESHOLDS.totalBundleSize ? '❌ Exceeds limit' : '✅ Within limits'} |

## Performance Thresholds

- Cascade Deletion Bundle: ${this.formatBytes(THRESHOLDS.cascadeDeletionBundleSize)}
- Total Bundle Size: ${this.formatBytes(THRESHOLDS.totalBundleSize)}
- Component Render Time: ${THRESHOLDS.componentRenderTime}ms
- Deletion Operation Timeout: ${THRESHOLDS.deletionOperationTime}ms
- Memory Usage Warning: ${this.formatBytes(THRESHOLDS.memoryUsage)}

## Monitoring Setup

1. Include \`public/cascade-performance-monitor.js\` in your HTML
2. Use \`window.cascadePerformanceMonitor.trackRender()\` for component monitoring
3. Use \`window.cascadePerformanceMonitor.trackDeletionOperation()\` for operation monitoring
4. Monitor memory with \`window.cascadePerformanceMonitor.checkMemoryUsage()\`

## Optimization Recommendations

${bundleSizes.cascadeDeletionSize > THRESHOLDS.cascadeDeletionBundleSize ? '- **Cascade deletion bundle is too large**: Consider lazy loading and code splitting\n' : ''}
${bundleSizes.totalSize > THRESHOLDS.totalBundleSize ? '- **Total bundle is too large**: Enable aggressive tree shaking and vendor splitting\n' : ''}
- Implement service worker caching for cascade deletion assets
- Use React.memo() for expensive cascade deletion components
- Consider virtualization for large deletion impact lists
`
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Run monitoring
async function main() {
  console.log('🚀 Cascade Deletion Performance Monitor\n')
  
  const monitor = new PerformanceMonitor()
  
  await monitor.analyzeBundleSizes()
  await monitor.monitorRuntimePerformance()
  await monitor.generateReport()
  
  console.log('\n✅ Performance monitoring complete!')
  console.log('📊 Run this script after builds to track performance over time')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default PerformanceMonitor
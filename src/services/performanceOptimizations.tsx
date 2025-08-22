/**
 * Performance Optimization Utilities
 * 
 * Provides suspense components, loading states, and performance monitoring
 */

import React, { Suspense, memo, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Smart loading states with skeleton components
export interface LoadingStateProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  minHeight?: string
}

export function SmartLoadingState({ 
  isLoading, 
  children, 
  skeleton,
  minHeight = '200px' 
}: LoadingStateProps) {
  const [showSkeleton, setShowSkeleton] = useState(false)
  
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isLoading) {
      timer = setTimeout(() => setShowSkeleton(true), 150)
    } else {
      setShowSkeleton(false)
    }
    
    return () => clearTimeout(timer)
  }, [isLoading])
  
  if (isLoading && showSkeleton) {
    return (
      <div style={{ minHeight }}>
        {skeleton || <DefaultSkeleton />}
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div style={{ minHeight }} className="flex items-center justify-center">
        <div className="animate-pulse text-gray-400">טוען...</div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Default skeleton component
function DefaultSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

// Specific skeletons for different content types
export const SkeletonComponents = {
  StudentHeader: () => (
    <div className="flex items-start gap-6 p-6 animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  ),
  
  TabContent: () => (
    <div className="p-6 space-y-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  ),
  
  DocumentsList: () => (
    <div className="space-y-4 p-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded">
          <div className="w-10 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  ),
  
  Schedule: () => (
    <div className="grid grid-cols-7 gap-4 p-4 animate-pulse">
      {Array.from({ length: 21 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  )
}

// Placeholder lazy components for tabs that may not exist yet
const PlaceholderTab = ({ name }: { name: string }) => (
  <div className="p-6 text-center text-gray-500">
    {name} - טרם פותח
  </div>
)

export const LazyTabComponents = {
  PersonalInfoTab: () => <PlaceholderTab name="פרטים אישיים" />,
  AcademicInfoTab: () => <PlaceholderTab name="פרטים אקדמיים" />,
  ScheduleTab: () => <PlaceholderTab name="לוח זמנים" />,
  AttendanceTab: () => <PlaceholderTab name="נוכחות" />,
  OrchestraTab: () => <PlaceholderTab name="תזמורות" />,
  TheoryTab: () => <PlaceholderTab name="תיאוריה" />,
  DocumentsTab: () => <PlaceholderTab name="מסמכים" />,
}

// Suspense wrapper for data fetching
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const SuspenseComponent = (props: P) => (
    <Suspense fallback={fallback || <DefaultSkeleton />}>
      <Component {...props} />
    </Suspense>
  )
  
  SuspenseComponent.displayName = `withSuspense(${Component.displayName || Component.name})`
  return SuspenseComponent
}

// Memoized component wrapper
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, areEqual)
}

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private readonly maxMetrics = 100

  startTiming(key: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      this.recordMetric(key, duration)
    }
  }

  private recordMetric(key: string, value: number) {
    let metrics = this.metrics.get(key) || []
    metrics.push(value)
    
    if (metrics.length > this.maxMetrics) {
      metrics = metrics.slice(-this.maxMetrics)
    }
    
    this.metrics.set(key, metrics)
  }

  getStats(key: string) {
    const metrics = this.metrics.get(key) || []
    if (metrics.length === 0) return null
    
    const sum = metrics.reduce((a, b) => a + b, 0)
    const avg = sum / metrics.length
    const min = Math.min(...metrics)
    const max = Math.max(...metrics)
    
    return { avg, min, max, count: metrics.length }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [key] of this.metrics) {
      stats[key] = this.getStats(key)
    }
    return stats
  }

  clear() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Memory usage optimization
export function useMemoryOptimization() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const cleanup = () => {
      queryClient.clear()
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
    
    const interval = setInterval(cleanup, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [queryClient])
}

// Bundle of all performance hooks for easy consumption
export function usePerformanceOptimizations(options: {
  enableMemoryOptimization?: boolean
  enablePerformanceMonitoring?: boolean
} = {}) {
  const { enableMemoryOptimization = true } = options
  
  if (enableMemoryOptimization) {
    useMemoryOptimization()
  }
  
  const prefetchOnHover = useCallback((studentId: string) => {
    console.log('Prefetching data for student:', studentId)
  }, [])

  const prefetchTabData = useCallback((studentId: string, tabId: string) => {
    console.log('Prefetching tab data:', { studentId, tabId })
    return Promise.resolve()
  }, [])
  
  const getPerformanceStats = useCallback(() => {
    return performanceMonitor.getAllStats()
  }, [])
  
  return {
    prefetchOnHover,
    prefetchTabData,
    getPerformanceStats
  }
}
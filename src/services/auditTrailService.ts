/**
 * Audit Trail Service
 * 
 * Tracks and logs all user actions for security and compliance purposes.
 */

export type AuditAction = 
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'upload'
  | 'download'
  | 'export'
  | 'email'
  | 'print'
  | 'login'
  | 'logout'
  | 'permission_change'

export type AuditResourceType =
  | 'student'
  | 'personal_info'
  | 'academic_info'
  | 'attendance'
  | 'schedule'
  | 'orchestra'
  | 'theory'
  | 'document'
  | 'report'
  | 'user'
  | 'permission'

export interface AuditEntry {
  id: string
  timestamp: Date
  userId: string
  userRole: string
  userName: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId: string
  resourceName?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  duration?: number // in milliseconds
  metadata?: {
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    changedFields?: string[]
    reason?: string
    batchId?: string // For bulk operations
  }
}

export interface AuditQuery {
  userId?: string
  userRole?: string
  action?: AuditAction
  resourceType?: AuditResourceType
  resourceId?: string
  dateFrom?: Date
  dateTo?: Date
  success?: boolean
  limit?: number
  offset?: number
}

export interface AuditStats {
  totalEntries: number
  entriesByAction: Record<AuditAction, number>
  entriesByResourceType: Record<AuditResourceType, number>
  entriesByUser: Record<string, number>
  failureRate: number
  avgDuration: number
}

class AuditTrailService {
  private entries: AuditEntry[] = []
  private isEnabled: boolean = true

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    try {
      const auditEntry: AuditEntry = {
        ...entry,
        id: this.generateId(),
        timestamp: new Date()
      }

      // Add to local storage (in production, this would be sent to backend)
      this.entries.unshift(auditEntry)

      // Keep only last 1000 entries in memory
      if (this.entries.length > 1000) {
        this.entries = this.entries.slice(0, 1000)
      }

      // Save to localStorage for persistence
      this.saveToStorage()

      console.log('Audit entry logged:', auditEntry)
    } catch (error) {
      console.error('Failed to log audit entry:', error)
    }
  }

  /**
   * Log a view action
   */
  async logView(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'view',
      resourceType,
      resourceId,
      resourceName,
      success: true
    })
  }

  /**
   * Log a create action
   */
  async logCreate(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'create',
      resourceType,
      resourceId,
      resourceName,
      success: true,
      metadata: { newValues }
    })
  }

  /**
   * Log an update action
   */
  async logUpdate(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    changedFields?: string[]
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'update',
      resourceType,
      resourceId,
      resourceName,
      success: true,
      metadata: { oldValues, newValues, changedFields }
    })
  }

  /**
   * Log a delete action
   */
  async logDelete(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'delete',
      resourceType,
      resourceId,
      resourceName,
      success: true,
      metadata: { reason }
    })
  }

  /**
   * Log a file operation
   */
  async logFileOperation(
    userId: string,
    userRole: string,
    userName: string,
    action: 'upload' | 'download',
    resourceId: string,
    fileName: string,
    fileSize?: number
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action,
      resourceType: 'document',
      resourceId,
      resourceName: fileName,
      success: true,
      details: { fileSize }
    })
  }

  /**
   * Log an export action
   */
  async logExport(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    format: string,
    options?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'export',
      resourceType,
      resourceId,
      success: true,
      details: { format, options }
    })
  }

  /**
   * Log an email action
   */
  async logEmail(
    userId: string,
    userRole: string,
    userName: string,
    resourceId: string,
    recipients: string[],
    subject: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'email',
      resourceType: 'report',
      resourceId,
      success: true,
      details: { recipients: recipients.length, subject }
    })
  }

  /**
   * Log a print action
   */
  async logPrint(
    userId: string,
    userRole: string,
    userName: string,
    resourceType: AuditResourceType,
    resourceId: string,
    reportType: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action: 'print',
      resourceType,
      resourceId,
      success: true,
      details: { reportType }
    })
  }

  /**
   * Log a failed action
   */
  async logFailure(
    userId: string,
    userRole: string,
    userName: string,
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    error: string
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      userName,
      action,
      resourceType,
      resourceId,
      success: false,
      errorMessage: error
    })
  }

  /**
   * Query audit entries
   */
  async query(query: AuditQuery): Promise<{
    entries: AuditEntry[]
    total: number
  }> {
    let filteredEntries = [...this.entries]

    // Apply filters
    if (query.userId) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === query.userId)
    }

    if (query.userRole) {
      filteredEntries = filteredEntries.filter(entry => entry.userRole === query.userRole)
    }

    if (query.action) {
      filteredEntries = filteredEntries.filter(entry => entry.action === query.action)
    }

    if (query.resourceType) {
      filteredEntries = filteredEntries.filter(entry => entry.resourceType === query.resourceType)
    }

    if (query.resourceId) {
      filteredEntries = filteredEntries.filter(entry => entry.resourceId === query.resourceId)
    }

    if (query.dateFrom) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp >= query.dateFrom!)
    }

    if (query.dateTo) {
      filteredEntries = filteredEntries.filter(entry => entry.timestamp <= query.dateTo!)
    }

    if (query.success !== undefined) {
      filteredEntries = filteredEntries.filter(entry => entry.success === query.success)
    }

    const total = filteredEntries.length

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 50
    const entries = filteredEntries.slice(offset, offset + limit)

    return { entries, total }
  }

  /**
   * Get audit statistics
   */
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<AuditStats> {
    let entries = [...this.entries]

    if (dateFrom) {
      entries = entries.filter(entry => entry.timestamp >= dateFrom)
    }

    if (dateTo) {
      entries = entries.filter(entry => entry.timestamp <= dateTo)
    }

    const totalEntries = entries.length
    const successfulEntries = entries.filter(entry => entry.success)
    const failureRate = totalEntries > 0 ? ((totalEntries - successfulEntries.length) / totalEntries) * 100 : 0

    const entriesByAction: Record<AuditAction, number> = {} as Record<AuditAction, number>
    const entriesByResourceType: Record<AuditResourceType, number> = {} as Record<AuditResourceType, number>
    const entriesByUser: Record<string, number> = {}

    let totalDuration = 0
    let durationsCount = 0

    entries.forEach(entry => {
      // Count by action
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1

      // Count by resource type
      entriesByResourceType[entry.resourceType] = (entriesByResourceType[entry.resourceType] || 0) + 1

      // Count by user
      entriesByUser[entry.userName] = (entriesByUser[entry.userName] || 0) + 1

      // Calculate average duration
      if (entry.duration) {
        totalDuration += entry.duration
        durationsCount++
      }
    })

    const avgDuration = durationsCount > 0 ? totalDuration / durationsCount : 0

    return {
      totalEntries,
      entriesByAction,
      entriesByResourceType,
      entriesByUser,
      failureRate,
      avgDuration
    }
  }

  /**
   * Get recent activity for a specific resource
   */
  async getRecentActivity(resourceType: AuditResourceType, resourceId: string, limit = 10): Promise<AuditEntry[]> {
    return this.entries
      .filter(entry => entry.resourceType === resourceType && entry.resourceId === resourceId)
      .slice(0, limit)
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalActions: number
    actionBreakdown: Record<AuditAction, number>
    lastSeen: Date | null
    mostAccessedResources: Array<{ resourceType: AuditResourceType; resourceId: string; count: number }>
  }> {
    let userEntries = this.entries.filter(entry => entry.userId === userId)

    if (dateFrom) {
      userEntries = userEntries.filter(entry => entry.timestamp >= dateFrom)
    }

    if (dateTo) {
      userEntries = userEntries.filter(entry => entry.timestamp <= dateTo)
    }

    const totalActions = userEntries.length
    const actionBreakdown: Record<AuditAction, number> = {} as Record<AuditAction, number>
    const resourceAccess: Record<string, number> = {}

    let lastSeen: Date | null = null

    userEntries.forEach(entry => {
      // Track last seen
      if (!lastSeen || entry.timestamp > lastSeen) {
        lastSeen = entry.timestamp
      }

      // Count actions
      actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1

      // Count resource access
      const resourceKey = `${entry.resourceType}:${entry.resourceId}`
      resourceAccess[resourceKey] = (resourceAccess[resourceKey] || 0) + 1
    })

    // Get most accessed resources
    const mostAccessedResources = Object.entries(resourceAccess)
      .map(([key, count]) => {
        const [resourceType, resourceId] = key.split(':')
        return { resourceType: resourceType as AuditResourceType, resourceId, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalActions,
      actionBreakdown,
      lastSeen,
      mostAccessedResources
    }
  }

  /**
   * Generate unique ID for audit entries
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save entries to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('audit_trail', JSON.stringify(this.entries.slice(0, 100)))
    } catch (error) {
      console.error('Failed to save audit trail to storage:', error)
    }
  }

  /**
   * Load entries from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('audit_trail')
      if (stored) {
        const entries = JSON.parse(stored)
        this.entries = entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load audit trail from storage:', error)
    }
  }

  /**
   * Clear audit trail
   */
  clear(): void {
    this.entries = []
    localStorage.removeItem('audit_trail')
  }

  /**
   * Enable or disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Check if audit logging is enabled
   */
  isAuditEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Export audit trail as CSV
   */
  exportAsCSV(entries?: AuditEntry[]): string {
    const auditEntries = entries || this.entries
    
    const headers = [
      'ID',
      'תאריך ושעה',
      'משתמש',
      'תפקיד',
      'פעולה',
      'סוג משאב',
      'מזהה משאב',
      'שם משאב',
      'הצלחה',
      'הודעת שגיאה',
      'משך (מילישניות)',
      'כתובת IP',
      'פרטים נוספים'
    ]

    const rows = auditEntries.map(entry => [
      entry.id,
      entry.timestamp.toISOString(),
      entry.userName,
      entry.userRole,
      entry.action,
      entry.resourceType,
      entry.resourceId,
      entry.resourceName || '',
      entry.success ? 'כן' : 'לא',
      entry.errorMessage || '',
      entry.duration?.toString() || '',
      entry.ipAddress || '',
      JSON.stringify(entry.details || {})
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Add BOM for Hebrew support
    return '\uFEFF' + csvContent
  }
}

export const auditTrailService = new AuditTrailService()

// Initialize from storage on load
auditTrailService.loadFromStorage()
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Column {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: Record<string, any>) => ReactNode
}

interface TableProps {
  columns: Column[]
  data: Record<string, ReactNode>[]
  className?: string
  onRowClick?: (row: Record<string, ReactNode>, index: number) => void
  rowClassName?: string | ((row: Record<string, ReactNode>, index: number) => string)
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'in-progress'
  children: ReactNode
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusClasses = {
    active: 'bg-success-100 text-success-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-orange-100 text-orange-800',
    completed: 'bg-success-100 text-success-800',
    'in-progress': 'bg-primary-100 text-primary-800'
  }

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusClasses[status]
    )}>
      {children}
    </span>
  )
}

export default function Table({ columns, data, className, onRowClick, rowClassName }: TableProps) {
  return (
    <div className={clsx('overflow-hidden bg-white rounded-xl shadow-card border border-gray-100', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                    {
                      'text-start': column.align === 'left',
                      'text-center': column.align === 'center',
                      'text-end': column.align === 'right',
                    }
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const computedRowClassName = typeof rowClassName === 'function' 
                ? rowClassName(row, index) 
                : rowClassName || ''
              
              const isClickable = !!onRowClick
              
              return (
                <tr 
                  key={index} 
                  className={clsx(
                    'transition-colors',
                    isClickable && 'cursor-pointer hover:bg-gray-50',
                    !isClickable && 'hover:bg-gray-50',
                    computedRowClassName
                  )}
                  onClick={isClickable ? () => onRowClick(row, index) : undefined}
                  onKeyDown={isClickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row, index)
                    }
                  } : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  role={isClickable ? 'button' : undefined}
                  aria-label={isClickable ? `צפה בפרטי ${row.name || 'הפריט'}` : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        {
                          'text-start': column.align === 'left',
                          'text-center': column.align === 'center',
                          'text-end': column.align === 'right',
                        },
                      )}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
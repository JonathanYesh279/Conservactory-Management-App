import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

export default function Card({ 
  children, 
  className, 
  padding = 'md', 
  hover = false,
  onClick 
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-card border border-gray-100',
        paddingClasses[padding],
        {
          'hover:shadow-card-hover transition-shadow duration-200 cursor-pointer': hover,
          'cursor-pointer': onClick
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
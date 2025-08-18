import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, Eye, Edit, Trash2 } from 'lucide-react'
import {
  formatRehearsalDateTime,
  getRehearsalStatus,
  calculateAttendanceStats,
  getRehearsalColor,
  getDayName,
  VALID_DAYS_OF_WEEK,
  type Rehearsal
} from '../utils/rehearsalUtils'

interface RehearsalCalendarProps {
  rehearsals: Rehearsal[]
  viewMode: 'week' | 'month'
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
  className?: string
}

export default function RehearsalCalendar({
  rehearsals,
  viewMode,
  selectedDate = new Date(),
  onSelectDate,
  onRehearsalClick,
  onEditRehearsal,
  onDeleteRehearsal,
  onViewDetails,
  className = ''
}: RehearsalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  
  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    onSelectDate?.(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onSelectDate?.(today)
  }

  // Get calendar data based on view mode
  const calendarData = useMemo(() => {
    if (viewMode === 'week') {
      return getWeekData(currentDate, rehearsals)
    } else {
      return getMonthData(currentDate, rehearsals)
    }
  }, [currentDate, rehearsals, viewMode])

  // Header text
  const headerText = useMemo(() => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}`
      } else {
        return `${startOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`
      }
    } else {
      return currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    }
  }, [currentDate, viewMode])

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{headerText}</h3>
        </div>
        
        <button
          onClick={goToToday}
          className="px-3 py-1 text-sm text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          היום
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {viewMode === 'week' ? (
          <WeekView 
            weekData={calendarData as WeekData}
            onRehearsalClick={onRehearsalClick}
            onEditRehearsal={onEditRehearsal}
            onDeleteRehearsal={onDeleteRehearsal}
            onViewDetails={onViewDetails}
          />
        ) : (
          <MonthView 
            monthData={calendarData as MonthData}
            currentDate={currentDate}
            onRehearsalClick={onRehearsalClick}
            onEditRehearsal={onEditRehearsal}
            onDeleteRehearsal={onDeleteRehearsal}
            onViewDetails={onViewDetails}
          />
        )}
      </div>
    </div>
  )
}

// Week view component
interface WeekViewProps {
  weekData: WeekData
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function WeekView({ weekData, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onViewDetails }: WeekViewProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {weekData.days.map((day, index) => (
        <div key={index} className="p-2 text-center">
          <div className="text-sm font-medium text-gray-900">{getDayName(day.dayOfWeek)}</div>
          <div className={`text-lg font-semibold mt-1 ${
            day.isToday ? 'text-primary-600' : 'text-gray-700'
          }`}>
            {day.date.getDate()}
          </div>
        </div>
      ))}
      
      {/* Day cells */}
      {weekData.days.map((day, index) => (
        <div key={index} className="min-h-[200px] border border-gray-200 rounded-lg p-2">
          <div className="space-y-1">
            {day.rehearsals.map(rehearsal => (
              <RehearsalCard
                key={rehearsal._id}
                rehearsal={rehearsal}
                compact={true}
                onRehearsalClick={onRehearsalClick}
                onEditRehearsal={onEditRehearsal}
                onDeleteRehearsal={onDeleteRehearsal}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Month view component
interface MonthViewProps {
  monthData: MonthData
  currentDate: Date
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function MonthView({ monthData, currentDate, onRehearsalClick, onEditRehearsal, onDeleteRehearsal, onViewDetails }: MonthViewProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {Object.entries(VALID_DAYS_OF_WEEK).map(([dayNum, dayName]) => (
        <div key={dayNum} className="p-2 text-center font-medium text-gray-900 text-sm">
          {dayName}
        </div>
      ))}
      
      {/* Calendar cells */}
      {monthData.weeks.map((week, weekIndex) =>
        week.map((day, dayIndex) => (
          <div 
            key={`${weekIndex}-${dayIndex}`} 
            className={`min-h-[100px] border border-gray-200 rounded-lg p-1 ${
              !day.isCurrentMonth ? 'bg-gray-50' : ''
            } ${day.isToday ? 'bg-primary-50 border-primary-200' : ''}`}
          >
            <div className={`text-sm font-medium mb-1 ${
              !day.isCurrentMonth ? 'text-gray-400' :
              day.isToday ? 'text-primary-600' : 'text-gray-900'
            }`}>
              {day.date.getDate()}
            </div>
            
            <div className="space-y-0.5">
              {day.rehearsals.slice(0, 2).map(rehearsal => (
                <RehearsalCard
                  key={rehearsal._id}
                  rehearsal={rehearsal}
                  compact={true}
                  minimal={true}
                  onRehearsalClick={onRehearsalClick}
                  onEditRehearsal={onEditRehearsal}
                  onDeleteRehearsal={onDeleteRehearsal}
                  onViewDetails={onViewDetails}
                />
              ))}
              {day.rehearsals.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.rehearsals.length - 2} נוספות
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Rehearsal card component
interface RehearsalCardProps {
  rehearsal: Rehearsal
  compact?: boolean
  minimal?: boolean
  onRehearsalClick?: (rehearsal: Rehearsal) => void
  onEditRehearsal?: (rehearsal: Rehearsal) => void
  onDeleteRehearsal?: (rehearsalId: string) => void
  onViewDetails?: (rehearsal: Rehearsal) => void
}

function RehearsalCard({ 
  rehearsal, 
  compact = false, 
  minimal = false, 
  onRehearsalClick, 
  onEditRehearsal, 
  onDeleteRehearsal, 
  onViewDetails 
}: RehearsalCardProps) {
  const status = getRehearsalStatus(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)
  const color = getRehearsalColor(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <div 
      className={`${color} rounded-lg p-2 text-white cursor-pointer hover:opacity-90 transition-opacity ${
        minimal ? 'text-xs' : compact ? 'text-sm' : ''
      }`}
      onClick={() => onRehearsalClick?.(rehearsal)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">
            {rehearsal.orchestra?.name || 'תזמורת'}
          </div>
          
          {!minimal && (
            <>
              <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                <Clock className="w-3 h-3" />
                <span>{dateTime.time}</span>
              </div>
              
              {!compact && (
                <>
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{rehearsal.location}</span>
                  </div>
                  
                  {attendanceStats.hasAttendanceData && (
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                      <Users className="w-3 h-3" />
                      <span>{attendanceStats.presentCount}/{attendanceStats.totalMembers}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        
        {!minimal && (
          <div className="flex items-center gap-1 mr-1">
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(rehearsal)
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="צפה בפרטים"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
            {onEditRehearsal && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditRehearsal(rehearsal)
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="ערוך חזרה"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            {onDeleteRehearsal && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteRehearsal(rehearsal._id)
                }}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                title="מחק חזרה"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper types and functions
interface DayData {
  date: Date
  dayOfWeek: number
  isToday: boolean
  isCurrentMonth: boolean
  rehearsals: Rehearsal[]
}

interface WeekData {
  days: DayData[]
}

interface MonthData {
  weeks: DayData[][]
}

// Get start of week (Sunday)
function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

// Get week data
function getWeekData(currentDate: Date, rehearsals: Rehearsal[]): WeekData {
  const startOfWeek = getStartOfWeek(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const days: DayData[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    
    const dayRehearsals = rehearsals.filter(rehearsal => {
      const rehearsalDate = new Date(rehearsal.date)
      rehearsalDate.setHours(0, 0, 0, 0)
      return rehearsalDate.getTime() === date.getTime()
    })
    
    days.push({
      date,
      dayOfWeek: date.getDay(),
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth: true,
      rehearsals: dayRehearsals
    })
  }
  
  return { days }
}

// Get month data
function getMonthData(currentDate: Date, rehearsals: Rehearsal[]): MonthData {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get first Sunday of the calendar
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())
  
  // Get last Saturday of the calendar
  const endDate = new Date(lastDay)
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
  
  const weeks: DayData[][] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const week: DayData[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(current)
      
      const dayRehearsals = rehearsals.filter(rehearsal => {
        const rehearsalDate = new Date(rehearsal.date)
        rehearsalDate.setHours(0, 0, 0, 0)
        return rehearsalDate.getTime() === date.getTime()
      })
      
      week.push({
        date,
        dayOfWeek: date.getDay(),
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === month,
        rehearsals: dayRehearsals
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    weeks.push(week)
  }
  
  return { weeks }
}
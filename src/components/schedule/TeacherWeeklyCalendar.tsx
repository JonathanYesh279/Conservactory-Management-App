/**
 * Teacher Weekly Calendar Component
 * 
 * Displays a comprehensive weekly calendar showing all teacher activities:
 * - Individual lessons with students
 * - Orchestra conducting sessions
 * - Ensemble activities
 * Activities are displayed as cards within each day, sorted by time
 */

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Music, User, Calendar, BookOpen } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { he } from 'date-fns/locale'

interface TimeBlock {
  _id: string
  day: string
  startTime: string
  endTime: string
  totalDuration: number
  location?: string
  notes?: string
  isActive: boolean
  assignedLessons: any[]
}

interface TeacherLesson {
  _id?: string
  studentId: string
  studentName?: string
  day: string
  startTime: string
  endTime: string
  duration: number
  location?: string
  instrumentName?: string
  lessonType: 'individual' | 'group'
  notes?: string
}

interface OrchestraActivity {
  _id: string
  name: string
  day: string
  startTime: string
  endTime: string
  location?: string
  participants?: number
  type: 'orchestra' | 'ensemble'
}

interface TeacherWeeklyCalendarProps {
  teacher: any
  timeBlocks?: TimeBlock[]
  lessons?: TeacherLesson[]
  orchestraActivities?: OrchestraActivity[]
  className?: string
  showNavigation?: boolean
}

// Hebrew day names mapping
const HEBREW_DAYS_MAP: { [key: string]: number } = {
  'ראשון': 0, // Sunday
  'שני': 1,   // Monday  
  'שלישי': 2, // Tuesday
  'רביעי': 3, // Wednesday
  'חמישי': 4, // Thursday
  'שישי': 5,  // Friday
  'שבת': 6    // Saturday
}

const ENGLISH_TO_HEBREW_DAYS = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
]

const TeacherWeeklyCalendar: React.FC<TeacherWeeklyCalendarProps> = ({
  teacher,
  timeBlocks = [],
  lessons = [],
  orchestraActivities = [],
  className = '',
  showNavigation = true
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Calculate week boundaries
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek])
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd])

  // Convert Hebrew day names to actual dates for current week
  const convertHebrewDayToDate = (hebrewDay: string): Date | null => {
    const dayIndex = HEBREW_DAYS_MAP[hebrewDay]
    if (dayIndex === undefined) return null
    return addDays(weekStart, dayIndex)
  }

  // Process and combine all activities for the week (excluding time blocks)
  const weeklyActivities = useMemo(() => {
    const activities: Array<{
      id: string
      date: Date
      startTime: string
      endTime: string
      title: string
      subtitle?: string
      type: 'lesson' | 'orchestra' | 'ensemble'
      location?: string
      participants?: string[]
      color: string
      details?: any
      studentName?: string
      instrumentName?: string
    }> = []

    // Note: timeBlocks (יום לימוד) are no longer displayed in the calendar
    // They are shown as a separate card preview section below the calendar
    // Only actual activities (lessons with students, orchestras) appear in the calendar

    // Process lessons from lessons prop (primary source)
    lessons.forEach((lesson: any, index: number) => {
      const date = convertHebrewDayToDate(lesson.day)
      if (!date) return
      
      // Handle different data structures - check multiple possible field names
      const startTime = lesson.startTime || lesson.time || lesson.scheduleInfo?.startTime
      const duration = lesson.duration || lesson.scheduleInfo?.duration || 45
      const endTime = lesson.endTime || lesson.scheduleInfo?.endTime || calculateEndTime(startTime, duration)
      
      // Validate required fields
      if (!startTime) {
        console.warn('Lesson missing time data:', lesson)
        return
      }

      activities.push({
        id: `lesson-${lesson._id || index}`,
        date,
        startTime: startTime,
        endTime: endTime,
        title: lesson.lessonType === 'group' ? 'שיעור קבוצתי' : 'שיעור פרטי',
        subtitle: lesson.studentName || 'תלמיד',
        studentName: lesson.studentName,
        instrumentName: lesson.instrumentName || lesson.instrument?.instrumentName,
        type: 'lesson',
        location: lesson.location || lesson.scheduleInfo?.location,
        color: lesson.lessonType === 'group' 
          ? 'bg-green-100 border-green-300 text-green-800'
          : 'bg-blue-100 border-blue-300 text-blue-800',
        details: lesson
      })
    })
    
    // Helper function to calculate end time
    function calculateEndTime(startTime: string, duration: number): string {
      if (!startTime || !duration) return startTime || '00:00'
      
      const [hours, minutes] = startTime.split(':').map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(totalMinutes / 60)
      const endMins = totalMinutes % 60
      
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    }

    // Note: Legacy schedule slots (יום לימוד from teacher.teaching.schedule) 
    // are also treated as availability blocks, not actual activities
    // Only show actual lessons with confirmed students in the calendar

    // Process orchestra activities
    orchestraActivities.forEach(activity => {
      const date = convertHebrewDayToDate(activity.day)
      if (!date) return
      
      // Validate required fields
      if (!activity.startTime || !activity.endTime) {
        console.warn('Orchestra activity missing time data:', activity)
        return
      }

      activities.push({
        id: `orchestra-${activity._id}`,
        date,
        startTime: activity.startTime,
        endTime: activity.endTime,
        title: activity.name,
        subtitle: activity.type === 'orchestra' ? 'תזמורת' : 'אנסמבל',
        type: activity.type as 'orchestra' | 'ensemble',
        location: activity.location,
        participants: [`${activity.participants || 0} נגנים`],
        color: activity.type === 'orchestra' 
          ? 'bg-purple-100 border-purple-300 text-purple-800'
          : 'bg-green-100 border-green-300 text-green-800',
        details: activity
      })
    })

    // Sort activities by date and time
    return activities.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime()
      if (dateCompare !== 0) return dateCompare
      // Handle missing startTime gracefully
      const aTime = a.startTime || '00:00'
      const bTime = b.startTime || '00:00'
      return aTime.localeCompare(bTime)
    })
  }, [timeBlocks, lessons, orchestraActivities, teacher, weekStart])

  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped: { [key: string]: typeof weeklyActivities } = {}
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      grouped[dayKey] = weeklyActivities.filter(activity => 
        isSameDay(activity.date, day)
      )
    })
    return grouped
  }, [weeklyActivities, weekDays])

  // Navigation functions
  const goToPreviousWeek = () => setCurrentWeek(prev => subDays(prev, 7))
  const goToNextWeek = () => setCurrentWeek(prev => addDays(prev, 7))
  const goToCurrentWeek = () => setCurrentWeek(new Date())

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <User className="w-4 h-4" />
      case 'orchestra':
        return <Music className="w-4 h-4" />
      case 'ensemble':
        return <Users className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Navigation */}
      {showNavigation && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  לוח זמנים - {format(weekStart, 'dd/MM', { locale: he })} - {format(weekEnd, 'dd/MM/yyyy', { locale: he })}
                </h2>
                <p className="text-sm text-gray-600">
                  {weeklyActivities.length} פעילויות השבוע
                </p>
              </div>
              
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              השבוע הנוכחי
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid - Days Only */}
      <div className="p-4">
        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-7 gap-3">
            {/* Day Columns */}
            {weekDays.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayActivities = activitiesByDay[dayKey] || []
              const isCurrentDay = isToday(day)
              
              return (
                <div 
                  key={dayKey}
                  className={`border rounded-lg ${
                    isCurrentDay 
                      ? 'border-primary-400 bg-primary-50/30' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`p-3 text-center border-b ${
                    isCurrentDay
                      ? 'bg-primary-100 text-primary-800 border-primary-200'
                      : dayActivities.length > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    <div className="font-semibold">{ENGLISH_TO_HEBREW_DAYS[index]}</div>
                    <div className="text-sm mt-1">
                      {format(day, 'dd/MM')}
                    </div>
                    {dayActivities.length > 0 && (
                      <div className="text-xs mt-1 opacity-75">
                        {dayActivities.length} פעילויות
                      </div>
                    )}
                  </div>

                  {/* Activities for the Day */}
                  <div className="p-2 space-y-2 min-h-[400px]">
                    {dayActivities.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 mt-8">
                        אין פעילויות
                      </div>
                    ) : (
                      dayActivities.map(activity => (
                        <div 
                          key={activity.id}
                          className={`p-3 rounded-lg border-l-4 ${activity.color} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                        >
                          {/* Activity Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getActivityIcon(activity.type)}
                              <span className="font-semibold text-sm">
                                {activity.title}
                              </span>
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs mb-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">
                              {activity.startTime} - {activity.endTime}
                            </span>
                          </div>

                          {/* Student/Subtitle */}
                          {activity.subtitle && (
                            <div className="text-xs opacity-90 mb-1">
                              {activity.type === 'lesson' && activity.studentName && (
                                <div className="font-medium">תלמיד: {activity.studentName}</div>
                              )}
                              {activity.type !== 'lesson' && (
                                <div>{activity.subtitle}</div>
                              )}
                            </div>
                          )}

                          {/* Instrument for lessons */}
                          {activity.type === 'lesson' && activity.instrumentName && (
                            <div className="text-xs opacity-75 mb-1">
                              כלי: {activity.instrumentName}
                            </div>
                          )}

                          {/* Location */}
                          {activity.location && (
                            <div className="flex items-center gap-1 text-xs opacity-75">
                              <MapPin className="w-3 h-3" />
                              <span>{activity.location}</span>
                            </div>
                          )}

                          {/* Participants for orchestras/ensembles */}
                          {activity.participants && (
                            <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                              <Users className="w-3 h-3" />
                              <span>{activity.participants.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden">
          <div className="space-y-4">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayActivities = activitiesByDay[dayKey] || []
              const isCurrentDay = isToday(day)
              
              return (
                <div key={dayKey} className={`border rounded-lg overflow-hidden ${
                  isCurrentDay ? 'border-primary-400' : 'border-gray-200'
                }`}>
                  <div className={`p-3 font-semibold ${
                    isCurrentDay
                      ? 'bg-primary-100 text-primary-800'
                      : dayActivities.length > 0
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span>{ENGLISH_TO_HEBREW_DAYS[dayIndex]} - {format(day, 'dd/MM')}</span>
                      {dayActivities.length > 0 && (
                        <span className="text-sm opacity-75">{dayActivities.length} פעילויות</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {dayActivities.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-4">
                        אין פעילויות
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayActivities.map(activity => (
                          <div key={activity.id} className={`p-3 rounded-lg border-l-4 ${activity.color}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getActivityIcon(activity.type)}
                                <h4 className="font-semibold text-sm">{activity.title}</h4>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{activity.startTime} - {activity.endTime}</span>
                              </div>
                              
                              {activity.type === 'lesson' && activity.studentName && (
                                <div className="font-medium">תלמיד: {activity.studentName}</div>
                              )}
                              
                              {activity.instrumentName && (
                                <div className="opacity-75">כלי: {activity.instrumentName}</div>
                              )}
                              
                              {activity.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{activity.location}</span>
                                </div>
                              )}
                              
                              {activity.participants && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{activity.participants.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Week Summary */}
        {weeklyActivities.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">סיכום השבוע</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyActivities.filter(a => a.type === 'lesson').length}
                </div>
                <div className="text-sm text-gray-600">שיעורים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {weeklyActivities.filter(a => a.type === 'orchestra').length}
                </div>
                <div className="text-sm text-gray-600">תזמורות</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {weeklyActivities.filter(a => a.type === 'ensemble').length}
                </div>
                <div className="text-sm text-gray-600">אנסמבלים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {weekDays.filter(day => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    return (activitiesByDay[dayKey] || []).length > 0
                  }).length}
                </div>
                <div className="text-sm text-gray-600">ימים פעילים</div>
              </div>
            </div>
          </div>
        )}

        {/* Teaching Time Blocks Preview - יום לימוד */}
        {timeBlocks.length > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">ימי לימוד - זמינות למערכת</h3>
              <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                {timeBlocks.length} בלוקי זמן
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeBlocks.map(block => (
                <div key={block._id} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 text-lg">{block.day}</span>
                        {block.isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            פעיל
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          {block.startTime} - {block.endTime}
                        </span>
                      </div>
                      
                      {block.location && (
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{block.location}</span>
                        </div>
                      )}
                      
                      {block.notes && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mt-2">
                          {block.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center ml-3">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor(block.totalDuration / 60)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">שעות</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {block.totalDuration % 60 !== 0 && `+${block.totalDuration % 60}ד'`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {block.assignedLessons?.length || 0} שיעורים מתוכננים
                      </span>
                      <span className="text-blue-600 font-medium">
                        זמין למערכת
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>הסבר:</strong> ימי הלימוד מציגים את הזמנים בהם המורה זמין ללמד. 
                רק שיעורים בפועל עם תלמידים ופעילויות הניצוח מוצגים בלוח הזמנים למעלה.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeacherWeeklyCalendar
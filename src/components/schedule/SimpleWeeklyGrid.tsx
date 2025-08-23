/**
 * Simple Weekly Grid Component
 * 
 * A simple day-based grid that shows student activities without complex time slots
 * Focus on displaying lesson cards in a clean, scrollable format
 */

import React from 'react'
import { Clock, MapPin, Music, User } from 'lucide-react'

interface CalendarLesson {
  id: string
  instrumentName: string
  teacherName: string
  startTime: string
  endTime: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  location?: string
  roomNumber?: string
  lessonType: 'individual' | 'group' | 'orchestra' | 'theory'
}

interface SimpleWeeklyGridProps {
  lessons: CalendarLesson[]
  className?: string
}

const SimpleWeeklyGrid: React.FC<SimpleWeeklyGridProps> = ({ lessons, className = '' }) => {
  // Hebrew day names
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
  
  // Group lessons by day of week
  const lessonsByDay = lessons.reduce((acc, lesson) => {
    if (lesson.dayOfWeek >= 0 && lesson.dayOfWeek <= 5) { // Sunday (0) to Friday (5)
      if (!acc[lesson.dayOfWeek]) {
        acc[lesson.dayOfWeek] = []
      }
      acc[lesson.dayOfWeek].push(lesson)
    }
    return acc
  }, {} as Record<number, CalendarLesson[]>)

  // Sort lessons within each day by start time
  Object.keys(lessonsByDay).forEach(day => {
    lessonsByDay[parseInt(day)].sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number)
      const timeB = b.startTime.split(':').map(Number)
      const minutesA = timeA[0] * 60 + timeA[1]
      const minutesB = timeB[0] * 60 + timeB[1]
      return minutesA - minutesB
    })
  })

  // Get lesson type styling
  const getLessonTypeStyle = (type: string) => {
    switch (type) {
      case 'individual':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600'
      case 'group':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600'
      case 'orchestra':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-600'
      case 'theory':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-600'
    }
  }

  // Get lesson type in Hebrew
  const getLessonTypeHebrew = (type: string) => {
    switch (type) {
      case 'individual': return 'שיעור אישי'
      case 'group': return 'שיעור קבוצתי'
      case 'orchestra': return 'תזמורת'
      case 'theory': return 'תיאוריה'
      default: return 'שיעור'
    }
  }

  // Calculate duration
  const getDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes - startMinutes
  }

  return (
    <div className={`simple-weekly-grid ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">לוח זמנים שבועי</h3>
        <p className="text-sm text-gray-600">
          {lessons.length === 0 
            ? 'אין שיעורים השבוע' 
            : lessons.length === 1 
            ? 'שיעור אחד השבוע' 
            : `${lessons.length} שיעורים השבוע`
          }
        </p>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {dayNames.map((dayName, dayIndex) => {
          const dayLessons = lessonsByDay[dayIndex] || []
          
          return (
            <div key={dayIndex} className="day-column">
              {/* Day Header */}
              <div className="day-header bg-gray-50 rounded-t-lg px-4 py-3 border-b">
                <h4 className="font-medium text-gray-900 text-center">{dayName}</h4>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {dayLessons.length === 0 
                    ? 'אין שיעורים' 
                    : dayLessons.length === 1 
                    ? 'שיעור אחד' 
                    : `${dayLessons.length} שיעורים`
                  }
                </p>
              </div>

              {/* Day Content */}
              <div className="day-content bg-white rounded-b-lg border border-t-0 border-gray-200 min-h-32">
                {dayLessons.length === 0 ? (
                  // Empty day
                  <div className="p-6 text-center">
                    <div className="text-gray-300 mb-2">
                      <Music className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-gray-400 text-sm">אין שיעורים</p>
                  </div>
                ) : (
                  // Day with lessons
                  <div className="p-3 space-y-3">
                    {dayLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className={`lesson-card rounded-lg p-4 border-2 shadow-sm hover:shadow-md transition-all duration-200 ${getLessonTypeStyle(lesson.lessonType)}`}
                      >
                        {/* Lesson Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-lg">{lesson.instrumentName}</h5>
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                            {getLessonTypeHebrew(lesson.lessonType)}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {lesson.startTime} - {lesson.endTime}
                          </span>
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                            {getDuration(lesson.startTime, lesson.endTime)}ד'
                          </span>
                        </div>

                        {/* Teacher */}
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm">מורה: {lesson.teacherName}</span>
                        </div>

                        {/* Location */}
                        {(lesson.roomNumber || lesson.location) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="legend bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">מקרא</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded border"></div>
            <span className="text-sm text-gray-700">שיעורים אישיים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded border"></div>
            <span className="text-sm text-gray-700">שיעורים קבוצתיים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded border"></div>
            <span className="text-sm text-gray-700">תזמורות</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded border"></div>
            <span className="text-sm text-gray-700">תיאוריה</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleWeeklyGrid
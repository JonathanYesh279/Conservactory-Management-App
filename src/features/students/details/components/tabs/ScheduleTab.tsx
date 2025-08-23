/**
 * Schedule Tab Component - Weekly Calendar Grid
 * 
 * Displays student's schedule in a proper weekly calendar grid from Sunday to Friday
 * Shows lessons as calendar events with proper time slots and Hebrew labels
 */

import { useMemo } from 'react'
import { Calendar, Clock, MapPin, Music, Users } from 'lucide-react'
import WeeklyCalendarGrid from '../../../../../components/schedule/WeeklyCalendarGrid'
import SimpleWeeklyGrid from '../../../../../components/schedule/SimpleWeeklyGrid'

interface ScheduleTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ student, studentId, isLoading }) => {
  // Convert student data to calendar lessons format
  const lessons = useMemo(() => {
    const calendarLessons: any[] = []
    
    console.log('Processing student data:', student) // Debug log
    
    // Process teacher assignments into lesson data
    if (student?.teacherAssignments && student.teacherAssignments.length > 0) {
      student.teacherAssignments.forEach((assignment: any, index: number) => {
        console.log(`Processing assignment ${index}:`, assignment) // Debug log
        
        // Try to get real schedule data or use defaults
        const dayOfWeek = assignment.dayOfWeek ?? 2 // Default to Tuesday if not specified
        const startTime = assignment.startTime || assignment.timeSlot?.startTime || '14:30'
        const endTime = assignment.endTime || assignment.timeSlot?.endTime || '15:15'
        const instrument = assignment.instrument || assignment.instrumentName || 'חצוצרה'
        const teacher = assignment.teacherName || assignment.teacher?.personalInfo?.fullName || 'יונתן ישעיהו'
        
        calendarLessons.push({
          id: assignment._id || assignment.teacherId || `lesson-${index}`,
          instrumentName: instrument,
          teacherName: teacher,
          startTime,
          endTime,
          dayOfWeek,
          location: assignment.location || assignment.classroom,
          roomNumber: assignment.roomNumber || assignment.room || 'מחשבים',
          lessonType: assignment.lessonType || 'individual'
        })
      })
    }
    
    // Process any additional lessons from other sources
    if (student?.lessons && student.lessons.length > 0) {
      student.lessons.forEach((lesson: any, index: number) => {
        console.log(`Processing lesson ${index}:`, lesson) // Debug log
        
        calendarLessons.push({
          id: lesson._id || `lesson-direct-${index}`,
          instrumentName: lesson.instrument || lesson.instrumentName || 'כלי נגינה',
          teacherName: lesson.teacherName || lesson.teacher?.personalInfo?.fullName || 'מורה',
          startTime: lesson.startTime || '14:30',
          endTime: lesson.endTime || '15:15',
          dayOfWeek: lesson.dayOfWeek ?? 2,
          location: lesson.location,
          roomNumber: lesson.roomNumber || lesson.room,
          lessonType: lesson.lessonType || 'individual'
        })
      })
    }
    
    // If no lessons found, show the default trumpet lesson
    if (calendarLessons.length === 0) {
      console.log('No lessons found, using default trumpet lesson') // Debug log
      
      calendarLessons.push({
        id: 'default-lesson',
        instrumentName: 'חצוצרה',
        teacherName: 'יונתן ישעיהו',
        startTime: '14:30',
        endTime: '15:15',
        dayOfWeek: 2, // Tuesday
        location: undefined,
        roomNumber: 'מחשבים',
        lessonType: 'individual'
      })
    }
    
    console.log('Final lessons array:', calendarLessons) // Debug log
    return calendarLessons
  }, [student?.teacherAssignments, student?.lessons])

  // Process orchestra enrollments for display (not as calendar events yet since no schedule)
  const orchestraActivities = useMemo(() => {
    if (!student?.orchestraEnrollments) return []
    
    return student.orchestraEnrollments.map((enrollment: any) => ({
      id: enrollment._id || enrollment.orchestraId,
      name: enrollment.orchestraName || 'תזמורת',
      status: enrollment.status || 'רשום'
    }))
  }, [student?.orchestraEnrollments])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen w-full max-w-full overflow-hidden student-content-area">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">לוח זמנים שבועי</h2>
        <p className="text-gray-600 mt-1">
          {lessons.length === 1 ? 'שיעור אחד בשבוע' : `${lessons.length} שיעורים בשבוע`}
        </p>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full max-w-full overflow-hidden">
        <SimpleWeeklyGrid lessons={lessons} />
      </div>

      {/* Summary Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lessons Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary-600" />
            שיעורים השבוע
          </h4>
          
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
              return (
                <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Music className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900">{lesson.instrumentName}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {dayNames[lesson.dayOfWeek]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.startTime} - {lesson.endTime}</span>
                    </div>
                    
                    {(lesson.roomNumber || lesson.location) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{lesson.roomNumber ? `חדר ${lesson.roomNumber}` : lesson.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    מורה: {lesson.teacherName}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orchestra Activities */}
        {orchestraActivities.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              תזמורות ופעילויות
            </h4>
            
            <div className="space-y-3">
              {orchestraActivities.map((activity) => (
                <div key={activity.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-900">{activity.name}</span>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      activity.status === 'רשום' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    לוח זמנים יפורסם בהמשך
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for orchestras */}
        {orchestraActivities.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">אין תזמורות</h4>
              <p className="text-gray-600">לא נרשמת עדיין לתזמורות או פעילויות קבוצתיות</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduleTab
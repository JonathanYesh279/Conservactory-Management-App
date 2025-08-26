/**
 * Schedule Tab Component - Weekly Calendar Grid
 * 
 * Displays student's schedule in a proper weekly calendar grid from Sunday to Friday
 * Shows lessons as calendar events with proper time slots and Hebrew labels
 */

import { useMemo, useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Music, Users } from 'lucide-react'
import WeeklyCalendarGrid from '../../../../../components/schedule/WeeklyCalendarGrid'
import SimpleWeeklyGrid from '../../../../../components/schedule/SimpleWeeklyGrid'
import apiService from '../../../../../services/apiService'

interface ScheduleTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ student, studentId, isLoading }) => {
  const [teacherData, setTeacherData] = useState<Record<string, any>>({})
  
  // Fetch teacher information for all teacher assignments
  useEffect(() => {
    const fetchTeachers = async () => {
      if (student?.teacherAssignments && student.teacherAssignments.length > 0) {
        const teacherIds = [...new Set(student.teacherAssignments.map((a: any) => a.teacherId).filter(Boolean))]
        const teachers: Record<string, any> = {}
        
        for (const teacherId of teacherIds) {
          try {
            const teacher = await apiService.teachers.getTeacherById(teacherId)
            teachers[teacherId] = teacher
            console.log(`Fetched teacher ${teacherId}:`, teacher.personalInfo?.fullName)
          } catch (error) {
            console.error(`Failed to fetch teacher ${teacherId}:`, error)
          }
        }
        
        setTeacherData(teachers)
      }
    }
    
    fetchTeachers()
  }, [student?.teacherAssignments])
  // Convert student data to calendar lessons format
  const lessons = useMemo(() => {
    const calendarLessons: any[] = []
    
    console.log('Processing student data:', student) // Debug log
    
    // Process teacher assignments into lesson data
    if (student?.teacherAssignments && student.teacherAssignments.length > 0) {
      student.teacherAssignments.forEach((assignment: any, index: number) => {
        console.log(`Processing assignment ${index}:`, assignment) // Debug log
        
        // Map day names to day of week numbers
        const dayMapping: Record<string, number> = {
          'ראשון': 0,
          'שני': 1,
          'שלישי': 2,
          'רביעי': 3,
          'חמישי': 4,
          'שישי': 5,
          'שבת': 6
        }
        
        // Get real data from the assignment
        const dayOfWeek = dayMapping[assignment.day] ?? 0
        const startTime = assignment.time || assignment.startTime || '14:30'
        
        // Calculate end time from start time and duration
        const calculateEndTime = (start: string, duration: number): string => {
          const [hours, minutes] = start.split(':').map(Number)
          const totalMinutes = hours * 60 + minutes + duration
          const endHours = Math.floor(totalMinutes / 60)
          const endMinutes = totalMinutes % 60
          return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        }
        
        const endTime = assignment.scheduleInfo?.endTime || 
                       calculateEndTime(startTime, assignment.duration || 45)
        
        // Get teacher name from fetched data or use data from assignment
        const teacher = teacherData[assignment.teacherId]
        const teacherName = teacher?.personalInfo?.fullName || 
                           assignment.scheduleInfo?.teacherName || 
                           assignment.teacherName || 
                           'מורה' // Generic "Teacher" instead of a specific mock name
        
        // Get instrument from teacher data or student's academic info
        const instrumentName = teacher?.professionalInfo?.instrument || 
                              assignment.instrument || 
                              student?.academicInfo?.instrumentProgress?.[0]?.instrumentName || 
                              'כלי נגינה'
        
        calendarLessons.push({
          id: assignment._id || assignment.teacherId || `lesson-${index}`,
          instrumentName: instrumentName,
          teacherName: teacherName,
          teacherId: assignment.teacherId,
          startTime,
          endTime,
          dayOfWeek,
          location: assignment.location || assignment.scheduleInfo?.location,
          roomNumber: assignment.roomNumber || assignment.room,
          lessonType: assignment.lessonType || 'individual'
        })
      })
    }
    
    // Process any additional lessons from other sources
    if (student?.lessons && student.lessons.length > 0) {
      student.lessons.forEach((lesson: any, index: number) => {
        console.log(`Processing lesson ${index}:`, lesson) // Debug log
        
        // Try to get teacher data if we have a teacherId
        const teacher = lesson.teacherId ? teacherData[lesson.teacherId] : null
        const teacherName = teacher?.personalInfo?.fullName ||
                           lesson.teacherName || 
                           lesson.teacher?.personalInfo?.fullName || 
                           'מורה'
        
        calendarLessons.push({
          id: lesson._id || `lesson-direct-${index}`,
          instrumentName: lesson.instrument || lesson.instrumentName || 'כלי נגינה',
          teacherName: teacherName,
          startTime: lesson.startTime || '14:30',
          endTime: lesson.endTime || '15:15',
          dayOfWeek: lesson.dayOfWeek ?? 2,
          location: lesson.location,
          roomNumber: lesson.roomNumber || lesson.room,
          lessonType: lesson.lessonType || 'individual'
        })
      })
    }
    
    // If no lessons found, don't add mock data - show empty state
    if (calendarLessons.length === 0) {
      console.log('No lessons found, showing empty state') // Debug log
    }
    
    console.log('Final lessons array:', calendarLessons) // Debug log
    return calendarLessons
  }, [student?.teacherAssignments, student?.lessons, teacherData])

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
          {lessons.length === 0 ? 'אין שיעורים מתוכננים' : 
           lessons.length === 1 ? 'שיעור אחד בשבוע' : `${lessons.length} שיעורים בשבוע`}
        </p>
      </div>

      {/* Weekly Schedule Grid or Empty State */}
      {lessons.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full max-w-full overflow-hidden">
          <SimpleWeeklyGrid lessons={lessons} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">אין שיעורים מתוכננים</h3>
          <p className="text-gray-600 mb-4">
            התלמיד עדיין לא שוייך למורים או שלא הוגדרו לו שיעורים קבועים
          </p>
          <div className="text-sm text-gray-500">
            ניתן לשייך מורים ולהגדיר שיעורים דרך המערכת
          </div>
        </div>
      )}

      {/* Summary Info - Only show if there are lessons */}
      {lessons.length > 0 && (
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
      )}

      {/* Orchestra Activities section for when no lessons exist */}
      {lessons.length === 0 && orchestraActivities.length > 0 && (
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
    </div>
  )
}

export default ScheduleTab
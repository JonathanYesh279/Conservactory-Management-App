import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Edit, Trash2, Music, Eye, Star } from 'lucide-react'
import apiService from '../../services/apiService'

interface LessonSlot {
  id: string
  startTime: string
  endTime: string
  studentName?: string
  studentId?: string
  instrument?: string
  lessonType: 'individual' | 'group' | 'availability'
  status: 'scheduled' | 'completed' | 'cancelled' | 'available'
  notes?: string
  // Enhanced student data
  studentStage?: number
  studentClass?: string
  studentPhone?: string
  isRecurring?: boolean
  repeatType?: 'weekly' | 'biweekly' | 'monthly'
}

interface DaySchedule {
  date: string
  dayName: string
  lessons: LessonSlot[]
}

interface WeekSchedule {
  weekStart: Date
  weekEnd: Date
  days: DaySchedule[]
}

export default function TeacherScheduleTab() {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null)
  const [editingLesson, setEditingLesson] = useState<LessonSlot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWeekSchedule()
  }, [currentWeek, user])

  const loadWeekSchedule = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const teacherId = user._id
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = getWeekEnd(currentWeek)
      
      // Get teacher profile to access timeBlocks and students
      const teacherProfile = await apiService.teachers.getTeacher(teacherId)
      
      if (!teacherProfile) {
        throw new Error('לא נמצא פרופיל מורה')
      }
      
      const timeBlocks = teacherProfile?.teaching?.timeBlocks || []
      console.log(`Found ${timeBlocks.length} time blocks for teacher`)
      
      // Get teacher's students with their schedule data
      let students = []
      try {
        const studentIds = teacherProfile?.teaching?.studentIds || []
        if (studentIds.length > 0) {
          students = await apiService.students.getBatchStudents(studentIds)
          console.log(`Found ${students.length} students for schedule integration`)
        }
      } catch (error) {
        console.warn('Failed to load students for schedule:', error)
      }
      
      // Generate empty week structure
      const days = generateEmptyWeek(weekStart)
      
      const dayMapping = {
        'ראשון': 0,
        'שני': 1, 
        'שלישי': 2,
        'רביעי': 3,
        'חמישי': 4,
        'שישי': 5,
        'שבת': 6
      }

      // Add teacher availability blocks first
      if (timeBlocks.length > 0) {
        timeBlocks.forEach(block => {
          const dayIndex = dayMapping[block.day]
          if (dayIndex !== undefined && days[dayIndex]) {
            days[dayIndex].lessons.push({
              id: `availability-${block.day}-${block.startTime}`,
              startTime: block.startTime,
              endTime: block.endTime,
              studentName: 'זמין להוראה',
              studentId: null,
              instrument: '',
              lessonType: 'availability',
              status: 'available',
              notes: `זמין ${block.totalDuration} דקות`
            })
          }
        })
      }
      
      // Add student lessons on top of availability
      if (students.length > 0) {
        students.forEach(student => {
          // Get student's lesson schedule
          const assignments = student.teacherAssignments || []
          const scheduleInfo = student.scheduleInfo
          
          // Process teacher assignments for this teacher
          assignments
            .filter(assignment => assignment.teacherId === teacherId)
            .forEach(assignment => {
              const dayIndex = dayMapping[assignment.day]
              if (dayIndex !== undefined && days[dayIndex]) {
                const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary) 
                  || student.academicInfo?.instrumentProgress?.[0]
                
                // Replace or overlay on availability slot
                const existingLessonIndex = days[dayIndex].lessons.findIndex(
                  lesson => lesson.startTime === assignment.time && lesson.lessonType === 'availability'
                )
                
                const studentLesson = {
                  id: `lesson-${student._id}-${assignment.day}`,
                  startTime: assignment.time,
                  endTime: addMinutesToTime(assignment.time, assignment.duration),
                  studentName: student.personalInfo?.fullName || 'תלמיד',
                  studentId: student._id,
                  instrument: primaryInstrument?.instrumentName || '',
                  lessonType: 'individual' as const,
                  status: 'scheduled' as const,
                  notes: `${assignment.duration} דקות`,
                  // Enhanced data
                  studentStage: primaryInstrument?.currentStage,
                  studentClass: student.personalInfo?.class || student.academicInfo?.class,
                  studentPhone: student.personalInfo?.phone,
                  isRecurring: true,
                  repeatType: 'weekly' as const
                }
                
                if (existingLessonIndex !== -1) {
                  // Replace availability with actual lesson
                  days[dayIndex].lessons[existingLessonIndex] = studentLesson
                } else {
                  // Add as new lesson
                  days[dayIndex].lessons.push(studentLesson)
                }
              }
            })
          
          // Also check scheduleInfo as fallback
          if (scheduleInfo && !assignments.find(a => a.teacherId === teacherId)) {
            const dayIndex = dayMapping[scheduleInfo.day]
            if (dayIndex !== undefined && days[dayIndex]) {
              const primaryInstrument = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary) 
                || student.academicInfo?.instrumentProgress?.[0]
              
              days[dayIndex].lessons.push({
                id: `schedule-${student._id}`,
                startTime: scheduleInfo.startTime,
                endTime: scheduleInfo.endTime,
                studentName: student.personalInfo?.fullName || 'תלמיד',
                studentId: student._id,
                instrument: primaryInstrument?.instrumentName || '',
                lessonType: 'individual' as const,
                status: 'scheduled' as const,
                notes: `${scheduleInfo.duration} דקות`,
                studentStage: primaryInstrument?.currentStage,
                studentClass: student.personalInfo?.class || student.academicInfo?.class,
                studentPhone: student.personalInfo?.phone,
                isRecurring: true,
                repeatType: 'weekly' as const
              })
            }
          }
        })
      }
      
      // Sort lessons by time for each day
      days.forEach(day => {
        day.lessons.sort((a, b) => a.startTime.localeCompare(b.startTime))
      })
      
      setWeekSchedule({
        weekStart,
        weekEnd,
        days
      })
    } catch (error) {
      console.error('Error loading teacher schedule:', error)
      setError('שגיאה בטעינת לוח הזמנים')
      // Generate empty week as fallback
      const weekStart = getWeekStart(currentWeek)
      setWeekSchedule({
        weekStart,
        weekEnd: getWeekEnd(currentWeek),
        days: generateEmptyWeek(weekStart)
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to add minutes to time string
  const addMinutesToTime = (timeString: string, minutes: number) => {
    const [hours, mins] = timeString.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60)
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    return new Date(start.setDate(diff))
  }

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date)
    end.setDate(end.getDate() + 6)
    return end
  }

  const generateEmptyWeek = (weekStart: Date): DaySchedule[] => {
    const days: DaySchedule[] = []
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[i],
        lessons: []
      })
    }
    return days
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // HH:MM format
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }

  const handleAddLesson = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time })
    setEditingLesson(null)
    setShowAddModal(true)
  }

  const handleEditLesson = (lesson: LessonSlot, date: string) => {
    setSelectedTimeSlot({ date, time: lesson.startTime })
    setEditingLesson(lesson)
    setShowAddModal(true)
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) return

    try {
      await apiService.teacherSchedule.deleteLesson(lessonId)
      loadWeekSchedule() // Reload to reflect changes
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('שגיאה במחיקת השיעור')
    }
  }

  const getLessonForTimeSlot = (date: string, time: string) => {
    const day = weekSchedule?.days.find(d => d.date === date)
    return day?.lessons.find(lesson => lesson.startTime === time)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען לוח זמנים...</div>
        </div>
      </div>
    )
  }

  if (error && !weekSchedule) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-reisinger-yonatan">{error}</div>
      </div>
    )
  }

  const timeSlots = getTimeSlots()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            לוח זמנים שבועי
          </h3>
          <p className="text-gray-600 mt-1">
            {weekSchedule && `${formatDate(weekSchedule.weekStart.toISOString().split('T')[0])} - ${formatDate(weekSchedule.weekEnd.toISOString().split('T')[0])}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-reisinger-yonatan"
          >
            השבוע
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 bg-gray-50 font-medium text-gray-700 font-reisinger-yonatan">
            שעה
          </div>
          {weekSchedule?.days.map((day) => (
            <div key={day.date} className="p-3 bg-gray-50 text-center">
              <div className="font-medium text-gray-900 font-reisinger-yonatan">
                {day.dayName}
              </div>
              <div className="text-sm text-gray-500 font-reisinger-yonatan">
                {formatDate(day.date)}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-3 bg-gray-50 text-sm font-medium text-gray-600 font-reisinger-yonatan">
                {formatTime(time)}
              </div>
              {weekSchedule?.days.map((day) => {
                const lesson = getLessonForTimeSlot(day.date, time)
                return (
                  <div key={`${day.date}-${time}`} className="p-1 border-l border-gray-100 min-h-[60px]">
                    {lesson ? (
                      <div 
                        className={`h-full p-2 rounded text-xs font-reisinger-yonatan cursor-pointer group relative transition-all hover:scale-[1.02] ${
                          lesson.status === 'available' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300' :
                          lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 shadow-sm' :
                          lesson.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300' :
                          'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                        }`}
                        title={lesson.lessonType === 'availability' ? lesson.notes : `${lesson.studentName}${lesson.instrument ? ' - ' + lesson.instrument : ''}${lesson.studentStage ? ' (שלב ' + lesson.studentStage + ')' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {lesson.lessonType === 'availability' ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-60" />
                                  זמין להוראה
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 opacity-60" />
                                  {lesson.studentName || 'תלמיד'}
                                </span>
                              )}
                            </div>
                            
                            {/* Lesson Details */}
                            <div className="text-[10px] opacity-75 mt-0.5">
                              {formatTime(lesson.startTime)}-{formatTime(lesson.endTime)}
                            </div>
                            
                            {/* Student Details for Actual Lessons */}
                            {lesson.lessonType !== 'availability' && (
                              <div className="mt-1 space-y-0.5">
                                {lesson.instrument && (
                                  <div className="flex items-center gap-1 text-[10px] opacity-80">
                                    <Music className="w-2.5 h-2.5" />
                                    <span className="truncate">{lesson.instrument}</span>
                                    {lesson.studentStage && (
                                      <span className="bg-white bg-opacity-60 px-1 rounded text-[9px]">
                                        שלב {lesson.studentStage}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {lesson.studentClass && (
                                  <div className="text-[10px] opacity-70">
                                    כיתה {lesson.studentClass}
                                  </div>
                                )}
                                {lesson.isRecurring && (
                                  <div className="flex items-center gap-1 text-[9px] opacity-60">
                                    <Star className="w-2 h-2" />
                                    שיעור קבוע
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {lesson.lessonType !== 'availability' ? (
                            // Student lesson actions
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (lesson.studentId) {
                                    window.location.href = `/students/${lesson.studentId}`
                                  }
                                }}
                                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-gray-50"
                                title="צפה בפרטי התלמיד"
                              >
                                <Eye className="w-2.5 h-2.5 text-blue-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditLesson(lesson, day.date)
                                }}
                                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-gray-50"
                                title="ערוך שיעור"
                              >
                                <Edit className="w-2.5 h-2.5 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLesson(lesson.id)
                                }}
                                className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-gray-50"
                                title="מחק שיעור"
                              >
                                <Trash2 className="w-2.5 h-2.5 text-red-600" />
                              </button>
                            </>
                          ) : (
                            // Availability slot action
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddLesson(day.date, lesson.startTime)
                              }}
                              className="p-1 bg-white bg-opacity-90 rounded shadow-sm hover:bg-gray-50"
                              title="קבע שיעור"
                            >
                              <Plus className="w-2.5 h-2.5 text-green-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddLesson(day.date, time)}
                        className="w-full h-full flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all group"
                        title="הוסף שיעור"
                      >
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900 font-reisinger-yonatan">
              שיעורים קבועים
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-reisinger-yonatan">
            {weekSchedule?.days.reduce((total, day) => 
              total + day.lessons.filter(lesson => lesson.lessonType !== 'availability').length, 0) || 0}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            השבוע הנוכחי
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900 font-reisinger-yonatan">
              שעות הוראה
            </span>
          </div>
          <div className="text-2xl font-bold text-green-900 mt-2 font-reisinger-yonatan">
            {weekSchedule?.days.reduce((total, day) => {
              return total + day.lessons.filter(lesson => lesson.lessonType !== 'availability').reduce((dayTotal, lesson) => {
                const start = new Date(`2000-01-01T${lesson.startTime}`)
                const end = new Date(`2000-01-01T${lesson.endTime}`)
                return dayTotal + ((end.getTime() - start.getTime()) / (1000 * 60 * 60))
              }, 0)
            }, 0)?.toFixed(1) || '0'}
          </div>
          <div className="text-xs text-green-700 mt-1">
            שעות בפועל
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900 font-reisinger-yonatan">
              תלמידים פעילים
            </span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2 font-reisinger-yonatan">
            {new Set(
              weekSchedule?.days.flatMap(day => 
                day.lessons.filter(lesson => lesson.lessonType !== 'availability')
                  .map(lesson => lesson.studentId).filter(Boolean)
              ) || []
            ).size}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            השבוע הזה
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-900 font-reisinger-yonatan">
              זמינות
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 mt-2 font-reisinger-yonatan">
            {weekSchedule?.days.reduce((total, day) => 
              total + day.lessons.filter(lesson => lesson.lessonType === 'availability').length, 0) || 0}
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            חלונות זמן פנויים
          </div>
        </div>
      </div>

      {/* Add/Edit Lesson Modal */}
      {showAddModal && (
        <LessonModal
          lesson={editingLesson}
          timeSlot={selectedTimeSlot}
          onClose={() => {
            setShowAddModal(false)
            setSelectedTimeSlot(null)
            setEditingLesson(null)
          }}
          onSubmit={() => {
            setShowAddModal(false)
            setSelectedTimeSlot(null)
            setEditingLesson(null)
            loadWeekSchedule()
          }}
        />
      )}
    </div>
  )
}

// Lesson Modal Component
interface LessonModalProps {
  lesson: LessonSlot | null
  timeSlot: { date: string; time: string } | null
  onClose: () => void
  onSubmit: () => void
}

function LessonModal({ lesson, timeSlot, onClose, onSubmit }: LessonModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    startTime: lesson?.startTime || timeSlot?.time || '',
    endTime: lesson?.endTime || '',
    studentName: lesson?.studentName || '',
    studentId: lesson?.studentId || '',
    instrument: lesson?.instrument || '',
    lessonType: lesson?.lessonType || 'individual' as 'individual' | 'group',
    status: lesson?.status || 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    notes: lesson?.notes || ''
  })
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStudents()
    
    // Set default end time if start time is provided
    if (formData.startTime && !formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`)
      start.setMinutes(start.getMinutes() + 60) // Default 1 hour lesson
      setFormData(prev => ({
        ...prev,
        endTime: start.toTimeString().slice(0, 5)
      }))
    }
  }, [formData.startTime])

  const loadStudents = async () => {
    try {
      const teacherId = user?._id
      if (!teacherId) return
      
      const students = await apiService.teachers.getTeacherStudents(teacherId)
      
      // Map backend data to frontend format
      const mappedStudents = students.map(student => ({
        id: student._id,
        firstName: student.personalInfo?.firstName || '',
        lastName: student.personalInfo?.lastName || '',
        instrument: student.primaryInstrument || ''
      }))
      
      setStudents(mappedStudents)
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const teacherId = user?._id
      
      const lessonData = {
        ...formData,
        teacherId,
        date: timeSlot?.date,
        studentId: formData.studentId || undefined
      }

      if (lesson) {
        // Update existing lesson
        await apiService.teacherSchedule.updateLesson(lesson.id, lessonData)
      } else {
        // Create new lesson
        await apiService.teacherSchedule.createLesson(lessonData)
      }
      
      onSubmit()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('שגיאה בשמירת השיעור')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {lesson ? 'עריכת שיעור' : 'הוספת שיעור חדש'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת התחלה *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת סיום *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תלמיד
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => {
                const selectedStudent = students.find(s => s.id === e.target.value)
                setFormData(prev => ({
                  ...prev,
                  studentId: e.target.value,
                  studentName: selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : '',
                  instrument: selectedStudent?.instrument || ''
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר תלמיד</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                  {student.instrument && ` - ${student.instrument}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              כלי נגינה
            </label>
            <input
              type="text"
              value={formData.instrument}
              onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                סוג שיעור
              </label>
              <select
                value={formData.lessonType}
                onChange={(e) => setFormData(prev => ({ ...prev, lessonType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="individual">שיעור פרטי</option>
                <option value="group">שיעור קבוצתי</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                סטטוס
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="scheduled">מתוכנן</option>
                <option value="completed">הושלם</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                lesson ? 'עדכן' : 'הוסף'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
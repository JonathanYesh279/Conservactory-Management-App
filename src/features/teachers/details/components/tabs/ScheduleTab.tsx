/**
 * Schedule Tab Component
 * 
 * Displays teacher's weekly calendar with all activities:
 * - Individual lessons and time blocks
 * - Orchestra conducting sessions
 * - Ensemble activities
 * - Real calendar dates with proper scheduling
 */

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Users, AlertCircle } from 'lucide-react'
import { Teacher } from '../../types'
import TeacherWeeklyCalendar from '../../../../../components/schedule/TeacherWeeklyCalendar'
import { orchestraEnrollmentApi } from '../../../../../services/orchestraEnrollmentApi'
import apiService from '../../../../../services/apiService'

interface ScheduleTabProps {
  teacher: Teacher
  teacherId: string
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ teacher, teacherId }) => {
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null)
  const [isAddingTimeBlock, setIsAddingTimeBlock] = useState(false)
  const [orchestraActivities, setOrchestraActivities] = useState<any[]>([])
  const [ensembleActivities, setEnsembleActivities] = useState<any[]>([])
  const [teacherLessons, setTeacherLessons] = useState<any[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [showLegacyView, setShowLegacyView] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [teacherData, setTeacherData] = useState(teacher)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{timeBlock: any} | null>(null)

  // Load orchestra and ensemble activities
  useEffect(() => {
    const loadConductingActivities = async () => {
      if (!teacher.conducting) return
      
      setIsLoadingActivities(true)
      try {
        const orchestraPromises = (teacher.conducting.orchestraIds || []).map(async (id: string) => {
          try {
            const orchestra = await orchestraEnrollmentApi.getCurrentOrchestraEnrollments([id])
            return orchestra[0] ? {
              _id: orchestra[0]._id,
              name: orchestra[0].name,
              type: 'orchestra' as const,
              rehearsalTimes: orchestra[0].rehearsalTimes || [],
              location: 'אולם התזמורת',
              participants: orchestra[0].currentMembers || 0
            } : null
          } catch (error) {
            console.warn(`Failed to load orchestra ${id}:`, error)
            return null
          }
        })
        
        const ensemblePromises = (teacher.conducting.ensemblesIds || []).map(async (id: string) => {
          try {
            const ensemble = await orchestraEnrollmentApi.getCurrentEnsembleEnrollments([id])
            return ensemble[0] ? {
              _id: ensemble[0]._id,
              name: ensemble[0].name,
              type: 'ensemble' as const,
              rehearsalTimes: ensemble[0].rehearsalTimes || [],
              location: 'חדר האנסמבל',
              participants: ensemble[0].currentMembers || 0
            } : null
          } catch (error) {
            console.warn(`Failed to load ensemble ${id}:`, error)
            return null
          }
        })
        
        const [orchestras, ensembles] = await Promise.all([
          Promise.allSettled(orchestraPromises),
          Promise.allSettled(ensemblePromises)
        ])
        
        const loadedOrchestras = orchestras
          .filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value)
        
        const loadedEnsembles = ensembles
          .filter((result): result is PromiseFulfilledResult<any> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value)
        
        // Convert to calendar activities format
        const orchestraCalendarActivities = loadedOrchestras.flatMap(orchestra => 
          orchestra.rehearsalTimes.map(time => ({
            _id: `${orchestra._id}-${time.day}-${time.startTime}`,
            name: orchestra.name,
            day: time.day,
            startTime: time.startTime,
            endTime: time.endTime,
            location: time.location || orchestra.location,
            participants: orchestra.participants,
            type: 'orchestra' as const
          }))
        )
        
        const ensembleCalendarActivities = loadedEnsembles.flatMap(ensemble => 
          ensemble.rehearsalTimes.map(time => ({
            _id: `${ensemble._id}-${time.day}-${time.startTime}`,
            name: ensemble.name,
            day: time.day,
            startTime: time.startTime,
            endTime: time.endTime,
            location: time.location || ensemble.location,
            participants: ensemble.participants,
            type: 'ensemble' as const
          }))
        )
        
        setOrchestraActivities(orchestraCalendarActivities)
        setEnsembleActivities(ensembleCalendarActivities)
      } catch (error) {
        console.error('Failed to load conducting activities:', error)
      } finally {
        setIsLoadingActivities(false)
      }
    }
    
    loadConductingActivities()
  }, [teacher.conducting])

  // Load teacher lessons
  useEffect(() => {
    const loadTeacherLessons = async () => {
      if (!teacherId) return
      
      try {
        console.log('🔄 Loading teacher lessons for ID:', teacherId)
        const lessonsData = await apiService.teachers.getTeacherLessons(teacherId)
        console.log('✅ Teacher lessons loaded:', lessonsData)
        
        // Extract lessons array from response
        const lessons = lessonsData?.lessons || lessonsData?.data?.lessons || []
        setTeacherLessons(lessons)
        console.log(`📚 Set ${lessons.length} lessons for teacher`)
      } catch (error) {
        console.error('❌ Failed to load teacher lessons:', error)
        setTeacherLessons([])
      }
    }
    
    loadTeacherLessons()
  }, [teacherId])

  // Days of the week in Hebrew
  const daysOfWeek = [
    'ראשון',
    'שני', 
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת'
  ]

  // Refresh teacher data from API
  const refreshTeacherData = async () => {
    try {
      const updatedTeacher = await apiService.teachers.getTeacher(teacherId)
      setTeacherData(updatedTeacher)
    } catch (error) {
      console.error('Failed to refresh teacher data:', error)
    }
  }

  // Combine time blocks and schedule data for יום לימוד
  const allTeachingDays = useMemo(() => {
    const days = []
    
    // Add from timeBlocks (modern structure)
    if (teacherData.teaching?.timeBlocks) {
      days.push(...teacherData.teaching.timeBlocks)
    }
    
    // Add from schedule (legacy structure) - convert to timeBlocks format
    if (teacherData.teaching?.schedule) {
      teacherData.teaching.schedule.forEach(scheduleSlot => {
        // Only add if it doesn't have a studentId (actual lessons have studentId)
        if (!scheduleSlot.studentId) {
          days.push({
            _id: scheduleSlot._id,
            day: scheduleSlot.day,
            startTime: scheduleSlot.startTime,
            endTime: scheduleSlot.endTime,
            totalDuration: scheduleSlot.duration || 0,
            location: scheduleSlot.location,
            notes: scheduleSlot.notes,
            isActive: scheduleSlot.isAvailable !== false,
            assignedLessons: [],
            isFromSchedule: true // Flag to know which API to use for updates
          })
        }
      })
    }
    
    return days
  }, [teacherData.teaching?.timeBlocks, teacherData.teaching?.schedule])

  // Group teaching days by day
  const timeBlocksByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = allTeachingDays.filter(block => block.day === day) || []
    return acc
  }, {})

  const getTotalWeeklyHours = () => {
    return allTeachingDays.reduce((total, block) => total + (block.totalDuration || 0), 0) / 60 || 0
  }

  const getTotalStudentsInSchedule = () => {
    const studentIds = new Set()
    teacherData.teaching?.schedule?.forEach(slot => {
      if (slot.studentId) studentIds.add(slot.studentId)
    })
    return studentIds.size
  }

  // Handle lesson updates
  const handleLessonUpdate = async (updatedLesson: any) => {
    try {
      console.log('🔄 Updating lesson via student record:', updatedLesson)
      console.log('🆔 Student ID:', updatedLesson.studentId)
      console.log('👨‍🏫 Teacher ID:', updatedLesson.teacherId || teacherId)
      console.log('📝 Update data:', {
        day: updatedLesson.day,
        startTime: updatedLesson.startTime,
        endTime: updatedLesson.endTime,
        duration: updatedLesson.duration
      })
      
      // Validate required fields
      if (!updatedLesson.studentId) {
        throw new Error('Student ID is missing')
      }
      
      // First, get the current student data to find the teacher assignment
      const currentStudent = await apiService.students.getStudentById(updatedLesson.studentId)
      console.log('📋 Current student data loaded:', currentStudent.personalInfo?.fullName)
      
      if (!currentStudent.teacherAssignments || currentStudent.teacherAssignments.length === 0) {
        throw new Error('No teacher assignments found for this student')
      }
      
      // Find the specific teacher assignment to update
      const currentTeacherId = updatedLesson.teacherId || teacherId
      const assignmentIndex = currentStudent.teacherAssignments.findIndex(
        assignment => assignment.teacherId === currentTeacherId && assignment.isActive
      )
      
      if (assignmentIndex === -1) {
        throw new Error(`No active assignment found for teacher ${currentTeacherId}`)
      }
      
      console.log(`🎯 Found teacher assignment at index ${assignmentIndex}`)
      
      // Create updated teacher assignments array
      const updatedAssignments = [...currentStudent.teacherAssignments]
      const currentAssignment = updatedAssignments[assignmentIndex]
      
      // Calculate end time
      const calculateEndTime = (startTime: string, duration: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(totalMinutes / 60)
        const endMins = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }
      
      // Update the assignment with new schedule
      updatedAssignments[assignmentIndex] = {
        ...currentAssignment,
        day: updatedLesson.day,
        time: updatedLesson.startTime,
        duration: updatedLesson.duration,
        scheduleInfo: {
          ...currentAssignment.scheduleInfo,
          day: updatedLesson.day,
          startTime: updatedLesson.startTime,
          endTime: calculateEndTime(updatedLesson.startTime, updatedLesson.duration),
          duration: updatedLesson.duration,
          updatedAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
      
      console.log('📤 Updating student record with new assignment:', updatedAssignments[assignmentIndex])
      
      // Update the student record with the modified teacher assignments
      const result = await apiService.students.updateStudent(updatedLesson.studentId, {
        teacherAssignments: updatedAssignments
      })
      
      console.log('✅ Student updated successfully:', result.personalInfo?.fullName)
      
      // Refresh teacher lessons to reflect the changes
      const lessonsData = await apiService.teachers.getTeacherLessons(teacherId)
      const lessons = lessonsData?.lessons || lessonsData?.data?.lessons || []
      setTeacherLessons(lessons)
      
      console.log('✅ Teacher lessons refreshed - new count:', lessons.length)
    } catch (error) {
      console.error('❌ Failed to update lesson:', error)
      console.error('❌ Error details:', error.message)
      throw error // Re-throw so the modal can show the error
    }
  }

  const totalActivities = orchestraActivities.length + ensembleActivities.length
  const totalWeeklyHours = getTotalWeeklyHours()
  const totalTimeBlocks = allTeachingDays.length || 0
  const totalStudents = getTotalStudentsInSchedule()

  return (
    <div className="p-6 space-y-6">
      {/* Header with Statistics */}
      <div className="flex justify-end items-start">
        {isLoadingActivities && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mr-4">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            טוען פעילויות הניצוח...
          </div>
        )}
        
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(totalWeeklyHours)}
            </div>
            <div className="text-gray-600">שעות שבועיות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalTimeBlocks}
            </div>
            <div className="text-gray-600">ימי לימוד</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalStudents}
            </div>
            <div className="text-gray-600">תלמידים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalActivities}
            </div>
            <div className="text-gray-600">הרכבים</div>
          </div>
        </div>
      </div>
      
      {/* View Toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLegacyView(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !showLegacyView
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            לוח זמנים שבועי
          </button>
          <button
            onClick={() => setShowLegacyView(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLegacyView
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ניהול ימי לימוד
          </button>
        </div>
        
        {totalActivities > 0 && (
          <div className="text-sm text-gray-600">
            מנצח על {totalActivities} הרכבים
          </div>
        )}
      </div>

      {/* Main Calendar View */}
      {!showLegacyView ? (
        <TeacherWeeklyCalendar
          teacher={teacherData}
          timeBlocks={allTeachingDays}
          lessons={teacherLessons}
          orchestraActivities={orchestraActivities}
          className=""
          showNavigation={true}
          onLessonUpdate={handleLessonUpdate}
        />
      ) : (
        /* Teaching Days Management View */
        <div className="space-y-6">
          {/* Teaching Days Cards */}
          {allTeachingDays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTeachingDays.map((timeBlock, index) => (
                <div
                  key={timeBlock._id || index}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <h3 className="text-lg font-bold text-gray-900">{timeBlock.day}</h3>
                    </div>
                    {timeBlock.isActive && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        פעיל
                      </span>
                    )}
                  </div>

                  {/* Time Information */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {timeBlock.startTime} - {timeBlock.endTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-sm">משך:</span>
                      <span className="font-medium text-blue-600">
                        {Math.floor(timeBlock.totalDuration / 60)} שעות
                        {timeBlock.totalDuration % 60 !== 0 && ` ו-${timeBlock.totalDuration % 60} דקות`}
                      </span>
                    </div>

                    {timeBlock.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{timeBlock.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {timeBlock.assignedLessons?.length || 0} שיעורים מתוכננים
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {timeBlock.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{timeBlock.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedTimeBlock(timeBlock)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4 inline-block ml-1" />
                      ערוך
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation({timeBlock})}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 inline-block ml-1" />
                      {isUpdating ? 'מוחק...' : 'מחק'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">אין ימי לימוד מוגדרים</h3>
              <p className="text-gray-600 mb-6">
                טרם הוגדרו ימי לימוד עבור מורה זה. הגדר ימי לימוד כדי לאפשר תזמון שיעורים.
              </p>
              <button
                onClick={() => setIsAddingTimeBlock(true)}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                הוסף יום לימוד ראשון
              </button>
            </div>
          )}

          {/* Add New Teaching Day Button */}
          {allTeachingDays.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => setIsAddingTimeBlock(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                הוסף יום לימוד חדש
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Teaching Day Modal */}
      {selectedTimeBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                ערוך יום לימוד - {selectedTimeBlock.day}
              </h3>
              <button
                onClick={() => setSelectedTimeBlock(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן התחלה
                  </label>
                  <input
                    type="time"
                    defaultValue={selectedTimeBlock.startTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    זמן סיום
                  </label>
                  <input
                    type="time"
                    defaultValue={selectedTimeBlock.endTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מיקום
                </label>
                <input
                  type="text"
                  defaultValue={selectedTimeBlock.location}
                  placeholder="חדר, אולם, או מיקום אחר"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  הערות
                </label>
                <textarea
                  defaultValue={selectedTimeBlock.notes}
                  placeholder="הערות נוספות על יום הלימוד..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  defaultChecked={selectedTimeBlock.isActive}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  יום לימוד פעיל (זמין לקביעת שיעורים)
                </label>
              </div>
              
              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                  disabled={isUpdating}
                  onClick={async (e) => {
                    e.preventDefault()
                    
                    const form = e.target.closest('form')
                    const formData = new FormData(form)
                    const timeInputs = form.querySelectorAll('input[type="time"]')
                    const startTime = (timeInputs[0] as HTMLInputElement).value
                    const endTime = (timeInputs[1] as HTMLInputElement).value
                    const location = (form.querySelector('input[type="text"]') as HTMLInputElement).value
                    const notes = (form.querySelector('textarea') as HTMLTextAreaElement).value
                    const isActive = (form.querySelector('input[type="checkbox"]') as HTMLInputElement).checked
                    
                    // Calculate duration in minutes
                    const calculateDuration = (start: string, end: string): number => {
                      const [startHour, startMin] = start.split(':').map(Number)
                      const [endHour, endMin] = end.split(':').map(Number)
                      const startMinutes = startHour * 60 + startMin
                      const endMinutes = endHour * 60 + endMin
                      return endMinutes - startMinutes
                    }
                    
                    const duration = calculateDuration(startTime, endTime)
                    
                    try {
                      setIsUpdating(true)
                      
                      if (selectedTimeBlock.isFromSchedule) {
                        // Simple approach - update just the schedule array
                        const updatedSchedule = teacherData.teaching.schedule.map(slot => 
                          slot._id === selectedTimeBlock._id ? {
                            _id: slot._id,
                            day: slot.day,
                            startTime,
                            endTime,
                            duration,
                            location,
                            notes: notes || null,
                            isAvailable: isActive,
                            studentId: slot.studentId,
                            recurring: slot.recurring
                          } : slot
                        )
                        
                        console.log('🔄 Simplified update approach')
                        console.log('🔄 Updated schedule entry:', updatedSchedule.find(s => s._id === selectedTimeBlock._id))
                        
                        // Get the raw token and add Bearer prefix
                        const rawToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
                        
                        if (!rawToken) {
                          throw new Error('No authentication token found')
                        }
                        
                        console.log('🔑 Using token:', rawToken ? 'Token exists' : 'No token found')
                        console.log('📊 Duration calculated:', duration, 'minutes')
                        console.log('📝 Time range:', startTime, '-', endTime)
                        
                        // Try direct API call with proper Bearer token format
                        const response = await fetch(`http://localhost:3001/api/teacher/${teacherId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${rawToken}` // Add Bearer prefix
                          },
                          body: JSON.stringify({
                            teaching: {
                              ...teacherData.teaching,
                              schedule: updatedSchedule
                            }
                          })
                        })
                        
                        if (!response.ok) {
                          const errorText = await response.text()
                          console.error('❌ Server response:', errorText)
                          throw new Error(`HTTP ${response.status}: ${errorText}`)
                        }
                        
                        const result = await response.json()
                        console.log('✅ Update successful:', result)
                      } else {
                        // For modern timeBlocks, use the specific API endpoint
                        await apiService.teachers.updateTimeBlock(teacherId, selectedTimeBlock._id, {
                          startTime,
                          endTime,
                          totalDuration: duration,
                          location,
                          notes,
                          isActive
                        })
                      }
                      
                      await refreshTeacherData()
                      setSelectedTimeBlock(null)
                      console.log('✅ Successfully updated teaching day')
                    } catch (error) {
                      console.error('❌ Failed to update teaching day:', error)
                      console.error('Error details:', error.response?.data || error.message)
                      alert('שגיאה בעדכון יום הלימוד. אנא נסה שוב.')
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                >
                  {isUpdating ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTimeBlock(null)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Calendar Legend */}
      {!showLegacyView && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">מקרא</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span className="text-gray-700">שיעורים פרטיים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
              <span className="text-gray-700">תזמורות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-gray-700">אנסמבלים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
              <span className="text-gray-700">זמן פנוי</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              מחיקת יום לימוד
            </h3>
            <p className="text-gray-600 text-center mb-6">
              האם אתה בטוח שברצונך למחוק את יום הלימוד ביום {deleteConfirmation.timeBlock.day}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={async () => {
                  const timeBlock = deleteConfirmation.timeBlock
                  setDeleteConfirmation(null)
                  
                  try {
                    setIsUpdating(true)
                    if (timeBlock.isFromSchedule) {
                      // For legacy schedule data, we need to update the teacher's schedule array
                      const updatedSchedule = teacherData.teaching.schedule.filter(
                        slot => slot._id !== timeBlock._id
                      )
                      
                      const updateData = {
                        teaching: {
                          ...teacherData.teaching,
                          schedule: updatedSchedule
                        }
                      }
                      
                      console.log('🗑️ Deleting teaching day with data:', updateData)
                      await apiService.teachers.updateTeacher(teacherId, updateData)
                    } else {
                      // For modern timeBlocks, use the specific API endpoint
                      await apiService.teachers.deleteTimeBlock(teacherId, timeBlock._id)
                    }
                    await refreshTeacherData()
                    console.log('✅ Successfully deleted teaching day:', timeBlock.day)
                  } catch (error) {
                    console.error('❌ Failed to delete teaching day:', error)
                    console.error('Error details:', error.response?.data || error.message)
                    alert('שגיאה במחיקת יום הלימוד. אנא נסה שוב.')
                  } finally {
                    setIsUpdating(false)
                  }
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isUpdating ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTab
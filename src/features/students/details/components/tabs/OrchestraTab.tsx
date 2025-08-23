/**
 * Orchestra Tab Component - Simplified Implementation
 * 
 * Displays student's current orchestra enrollments and provides enrollment management
 * Works with actual student data and API structure
 */

import { useState, useEffect } from 'react'
import { Music, Users, Plus, Trash2, AlertCircle, Clock, MapPin, CheckCircle, X } from 'lucide-react'
import apiService from '../../../../../services/apiService'

interface OrchestraTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const OrchestraTab: React.FC<OrchestraTabProps> = ({ student, studentId, isLoading }) => {
  const [activeView, setActiveView] = useState<'current' | 'manage'>('current')
  const [enrolledOrchestras, setEnrolledOrchestras] = useState<any[]>([])
  const [availableOrchestras, setAvailableOrchestras] = useState<any[]>([])
  const [isLoadingOrchestras, setIsLoadingOrchestras] = useState(false)
  const [enrollmentInProgress, setEnrollmentInProgress] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)

  // Get student's current instrument (for filtering compatible orchestras)
  const studentInstrument = student?.teacherAssignments?.[0]?.instrument || 'חצוצרה'
  const studentGrade = student?.academicInfo?.class || 'ז'

  // Fetch enrolled orchestras details
  useEffect(() => {
    const fetchEnrolledOrchestras = async () => {
      if (!student?.enrollments?.orchestraIds || student.enrollments.orchestraIds.length === 0) {
        setEnrolledOrchestras([])
        return
      }

      try {
        setIsLoadingOrchestras(true)
        const orchestraPromises = student.enrollments.orchestraIds.map(async (orchestraId: string) => {
          try {
            const orchestra = await apiService.orchestras.getOrchestra(orchestraId)
            return { ...orchestra, enrollmentStatus: 'enrolled' }
          } catch (error) {
            console.warn(`Failed to fetch orchestra ${orchestraId}:`, error)
            return {
              _id: orchestraId,
              name: 'תזמורת לא זמינה',
              error: true,
              enrollmentStatus: 'enrolled'
            }
          }
        })

        const orchestras = await Promise.all(orchestraPromises)
        setEnrolledOrchestras(orchestras)
      } catch (error) {
        console.error('Error fetching enrolled orchestras:', error)
      } finally {
        setIsLoadingOrchestras(false)
      }
    }

    fetchEnrolledOrchestras()
  }, [student?.enrollments?.orchestraIds])

  // Fetch available orchestras for enrollment
  useEffect(() => {
    const fetchAvailableOrchestras = async () => {
      if (activeView !== 'manage') return

      try {
        setIsLoadingOrchestras(true)
        const allOrchestras = await apiService.orchestras.getOrchestras()
        
        // Filter out already enrolled orchestras and apply business rules
        const available = allOrchestras.filter((orchestra: any) => {
          // Skip if already enrolled
          if (student?.enrollments?.orchestraIds?.includes(orchestra._id)) return false
          
          // Check instrument compatibility (if orchestra specifies required instruments)
          if (orchestra.requiredInstruments && orchestra.requiredInstruments.length > 0) {
            if (!orchestra.requiredInstruments.includes(studentInstrument)) return false
          }
          
          // Check grade level requirements (if specified)
          if (orchestra.gradeRequirements && orchestra.gradeRequirements.length > 0) {
            if (!orchestra.gradeRequirements.includes(studentGrade)) return false
          }
          
          return true
        })

        setAvailableOrchestras(available)
      } catch (error) {
        console.error('Error fetching available orchestras:', error)
        setAvailableOrchestras([])
      } finally {
        setIsLoadingOrchestras(false)
      }
    }

    fetchAvailableOrchestras()
  }, [activeView, student?.enrollments?.orchestraIds, studentInstrument, studentGrade])

  // Check for schedule conflicts
  const checkScheduleConflict = (orchestraSchedule: any) => {
    if (!orchestraSchedule || !student?.teacherAssignments) return false
    
    const studentLessonDay = 2 // Tuesday (0=Sunday, 1=Monday, 2=Tuesday...)
    const studentLessonStart = '14:30'
    const studentLessonEnd = '15:15'
    
    return orchestraSchedule.some((rehearsal: any) => {
      if (rehearsal.dayOfWeek !== studentLessonDay) return false
      
      const rehearsalStart = rehearsal.startTime
      const rehearsalEnd = rehearsal.endTime
      
      // Check for time overlap
      return (rehearsalStart < studentLessonEnd && rehearsalEnd > studentLessonStart)
    })
  }

  // Enroll in orchestra
  const handleEnrollment = async (orchestraId: string) => {
    try {
      setEnrollmentInProgress(orchestraId)
      
      const updatedOrchestras = [...(student.enrollments?.orchestraIds || []), orchestraId]
      
      await apiService.students.updateStudent(studentId, {
        enrollments: {
          ...student.enrollments,
          orchestraIds: updatedOrchestras
        }
      })
      
      // Update local state optimistically
      const enrolledOrchestra = availableOrchestras.find(o => o._id === orchestraId)
      if (enrolledOrchestra) {
        setEnrolledOrchestras(prev => [...prev, { ...enrolledOrchestra, enrollmentStatus: 'enrolled' }])
        setAvailableOrchestras(prev => prev.filter(o => o._id !== orchestraId))
      }
      
      // Success feedback would go here (toast notification)
      console.log(`Successfully enrolled in orchestra ${orchestraId}`)
      
    } catch (error) {
      console.error('Error enrolling in orchestra:', error)
      // Error feedback would go here
    } finally {
      setEnrollmentInProgress(null)
    }
  }

  // Remove enrollment
  const handleUnenrollment = async (orchestraId: string) => {
    try {
      setEnrollmentInProgress(orchestraId)
      
      const updatedOrchestras = (student.enrollments?.orchestraIds || []).filter((id: string) => id !== orchestraId)
      
      await apiService.students.updateStudent(studentId, {
        enrollments: {
          ...student.enrollments,
          orchestraIds: updatedOrchestras
        }
      })
      
      // Update local state optimistically
      const unenrolledOrchestra = enrolledOrchestras.find(o => o._id === orchestraId)
      if (unenrolledOrchestra && !unenrolledOrchestra.error) {
        setAvailableOrchestras(prev => [...prev, unenrolledOrchestra])
      }
      setEnrolledOrchestras(prev => prev.filter(o => o._id !== orchestraId))
      
      console.log(`Successfully unenrolled from orchestra ${orchestraId}`)
      
    } catch (error) {
      console.error('Error unenrolling from orchestra:', error)
    } finally {
      setEnrollmentInProgress(null)
      setShowConfirmDialog(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  const renderCurrentEnrollments = () => {
    if (isLoadingOrchestras) {
      return (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
          ))}
        </div>
      )
    }

    if (enrolledOrchestras.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין הרשמות קיימות</h3>
          <p className="text-gray-500 mb-6">התלמיד אינו רשום כרגע לתזמורות</p>
          <button
            onClick={() => setActiveView('manage')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            צפה בתזמורות זמינות
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-600" />
          תזמורות רשומות ({enrolledOrchestras.length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledOrchestras.map((orchestra) => (
            <div 
              key={orchestra._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{orchestra.name}</h4>
                  {orchestra.conductor && (
                    <p className="text-gray-600 mt-1">מנצח: {orchestra.conductor}</p>
                  )}
                  {orchestra.error && (
                    <p className="text-red-600 text-sm mt-1">שגיאה בטעינת פרטי התזמורת</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    רשום
                  </span>
                  
                  <button
                    onClick={() => setShowConfirmDialog(orchestra._id)}
                    disabled={enrollmentInProgress === orchestra._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="בטל הרשמה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {orchestra.description && (
                <p className="text-gray-600 mb-4">{orchestra.description}</p>
              )}

              {/* Rehearsal Schedule */}
              {orchestra.rehearsalSchedule && orchestra.rehearsalSchedule.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    זמני חזרות
                  </h5>
                  <div className="space-y-1">
                    {orchestra.rehearsalSchedule.map((rehearsal: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
                        <span>{rehearsal.day || `יום ${index + 1}`}</span>
                        <span>•</span>
                        <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                        {rehearsal.location && (
                          <>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{rehearsal.location}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capacity Info */}
              {orchestra.capacity && (
                <div className="text-sm text-gray-600">
                  קיבולת: {orchestra.currentMembers || 0} / {orchestra.capacity} חברים
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderManagementView = () => {
    if (isLoadingOrchestras) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            תזמורות זמינות להרשמה
          </h3>
          <div className="text-sm text-gray-600">
            מציג תזמורות התואמות לכלי: {studentInstrument}
          </div>
        </div>

        {availableOrchestras.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">אין תזמורות זמינות</h4>
            <p className="text-gray-500">
              כל התזמורות התואמות לכלי שלך מלאות או שכבר נרשמת אליהן
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableOrchestras.map((orchestra) => {
              const hasConflict = checkScheduleConflict(orchestra.rehearsalSchedule)
              const isFull = orchestra.capacity && orchestra.currentMembers >= orchestra.capacity
              const canEnroll = !hasConflict && !isFull
              
              return (
                <div 
                  key={orchestra._id}
                  className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
                    !canEnroll ? 'border-gray-200 opacity-75' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{orchestra.name}</h4>
                      {orchestra.conductor && (
                        <p className="text-gray-600 mt-1">מנצח: {orchestra.conductor}</p>
                      )}
                      
                      {/* Level and Type */}
                      <div className="mt-2 flex items-center gap-2">
                        {orchestra.level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            orchestra.level === 'beginner' ? 'bg-green-100 text-green-800' :
                            orchestra.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            orchestra.level === 'advanced' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {orchestra.level === 'beginner' ? 'מתחילים' :
                             orchestra.level === 'intermediate' ? 'בינוני' :
                             orchestra.level === 'advanced' ? 'מתקדמים' : 'מעורב'}
                          </span>
                        )}
                        
                        {orchestra.gradeRequirements && orchestra.gradeRequirements.includes(studentGrade) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            מתאים לכיתה {studentGrade}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleEnrollment(orchestra._id)}
                      disabled={!canEnroll || enrollmentInProgress === orchestra._id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        canEnroll
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {enrollmentInProgress === orchestra._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          נרשם...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          הרשם
                        </>
                      )}
                    </button>
                  </div>

                  {orchestra.description && (
                    <p className="text-gray-600 mb-4">{orchestra.description}</p>
                  )}

                  {/* Warning Messages */}
                  {hasConflict && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">התנגשות בלוח זמנים</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        זמני החזרות מתנגשים עם השיעור שלך בימי שלישי 14:30-15:15
                      </p>
                    </div>
                  )}
                  
                  {isFull && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">התזמורת מלאה</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        כל המקומות בתזמורת תפוסים
                      </p>
                    </div>
                  )}

                  {/* Rehearsal Schedule */}
                  {orchestra.rehearsalSchedule && orchestra.rehearsalSchedule.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        זמני חזרות
                      </h5>
                      <div className="space-y-1">
                        {orchestra.rehearsalSchedule.map((rehearsal: any, index: number) => (
                          <div 
                            key={index} 
                            className={`text-sm p-2 rounded flex items-center gap-2 ${
                              hasConflict ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span>{rehearsal.day || `יום ${index + 1}`}</span>
                            <span>•</span>
                            <span>{rehearsal.startTime} - {rehearsal.endTime}</span>
                            {rehearsal.location && (
                              <>
                                <span>•</span>
                                <MapPin className="w-3 h-3" />
                                <span>{rehearsal.location}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Instruments */}
                  {orchestra.requiredInstruments && orchestra.requiredInstruments.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">כלים נדרשים</h5>
                      <div className="flex flex-wrap gap-1">
                        {orchestra.requiredInstruments.map((instrument: string, index: number) => (
                          <span 
                            key={index}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              instrument === studentInstrument
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {instrument}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capacity Info */}
                  {orchestra.capacity && (
                    <div className="text-sm text-gray-600">
                      קיבולת: {orchestra.currentMembers || 0} / {orchestra.capacity} חברים
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">תזמורות והרכבים</h2>
          <p className="text-gray-600 mt-1">
            ניהול הרשמות לתזמורות במוסיקה • כלי: {studentInstrument} • כיתה: {studentGrade}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('current')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'current'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              הרשמות קיימות
            </div>
          </button>
          <button
            onClick={() => setActiveView('manage')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'manage'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הרשמה חדשה
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'current' ? renderCurrentEnrollments() : renderManagementView()}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              בטל הרשמה לתזמורת
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך לבטל את ההרשמה לתזמורת זו? 
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={() => handleUnenrollment(showConfirmDialog)}
                disabled={enrollmentInProgress === showConfirmDialog}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {enrollmentInProgress === showConfirmDialog ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    מבטל...
                  </>
                ) : (
                  'בטל הרשמה'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrchestraTab
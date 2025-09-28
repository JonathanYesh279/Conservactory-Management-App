/**
 * Theory Tab Component - Enhanced with Enrollment Management
 * 
 * Displays student's theory class enrollments and allows enrollment/unenrollment
 */

import { useState, useEffect } from 'react'
import {
  BookOpen, Calendar, TrendingUp, Award, Clock, User, Plus,
  Trash2, AlertCircle, MapPin, CheckCircle, X, Music,
  GraduationCap, Users, Info
} from 'lucide-react'
import apiService from '../../../../../services/apiService'
import { syncStudentTheoryLessons } from '../../../../../utils/syncTheoryLessonsData'
import TeacherNameDisplay from '../../../../../components/TeacherNameDisplay'

interface TheoryTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const TheoryTab: React.FC<TheoryTabProps> = ({ student, studentId, isLoading }) => {
  const [activeView, setActiveView] = useState<'current' | 'manage'>('current')
  const [enrolledTheoryLessons, setEnrolledTheoryLessons] = useState<any[]>([])
  const [availableTheoryLessons, setAvailableTheoryLessons] = useState<any[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [enrollmentInProgress, setEnrollmentInProgress] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)
  const [showDataMismatch, setShowDataMismatch] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Get student's grade level for filtering compatible classes
  const studentGrade = student?.academicInfo?.class || 'ז'
  const studentLevel = student?.theoryLevel || 'beginner'

  // Fetch enrolled theory lessons
  useEffect(() => {
    const fetchEnrolledTheoryLessons = async () => {
      try {
        setIsLoadingLessons(true)
        
        // Get all theory lessons to check enrollment
        const allLessons = await apiService.theoryLessons.getTheoryLessons()
        
        // Find lessons where this student is enrolled
        const enrolledLessons = allLessons.filter((lesson: any) => 
          lesson.studentIds?.includes(studentId) ||
          student?.theoryLessonIds?.includes(lesson._id)
        )
        
        setEnrolledTheoryLessons(enrolledLessons)
        
        // Check for data mismatch
        const studentTheoryLessons = student?.theoryLessonIds || []
        const hasDataMismatch = enrolledLessons.length > 0 && studentTheoryLessons.length === 0
        if (hasDataMismatch) {
          console.warn('⚠️ DATA MISMATCH DETECTED:', {
            enrolledLessonsCount: enrolledLessons.length,
            studentTheoryLessonIds: studentTheoryLessons,
            enrolledLessonIds: enrolledLessons.map(l => l._id)
          })
          setShowDataMismatch(true)
        }
        
        console.log(`Found ${enrolledLessons.length} enrolled theory lessons for student ${studentId}`)
      } catch (error) {
        console.error('Error fetching enrolled theory lessons:', error)
        setEnrolledTheoryLessons([])
      } finally {
        setIsLoadingLessons(false)
      }
    }

    fetchEnrolledTheoryLessons()
  }, [student?.theoryLessonIds, studentId])

  // Fetch available theory lessons for enrollment
  useEffect(() => {
    const fetchAvailableTheoryLessons = async () => {
      if (activeView !== 'manage') return

      try {
        setIsLoadingLessons(true)
        const allLessons = await apiService.theoryLessons.getTheoryLessons()
        
        // Process and filter lessons
        const processedLessons = allLessons.map((lesson: any) => {
          // Check if student is already enrolled
          const isEnrolled = lesson.studentIds?.includes(studentId) || 
                            student?.theoryLessonIds?.includes(lesson._id)
          
          // Check if lesson is full
          const isFull = lesson.maxStudents && lesson.studentIds?.length >= lesson.maxStudents
          
          // Check grade compatibility
          const gradeCompatible = !lesson.targetGrades || 
                                 lesson.targetGrades.length === 0 || 
                                 lesson.targetGrades.includes(studentGrade)
          
          // Check level compatibility
          const levelCompatible = !lesson.level || 
                                 lesson.level === studentLevel || 
                                 lesson.level === 'all'
          
          return {
            ...lesson,
            isEnrolled,
            isFull,
            gradeCompatible,
            levelCompatible,
            isCompatible: gradeCompatible && levelCompatible && !isFull
          }
        })

        // Filter to show only non-enrolled lessons
        const available = processedLessons.filter((lesson: any) => !lesson.isEnrolled)
        
        console.log('Available theory lessons:', available.length)
        setAvailableTheoryLessons(available)
      } catch (error) {
        console.error('Error fetching available theory lessons:', error)
        setAvailableTheoryLessons([])
      } finally {
        setIsLoadingLessons(false)
      }
    }

    fetchAvailableTheoryLessons()
  }, [activeView, student?.theoryLessonIds, studentId, studentGrade, studentLevel])

  // Handle data sync
  const handleSyncData = async () => {
    setIsSyncing(true)
    try {
      const result = await syncStudentTheoryLessons(studentId)
      if (result.success) {
        console.log('✅ Data synced successfully:', result)
        setShowDataMismatch(false)
        // Reload the page to reflect changes
        window.location.reload()
      } else {
        console.error('❌ Sync failed:', result.error)
        alert('Failed to sync data. Please try again.')
      }
    } catch (error) {
      console.error('❌ Sync error:', error)
      alert('An error occurred while syncing data.')
    } finally {
      setIsSyncing(false)
    }
  }

  // Enroll in theory lesson
  const handleEnrollment = async (lessonId: string) => {
    try {
      setEnrollmentInProgress(lessonId)
      
      // Update student's theory lesson enrollments
      const updatedLessonIds = [...(student.theoryLessonIds || []), lessonId]
      
      await apiService.students.updateStudent(studentId, {
        theoryLessonIds: updatedLessonIds
      })
      
      // Also update the theory lesson's enrolled students using the proper API method
      try {
        await apiService.theoryLessons.addStudentToTheory(lessonId, studentId)
      } catch (err) {
        console.error(`Failed to add student to theory lesson ${lessonId}:`, err)
      }
      
      // Update local state
      const enrolledLesson = availableTheoryLessons.find(l => l._id === lessonId)
      if (enrolledLesson) {
        setEnrolledTheoryLessons(prev => [...prev, enrolledLesson])
        setAvailableTheoryLessons(prev => prev.filter(l => l._id !== lessonId))
      }
      
      console.log(`Successfully enrolled in theory lesson ${lessonId}`)
    } catch (error) {
      console.error('Error enrolling in theory lesson:', error)
    } finally {
      setEnrollmentInProgress(null)
    }
  }

  // Remove enrollment
  const handleUnenrollment = async (lessonId: string) => {
    try {
      setEnrollmentInProgress(lessonId)
      
      // Update student's theory lesson enrollments
      const updatedLessonIds = (student.theoryLessonIds || []).filter((id: string) => id !== lessonId)
      
      await apiService.students.updateStudent(studentId, {
        theoryLessonIds: updatedLessonIds
      })
      
      // Also update the theory lesson's enrolled students using the proper API method
      try {
        await apiService.theoryLessons.removeStudentFromTheory(lessonId, studentId)
      } catch (err) {
        console.error(`Failed to remove student from theory lesson ${lessonId}:`, err)
      }
      
      // Update local state
      const unenrolledLesson = enrolledTheoryLessons.find(l => l._id === lessonId)
      if (unenrolledLesson) {
        setAvailableTheoryLessons(prev => [...prev, unenrolledLesson])
      }
      setEnrolledTheoryLessons(prev => prev.filter(l => l._id !== lessonId))
      
      console.log(`Successfully unenrolled from theory lesson ${lessonId}`)
    } catch (error) {
      console.error('Error unenrolling from theory lesson:', error)
    } finally {
      setEnrollmentInProgress(null)
      setShowConfirmDialog(null)
    }
  }

  // Format time display
  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'מתחילים':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
      case 'בינוני':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
      case 'מתקדמים':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'harmony':
      case 'הרמוניה':
        return <Music className="w-4 h-4" />
      case 'theory':
      case 'תיאוריה':
        return <BookOpen className="w-4 h-4" />
      case 'composition':
      case 'קומפוזיציה':
        return <GraduationCap className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
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
    if (isLoadingLessons) {
      return (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
          ))}
        </div>
      )
    }

    if (enrolledTheoryLessons.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">אין שיעורי תיאוריה רשומים</h3>
          <p className="text-gray-500 mb-6">התלמיד אינו רשום כרגע לשיעורי תיאוריה</p>
          <button
            onClick={() => setActiveView('manage')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            צפה בשיעורים זמינים
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          שיעורי תיאוריה רשומים ({enrolledTheoryLessons.length})
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledTheoryLessons.map((lesson) => (
            <div 
              key={lesson._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(lesson.category)}
                    <h4 className="text-xl font-semibold text-gray-900">{lesson.title || lesson.name || 'שיעור תיאוריה'}</h4>
                  </div>
                  
                  {lesson.category && (
                    <span className="text-sm text-gray-600">קטגוריה: {lesson.category}</span>
                  )}
                  
                  {lesson.level && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(lesson.level)}`}>
                      {lesson.level}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    רשום
                  </span>
                  
                  <button
                    onClick={() => setShowConfirmDialog(lesson._id)}
                    disabled={enrollmentInProgress === lesson._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="בטל הרשמה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teacher info */}
              <TeacherNameDisplay
                lesson={lesson}
                className="mb-3"
                showIcon={true}
              />

              {/* Schedule */}
              {(lesson.date || lesson.startTime) && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {lesson.date && new Date(lesson.date).toLocaleDateString('he-IL')}
                      {lesson.startTime && lesson.endTime && (
                        <>
                          {lesson.date ? ' • ' : ''}
                          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Location */}
              {lesson.location && (
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{lesson.location}</span>
                </div>
              )}

              {/* Students count */}
              {lesson.maxStudents && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {lesson.studentIds?.length || 0} / {lesson.maxStudents} תלמידים
                  </span>
                </div>
              )}

              {/* Description */}
              {lesson.description && (
                <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                  {lesson.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderManagementView = () => {
    if (isLoadingLessons) {
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
            שיעורי תיאוריה זמינים להרשמה
          </h3>
          <div className="text-sm text-gray-600">
            כיתה: {studentGrade} • רמה: {studentLevel}
          </div>
        </div>

        {availableTheoryLessons.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">אין שיעורים זמינים</h4>
            <p className="text-gray-500">
              כל השיעורים המתאימים מלאים או שכבר נרשמת אליהם
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableTheoryLessons.map((lesson) => {
              const canEnroll = lesson.isCompatible
              
              return (
                <div 
                  key={lesson._id}
                  className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${
                    !canEnroll ? 'border-gray-200 opacity-75' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(lesson.category)}
                        <h4 className="text-xl font-semibold text-gray-900">{lesson.title || lesson.name || 'שיעור תיאוריה'}</h4>
                      </div>
                      
                      {lesson.category && (
                        <span className="text-sm text-gray-600">קטגוריה: {lesson.category}</span>
                      )}
                      
                      {/* Level and compatibility badges */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {lesson.level && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(lesson.level)}`}>
                            {lesson.level}
                          </span>
                        )}
                        
                        {lesson.gradeCompatible && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            מתאים לכיתה {studentGrade}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleEnrollment(lesson._id)}
                      disabled={!canEnroll || enrollmentInProgress === lesson._id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        canEnroll
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {enrollmentInProgress === lesson._id ? (
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

                  {/* Teacher info */}
                  <TeacherNameDisplay
                    lesson={lesson}
                    className="mb-3"
                    showIcon={true}
                  />

                  {/* Schedule */}
                  {(lesson.date || lesson.startTime) && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {lesson.date && new Date(lesson.date).toLocaleDateString('he-IL')}
                          {lesson.startTime && lesson.endTime && (
                            <>
                              {lesson.date ? ' • ' : ''}
                              {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {lesson.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{lesson.location}</span>
                    </div>
                  )}

                  {/* Warning Messages */}
                  {lesson.isFull && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">השיעור מלא</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        כל המקומות בשיעור תפוסים
                      </p>
                    </div>
                  )}
                  
                  {!lesson.gradeCompatible && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">לא מתאים לכיתה</span>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        השיעור מיועד לכיתות אחרות
                      </p>
                    </div>
                  )}

                  {!lesson.levelCompatible && (
                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">רמה לא מתאימה</span>
                      </div>
                      <p className="text-orange-700 text-sm mt-1">
                        השיעור מיועד לרמה {lesson.level}
                      </p>
                    </div>
                  )}

                  {/* Students count */}
                  {lesson.maxStudents && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {lesson.studentIds?.length || 0} / {lesson.maxStudents} תלמידים
                      </span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${((lesson.studentIds?.length || 0) / lesson.maxStudents) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {lesson.description && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                      {lesson.description}
                    </p>
                  )}

                  {/* Target grades */}
                  {lesson.targetGrades && lesson.targetGrades.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          מיועד לכיתות: {lesson.targetGrades.join(', ')}
                        </span>
                      </div>
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
      {/* Data Mismatch Warning */}
      {showDataMismatch && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-1 mr-3" />
              <div>
                <h4 className="font-semibold text-yellow-800">Data Inconsistency Detected</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Theory lessons show this student is enrolled, but the student record is empty. 
                  This may cause display issues and prevent proper enrollment management.
                </p>
              </div>
            </div>
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="ml-4 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Fix Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">שיעורי תיאוריה</h2>
          <p className="text-gray-600 mt-1">
            ניהול הרשמות לשיעורי תיאוריה • כיתה: {studentGrade} • רמה: {studentLevel}
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
              שיעורים רשומים
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
              בטל הרשמה לשיעור תיאוריה
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך לבטל את ההרשמה לשיעור זה? 
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

export default TheoryTab
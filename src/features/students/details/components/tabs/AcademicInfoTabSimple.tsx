/**
 * Academic Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Updated field names and added technical exams section
 */

import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Music, Trophy, Clock, FileText, CheckCircle, XCircle, Star, Edit, Save, X, AlertTriangle, User } from 'lucide-react'
import apiService from '../../../../../services/apiService'

interface AcademicInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
  onStudentUpdate?: (updatedStudent: any) => void
}

// Test status options - aligned with backend validation
const TEST_STATUSES = [
  'לא נבחן',
  'עבר/ה',
  'לא עבר/ה',
  'עבר/ה בהצטיינות',
  'עבר/ה בהצטיינות יתרה'
]

// Passing statuses that trigger stage advancement
const PASSING_STATUSES = ['עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

const AcademicInfoTabSimple: React.FC<AcademicInfoTabProps> = ({ student, studentId, isLoading, onStudentUpdate }) => {
  console.log('🎓 AcademicInfoTabSimple - Full student object:', student)
  console.log('📚 Student enrollments:', student?.enrollments)
  console.log('👨‍🏫 Student teacherAssignments:', student?.teacherAssignments)

  const academicInfo = student?.academicInfo || {}
  const teacherAssignments = student?.teacherAssignments || []
  const enrollments = student?.enrollments || {}
  const teacherIds = student?.teacherIds || []  // teacherIds is at root level, not in enrollments

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [teachersData, setTeachersData] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  // Initialize editedData with test statuses
  const initializeEditData = () => {
    const instrumentTests: Record<string, any> = {}
    if (academicInfo.instrumentProgress) {
      academicInfo.instrumentProgress.forEach((instrument: any) => {
        instrumentTests[instrument.instrumentName] = {
          stageTestStatus: instrument.tests?.stageTest?.status || 'לא נבחן',
          technicalTestStatus: instrument.tests?.technicalTest?.status || 'לא נבחן',
        }
      })
    }
    return {
      class: academicInfo.class || '',
      stage: academicInfo.stage || academicInfo.level || '',
      startDate: academicInfo.startDate || '',
      instrumentTests
    }
  }

  const [editedData, setEditedData] = useState(initializeEditData())

  // Update editedData when student data changes
  useEffect(() => {
    setEditedData(initializeEditData())
  }, [academicInfo])

  // Load teacher names for enrolled teachers without assignments
  useEffect(() => {
    const loadTeachersData = async () => {
      console.log('🔍 Checking enrolled teacher IDs:', teacherIds)
      console.log('📋 Current teacher assignments:', teacherAssignments)

      if (teacherIds.length === 0) {
        console.log('⚠️ No enrolled teachers found')
        return
      }

      setLoadingTeachers(true)
      try {
        console.log('🔄 Loading teacher data for IDs:', teacherIds)
        const teachersPromises = teacherIds.map((teacherId: string) =>
          apiService.teachers.getTeacher(teacherId)
        )
        const teachers = await Promise.all(teachersPromises)
        console.log('✅ Loaded teachers:', teachers)
        setTeachersData(teachers)
      } catch (error) {
        console.error('❌ Failed to load teachers:', error)
      } finally {
        setLoadingTeachers(false)
      }
    }

    loadTeachersData()
  }, [teacherIds])

  // Find teachers enrolled but without lesson assignments
  const teachersWithoutLessons = useMemo(() => {
    const assignedTeacherIds = teacherAssignments?.map((a: any) => a.teacherId) || []

    console.log('🔍 Finding teachers without lessons:')
    console.log('  - Enrolled teacher IDs:', teacherIds)
    console.log('  - Assigned teacher IDs:', assignedTeacherIds)
    console.log('  - Teachers data:', teachersData)

    const result = teachersData.filter((teacher) =>
      teacherIds.includes(teacher._id) &&
      !assignedTeacherIds.includes(teacher._id)
    )

    console.log('📊 Teachers without lessons:', result)
    return result
  }, [teachersData, teacherIds, teacherAssignments])

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Update instrument progress with new test statuses and check for stage advancement
      const updatedInstrumentProgress = academicInfo.instrumentProgress?.map((instrument: any) => {
        const testUpdates = editedData.instrumentTests?.[instrument.instrumentName]
        if (testUpdates) {
          const oldStageTestStatus = instrument.tests?.stageTest?.status || 'לא נבחן'
          const newStageTestStatus = testUpdates.stageTestStatus

          // Check if stage test changed from failing to passing
          const shouldAdvanceStage =
            PASSING_STATUSES.includes(newStageTestStatus) &&
            !PASSING_STATUSES.includes(oldStageTestStatus) &&
            instrument.currentStage < 8

          return {
            ...instrument,
            // Increment stage if conditions are met
            currentStage: shouldAdvanceStage ? instrument.currentStage + 1 : instrument.currentStage,
            tests: {
              ...instrument.tests,
              stageTest: {
                ...instrument.tests?.stageTest,
                status: testUpdates.stageTestStatus
              },
              technicalTest: {
                ...instrument.tests?.technicalTest,
                status: testUpdates.technicalTestStatus
              }
            }
          }
        }
        return instrument
      })

      await apiService.students.updateStudent(studentId, {
        academicInfo: {
          ...academicInfo,
          class: editedData.class,
          instrumentProgress: updatedInstrumentProgress
        }
      })

      // Fetch fresh data from server
      const freshStudent = await apiService.students.getStudentById(studentId)

      // Update parent component state
      if (onStudentUpdate) {
        onStudentUpdate(freshStudent)
      }

      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving student academic info:', error)

      // Provide more specific error messages
      let errorMessage = 'שגיאה בשמירת הנתונים האקדמיים'

      if (error.message?.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message?.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את הפרטים האקדמיים.'
      } else if (error.message?.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      }

      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData(initializeEditData())
    setIsEditing(false)
  }

  const handleTestStatusChange = (instrumentName: string, testType: 'stageTest' | 'technicalTest', value: string) => {
    setEditedData(prev => ({
      ...prev,
      instrumentTests: {
        ...prev.instrumentTests,
        [instrumentName]: {
          ...prev.instrumentTests?.[instrumentName],
          [`${testType}Status`]: value
        }
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case 'עבר/ה':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'לא עבר/ה':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'עבר/ה בהצטיינות':
        return <Star className="w-4 h-4 text-blue-500" />
      case 'עבר/ה בהצטיינות יתרה':
        return <Star className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case 'עבר/ה':
        return 'bg-green-100 text-green-800'
      case 'לא עבר/ה':
        return 'bg-red-100 text-red-800'
      case 'עבר/ה בהצטיינות':
        return 'bg-blue-100 text-blue-800'
      case 'עבר/ה בהצטיינות יתרה':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-4">
      {/* Header with Edit Button */}
      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            ערוך
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              בטל
            </button>
          </div>
        )}
      </div>

      {/* Single unified container for all academic information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary-600" />
          מידע אקדמי
        </h3>

        {/* Teachers Enrolled but No Lesson Scheduled - WARNING AT TOP */}
        {teachersWithoutLessons.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>מורים ללא שיעור מתוזמן</span>
            </div>
            <div className="space-y-2">
              {teachersWithoutLessons.map((teacher, index) => (
                <div
                  key={teacher._id || index}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <div className="p-1.5 bg-orange-100 rounded flex-shrink-0">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900">
                      {teacher.personalInfo?.fullName || 'מורה'}
                    </p>
                    <p className="text-xs text-orange-700 mt-0.5">
                      התלמיד/ה משוייך/ת למורה זה אך טרם נקבע שיעור. יש ליצור קשר עם המורה לתיאום שיעור.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Info Section */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-medium text-black font-semibold" style={{color: '#000000'}}>כיתה:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.class}
                  onChange={(e) => setEditedData({ ...editedData, class: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="הכנס כיתה"
                />
              ) : (
                <div className="text-sm font-medium text-gray-900">{academicInfo.class || 'לא צוין'}</div>
              )}
            </div>
            
            {/* Only show stage from academicInfo if no instruments with stage info */}
            {(!academicInfo.instrumentProgress || academicInfo.instrumentProgress.length === 0) && (
              <div>
                <span className="text-xs font-medium text-black font-semibold" style={{color: '#000000'}}>שלב:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.stage}
                    onChange={(e) => setEditedData({ ...editedData, stage: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="הכנס שלב"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{academicInfo.stage || academicInfo.level || 'לא צוין'}</div>
                )}
              </div>
            )}
            
            <div>
              <span className="text-xs font-medium text-black font-semibold" style={{color: '#000000'}}>תאריך התחלה:</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editedData.startDate ? new Date(editedData.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedData({ ...editedData, startDate: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <div className="text-sm font-medium text-gray-900">
                  {academicInfo.startDate ? new Date(academicInfo.startDate).toLocaleDateString('he-IL') : 'לא צוין'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instruments Section */}
        {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Music className="w-3 h-3" />
              כלי נגינה
            </h4>
            <div className="space-y-3">
              {academicInfo.instrumentProgress.map((instrument: any, index: number) => (
                <div key={index} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{instrument.instrumentName}</span>
                    {instrument.isPrimary && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded">
                        ראשי
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>שלב: {instrument.currentStage || instrument.stage || instrument.level || 'לא צוין'}</span>
                    {instrument.startDate && (
                      <span>{new Date(instrument.startDate).toLocaleDateString('he-IL')}</span>
                    )}
                  </div>
                  
                  {/* Test Results for this instrument */}
                  <div className="mt-2 space-y-2">
                    {/* Technical Test */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black font-semibold" style={{color: '#000000'}}>מבחן טכני:</span>
                      {isEditing ? (
                        <select
                          value={editedData.instrumentTests?.[instrument.instrumentName]?.technicalTestStatus || 'לא נבחן'}
                          onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'technicalTest', e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {TEST_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${getExamStatusColor(instrument.tests?.technicalTest?.status || 'לא נבחן')}`}>
                          {getExamStatusIcon(instrument.tests?.technicalTest?.status || 'לא נבחן')}
                          {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                        </div>
                      )}
                      {instrument.tests?.technicalTest?.notes && !isEditing && (
                        <span className="text-xs text-gray-500">({instrument.tests.technicalTest.notes})</span>
                      )}
                    </div>

                    {/* Stage Test */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black font-semibold" style={{color: '#000000'}}>מבחן שלב:</span>
                      {isEditing ? (
                        <select
                          value={editedData.instrumentTests?.[instrument.instrumentName]?.stageTestStatus || 'לא נבחן'}
                          onChange={(e) => handleTestStatusChange(instrument.instrumentName, 'stageTest', e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {TEST_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${getExamStatusColor(instrument.tests?.stageTest?.status || 'לא נבחן')}`}>
                          {getExamStatusIcon(instrument.tests?.stageTest?.status || 'לא נבחן')}
                          {instrument.tests?.stageTest?.status || 'לא נבחן'}
                        </div>
                      )}
                      {instrument.tests?.stageTest?.notes && !isEditing && (
                        <span className="text-xs text-gray-500">({instrument.tests.stageTest.notes})</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Notes Section */}
        {academicInfo.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              הערות
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{academicInfo.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AcademicInfoTabSimple
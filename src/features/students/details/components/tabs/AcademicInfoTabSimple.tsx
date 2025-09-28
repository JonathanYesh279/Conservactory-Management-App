/**
 * Academic Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Updated field names and added technical exams section
 */

import { useState, useEffect } from 'react'
import { BookOpen, Music, Trophy, Clock, FileText, CheckCircle, XCircle, Star, Edit, Save, X } from 'lucide-react'
import apiService from '../../../../../services/apiService'

interface AcademicInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
  onStudentUpdate?: (updatedStudent: any) => void
}

const AcademicInfoTabSimple: React.FC<AcademicInfoTabProps> = ({ student, studentId, isLoading, onStudentUpdate }) => {
  const academicInfo = student?.academicInfo || {}
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState({
    class: academicInfo.class || '',
    stage: academicInfo.stage || academicInfo.level || '',
    startDate: academicInfo.startDate || '',
  })

  // Update editedData when student data changes
  useEffect(() => {
    setEditedData({
      class: academicInfo.class || '',
      stage: academicInfo.stage || academicInfo.level || '',
      startDate: academicInfo.startDate || '',
    })
  }, [academicInfo])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const updatedStudent = await apiService.students.updateStudent(studentId, {
        academicInfo: {
          ...academicInfo,
          ...editedData
        }
      })
      
      if (onStudentUpdate) {
        onStudentUpdate(updatedStudent)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving student academic info:', error)
      
      // Provide more specific error messages
      let errorMessage = 'שגיאה בשמירת הנתונים האקדמיים'
      
      if (error.message.includes('Authentication failed')) {
        errorMessage = 'פג תוקף הפנייה. אנא התחבר מחדש.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'שגיאה בנתונים שהוזנו. אנא בדוק את הפרטים האקדמיים.'
      } else if (error.message.includes('not found')) {
        errorMessage = 'התלמיד לא נמצא במערכת.'
      } else if (error.message.includes('Network')) {
        errorMessage = 'שגיאת רשת. אנא בדוק את החיבור לאינטרנט.'
      }
      
      alert(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      class: academicInfo.class || '',
      stage: academicInfo.stage || academicInfo.level || '',
      startDate: academicInfo.startDate || '',
    })
    setIsEditing(false)
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
                  {instrument.tests && (
                    <div className="mt-2 space-y-1">
                      {instrument.tests.technicalTest && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-black font-semibold" style={{color: '#000000'}}>מבחן טכני:</span>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getExamStatusColor(instrument.tests.technicalTest.status || 'לא נבחן')}`}>
                            {getExamStatusIcon(instrument.tests.technicalTest.status || 'לא נבחן')}
                            {instrument.tests.technicalTest.status || 'לא נבחן'}
                          </div>
                          {instrument.tests.technicalTest.notes && (
                            <span className="text-xs text-gray-500">({instrument.tests.technicalTest.notes})</span>
                          )}
                        </div>
                      )}
                      {instrument.tests.stageTest && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-black font-semibold" style={{color: '#000000'}}>מבחן שלב:</span>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getExamStatusColor(instrument.tests.stageTest.status || 'לא נבחן')}`}>
                            {getExamStatusIcon(instrument.tests.stageTest.status || 'לא נבחן')}
                            {instrument.tests.stageTest.status || 'לא נבחן'}
                          </div>
                          {instrument.tests.stageTest.notes && (
                            <span className="text-xs text-gray-500">({instrument.tests.stageTest.notes})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
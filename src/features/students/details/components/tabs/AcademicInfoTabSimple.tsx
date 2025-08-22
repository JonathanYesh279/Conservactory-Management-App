/**
 * Academic Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Updated field names and added technical exams section
 */

import { BookOpen, Music, Trophy, Clock, FileText, CheckCircle, XCircle, Star } from 'lucide-react'

interface AcademicInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const AcademicInfoTabSimple: React.FC<AcademicInfoTabProps> = ({ student, studentId, isLoading }) => {
  const academicInfo = student?.academicInfo || {}

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
      {/* Single unified container for all academic information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary-600" />
          מידע אקדמי
        </h3>
        
        {/* Basic Info Section */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">כיתה:</span>
              <span className="text-sm font-medium text-gray-900">{academicInfo.class || 'לא צוין'}</span>
            </div>
            
            {/* Only show stage from academicInfo if no instruments with stage info */}
            {(!academicInfo.instrumentProgress || academicInfo.instrumentProgress.length === 0) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">שלב:</span>
                <span className="text-sm font-medium text-gray-900">{academicInfo.stage || academicInfo.level || 'לא צוין'}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">תאריך התחלה:</span>
              <span className="text-sm font-medium text-gray-900">
                {academicInfo.startDate ? new Date(academicInfo.startDate).toLocaleDateString('he-IL') : 'לא צוין'}
              </span>
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
            <div className="space-y-1">
              {academicInfo.instrumentProgress.map((instrument: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{instrument.instrumentName}</span>
                    {instrument.isPrimary && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded">
                        ראשי
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>שלב: {instrument.stage || instrument.level || 'לא צוין'}</span>
                    {instrument.startDate && (
                      <span>{new Date(instrument.startDate).toLocaleDateString('he-IL')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Exams Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            מבחנים טכניים
          </h4>
          {academicInfo.technicalExams && academicInfo.technicalExams.length > 0 ? (
            <div className="space-y-1">
              {academicInfo.technicalExams.map((exam: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-gray-900">
                    {exam.examName || `מבחן ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-2 mr-auto">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getExamStatusColor(exam.status || 'לא נבחן')}`}>
                      {getExamStatusIcon(exam.status || 'לא נבחן')}
                      {exam.status || 'לא נבחן'}
                    </div>
                    {exam.examDate && (
                      <span className="text-xs text-gray-600">
                        {new Date(exam.examDate).toLocaleDateString('he-IL')}
                      </span>
                    )}
                    {exam.grade && (
                      <span className="text-xs text-gray-600">ציון: {exam.grade}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">לא נמצאו מבחנים טכניים</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcademicInfoTabSimple
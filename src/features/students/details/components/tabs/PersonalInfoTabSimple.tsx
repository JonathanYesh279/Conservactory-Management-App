/**
 * Personal Info Tab Component (Simplified)
 * 
 * Displays ONLY actual backend fields - aligned with schema
 * Fields: fullName, phone, age, address, parentName, parentPhone, parentEmail, studentEmail
 */

import { User, Phone, Mail, MapPin } from 'lucide-react'

interface PersonalInfoTabProps {
  student: any
  studentId: string
  isLoading?: boolean
}

const PersonalInfoTabSimple: React.FC<PersonalInfoTabProps> = ({ student, studentId, isLoading }) => {
  const personalInfo = student?.personalInfo || {}

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Student Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
            <div className="text-gray-900 text-lg font-medium">{personalInfo.fullName || 'לא צוין'}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
            <div className="text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              {personalInfo.phone || 'לא צוין'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">גיל</label>
            <div className="text-gray-900">{personalInfo.age || 'לא צוין'}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל תלמיד</label>
            <div className="text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              {personalInfo.studentEmail || 'לא צוין'}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
            <div className="text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              {personalInfo.address || 'לא צוין'}
            </div>
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם הורה</label>
            <div className="text-gray-900">{personalInfo.parentName || 'לא צוין'}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טלפון הורה</label>
            <div className="text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              {personalInfo.parentPhone || 'לא צוין'}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל הורה</label>
            <div className="text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              {personalInfo.parentEmail || 'לא צוין'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTabSimple
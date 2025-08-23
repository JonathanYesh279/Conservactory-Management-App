/**
 * Personal Info Tab Component
 * 
 * Displays and allows editing of teacher's personal information
 */

import { useState } from 'react'
import { User, Phone, Mail, MapPin, Edit, Save, X, Calendar, Award } from 'lucide-react'
import { Teacher } from '../../types'

interface PersonalInfoTabProps {
  teacher: Teacher
  teacherId: string
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ teacher, teacherId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    fullName: teacher.personalInfo?.fullName || '',
    phone: teacher.personalInfo?.phone || '',
    email: teacher.personalInfo?.email || '',
    address: teacher.personalInfo?.address || '',
  })

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update teacher personal info
      console.log('Saving teacher personal info:', editedData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving teacher personal info:', error)
    }
  }

  const handleCancel = () => {
    setEditedData({
      fullName: teacher.personalInfo?.fullName || '',
      phone: teacher.personalInfo?.phone || '',
      email: teacher.personalInfo?.email || '',
      address: teacher.personalInfo?.address || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">מידע אישי</h2>
          <p className="text-sm text-gray-600">פרטי המורה האישיים וההתקשרות</p>
        </div>
        
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
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              שמור
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              בטל
            </button>
          </div>
        )}
      </div>

      {/* Personal Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">פרטים בסיסיים</h3>
          
          {/* Full Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <User className="w-4 h-4" />
              שם מלא
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.fullName}
                onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס שם מלא"
              />
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.fullName || 'לא צוין'}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Phone className="w-4 h-4" />
              טלפון
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedData.phone}
                onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס מספר טלפון"
              />
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.phone || 'לא צוין'}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Mail className="w-4 h-4" />
              דוא"ל
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedData.email}
                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס כתובת דוא״ל"
              />
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.email || 'לא צוין'}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <MapPin className="w-4 h-4" />
              כתובת
            </label>
            {isEditing ? (
              <textarea
                value={editedData.address}
                onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הכנס כתובת מגורים"
                rows={2}
              />
            ) : (
              <p className="text-gray-900">{teacher.personalInfo?.address || 'לא צוין'}</p>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700 border-b pb-2">מידע מקצועי</h3>
          
          {/* Instrument */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Award className="w-4 h-4" />
              כלי נגינה
            </label>
            <p className="text-gray-900">{teacher.professionalInfo?.instrument || 'לא צוין'}</p>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">תפקידים</label>
            <div className="flex flex-wrap gap-2">
              {teacher.roles?.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {role}
                </span>
              )) || <span className="text-gray-500">אין תפקידים</span>}
            </div>
          </div>

          {/* Active Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">סטטוס</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              teacher.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {teacher.isActive ? 'פעיל' : 'לא פעיל'}
            </div>
          </div>

          {/* Creation Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Calendar className="w-4 h-4" />
              תאריך הצטרפות
            </label>
            <p className="text-gray-900">
              {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('he-IL') : 'לא ידוע'}
            </p>
          </div>

          {/* Last Login */}
          {teacher.credentials?.lastLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">כניסה אחרונה</label>
              <p className="text-gray-900">
                {new Date(teacher.credentials.lastLogin).toLocaleDateString('he-IL')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Count Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-md font-medium text-gray-700 mb-3">סיכום תלמידים</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {teacher.teaching?.studentIds?.length || 0}
            </div>
            <div className="text-sm text-gray-600">סך התלמידים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teacher.teaching?.timeBlocks?.length || 0}
            </div>
            <div className="text-sm text-gray-600">בלוקי זמן</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((teacher.teaching?.timeBlocks?.reduce((total, block) => total + (block.totalDuration || 0), 0) || 0) / 60)}
            </div>
            <div className="text-sm text-gray-600">שעות שבועיות</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTab
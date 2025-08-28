import React, { useState, useEffect } from 'react'
import { 
  X, Save, User, AlertCircle, CheckCircle, Search
} from 'lucide-react'
import Card from './ui/Card'
import type { BagrutFormData } from '../types/bagrut.types'

interface BagrutFormProps {
  students: any[]
  teachers: any[]
  initialData?: any
  isEdit?: boolean
  onSubmit: (data: BagrutFormData) => Promise<void>
  onCancel: () => void
}

const BagrutForm: React.FC<BagrutFormProps> = ({
  students,
  teachers,
  initialData,
  isEdit = false,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<BagrutFormData>({
    studentId: '',
    teacherId: '',
    conservatoryName: '',
    testDate: undefined,
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        studentId: initialData.studentId || '',
        teacherId: initialData.teacherId || '',
        conservatoryName: initialData.conservatoryName || '',
        testDate: initialData.testDate ? new Date(initialData.testDate) : undefined,
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.studentId) {
      newErrors.studentId = 'יש לבחור תלמיד'
    }

    if (!formData.teacherId) {
      newErrors.teacherId = 'יש לבחור מורה'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ general: 'שגיאה בשמירת הנתונים. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BagrutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true
    const fullName = student.personalInfo?.fullName || ''
    const className = student.academicInfo?.class || ''
    return fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
           className.toLowerCase().includes(studentSearch.toLowerCase())
  })

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    if (!teacherSearch) return true
    const fullName = teacher.personalInfo?.fullName || ''
    const email = teacher.personalInfo?.email || ''
    return fullName.toLowerCase().includes(teacherSearch.toLowerCase()) ||
           email.toLowerCase().includes(teacherSearch.toLowerCase())
  })

  const selectedStudent = students.find(s => s._id === formData.studentId)
  const selectedTeacher = teachers.find(t => t._id === formData.teacherId)

  return (
    <div className="bg-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת בגרות' : 'בגרות חדשה'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'עדכון פרטי הבגרות' : 'הוספת בגרות חדשה למערכת'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Student Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            בחירת תלמיד
          </h3>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש תלמיד לפי שם או כיתה..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedStudent.personalInfo?.fullName}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>כיתה: {selectedStudent.academicInfo?.class}</p>
                      <p>טלפון: {selectedStudent.personalInfo?.phone}</p>
                      <p>
                        כלי ראשי: {selectedStudent.academicInfo?.instrumentProgress?.find((i: any) => i.isPrimary)?.instrumentName}
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            )}

            {/* Student List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => {
                      handleInputChange('studentId', student._id)
                      setStudentSearch('')
                    }}
                    className={`w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      formData.studentId === student._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {student.personalInfo?.fullName}
                    </div>
                    <div className="text-sm text-gray-600">
                      כיתה {student.academicInfo?.class} • {student.academicInfo?.instrumentProgress?.find((i: any) => i.isPrimary)?.instrumentName}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  לא נמצאו תלמידים
                </div>
              )}
            </div>

            {errors.studentId && (
              <p className="text-red-600 text-sm">{errors.studentId}</p>
            )}
          </div>
        </Card>

        {/* Teacher Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            בחירת מורה מנחה
          </h3>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מורה לפי שם..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Selected Teacher Display */}
            {selectedTeacher && (
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedTeacher.personalInfo?.fullName}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>אימייל: {selectedTeacher.personalInfo?.email}</p>
                      <p>טלפון: {selectedTeacher.personalInfo?.phone}</p>
                      <p>מחלקה: {selectedTeacher.professionalInfo?.department}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            )}

            {/* Teacher List */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map(teacher => (
                  <button
                    key={teacher._id}
                    type="button"
                    onClick={() => {
                      handleInputChange('teacherId', teacher._id)
                      setTeacherSearch('')
                    }}
                    className={`w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      formData.teacherId === teacher._id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {teacher.personalInfo?.fullName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {teacher.professionalInfo?.department} • {teacher.personalInfo?.email}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  לא נמצאו מורים
                </div>
              )}
            </div>

            {errors.teacherId && (
              <p className="text-red-600 text-sm">{errors.teacherId}</p>
            )}
          </div>
        </Card>

        {/* Additional Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטים נוספים</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conservatory Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם הקונסרבטוריון
              </label>
              <input
                type="text"
                value={formData.conservatoryName}
                onChange={(e) => handleInputChange('conservatoryName', e.target.value)}
                placeholder="לדוגמה: קונסרבטוריון ירושלים"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Test Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך מבחן (אופציונלי)
              </label>
              <input
                type="date"
                value={formData.testDate ? formData.testDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('testDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="הערות נוספות על הבגרות..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ביטול
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                {isEdit ? 'עדכן בגרות' : 'צור בגרות'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BagrutForm
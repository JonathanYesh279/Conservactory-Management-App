import { useState, useEffect } from 'react'
import { X, Save, Clock, MapPin, Users, BookOpen } from 'lucide-react'
import { teacherService } from '../services/apiService'

interface TheoryLessonFormProps {
  lesson?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TheoryLessonForm({ lesson, onSubmit, onCancel }: TheoryLessonFormProps) {
  const [formData, setFormData] = useState({
    category: 'תיאוריה כללית',
    title: '',
    description: '',
    teacherId: '',
    teacherName: '',
    date: '',
    startTime: '19:00',
    endTime: '20:30',
    duration: 90,
    location: 'חדר תיאוריה 1',
    maxStudents: 15,
    studentIds: [],
    attendanceList: [],
    schoolYearId: '',
    isActive: true
  })

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Theory lesson categories
  const categories = [
    'תיאוריה כללית',
    'הרמוניה',
    'קומפוזיציה',
    'היסטוריה של המוזיקה',
    'אימון אוזן',
    'ניתוח מוזיקלי',
    'קונטרפונקט',
    'צורות מוזיקליות'
  ]

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers()
  }, [])

  // Pre-populate form if editing existing lesson
  useEffect(() => {
    if (lesson) {
      setFormData({
        category: lesson.category || 'תיאוריה כללית',
        title: lesson.title || '',
        description: lesson.description || '',
        teacherId: lesson.teacherId || '',
        teacherName: lesson.teacherName || '',
        date: lesson.date ? new Date(lesson.date).toISOString().split('T')[0] : '',
        startTime: lesson.startTime || '19:00',
        endTime: lesson.endTime || '20:30',
        duration: lesson.duration || 90,
        location: lesson.location || 'חדר תיאוריה 1',
        maxStudents: lesson.maxStudents || 15,
        studentIds: lesson.studentIds || [],
        attendanceList: lesson.attendanceList || [],
        schoolYearId: lesson.schoolYearId || '',
        isActive: lesson.isActive !== undefined ? lesson.isActive : true
      })
    }
  }, [lesson])

  const loadTeachers = async () => {
    try {
      const teachersData = await teacherService.getTeachers({ roles: 'מורה תאוריה' })
      setTeachers(teachersData)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-update teacher name when teacher is selected
    if (field === 'teacherId') {
      const selectedTeacher = teachers.find(t => t._id === value)
      setFormData(prev => ({
        ...prev,
        teacherId: value,
        teacherName: selectedTeacher?.personalInfo?.fullName || ''
      }))
    }

    // Auto-calculate duration when start/end time changes
    if (field === 'startTime' || field === 'endTime') {
      const start = field === 'startTime' ? value : formData.startTime
      const end = field === 'endTime' ? value : formData.endTime
      
      if (start && end) {
        const startMinutes = timeToMinutes(start)
        const endMinutes = timeToMinutes(end)
        const duration = endMinutes - startMinutes
        
        if (duration > 0) {
          setFormData(prev => ({
            ...prev,
            [field]: value,
            duration
          }))
        }
      }
    }
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const handleDurationChange = (duration: number) => {
    if (formData.startTime) {
      const startMinutes = timeToMinutes(formData.startTime)
      const endTime = minutesToTime(startMinutes + duration)
      
      setFormData(prev => ({
        ...prev,
        duration,
        endTime
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('יש להזין כותרת לשיעור')
      return false
    }

    if (!formData.date) {
      setError('יש לבחור תאריך לשיעור')
      return false
    }

    if (!formData.startTime || !formData.endTime) {
      setError('יש להזין שעות התחלה וסיום')
      return false
    }

    if (formData.duration <= 0) {
      setError('משך השיעור חייב להיות חיובי')
      return false
    }

    if (formData.maxStudents <= 0) {
      setError('מספר התלמידים המקסימלי חייב להיות חיובי')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Format date properly for backend
      const submitData = {
        ...formData,
        date: new Date(formData.date + 'T00:00:00.000Z').toISOString()
      }

      await onSubmit(submitData)
    } catch (error: any) {
      console.error('Error submitting theory lesson form:', error)
      setError(error.message || 'שגיאה בשמירת השיעור')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Form Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {lesson ? 'עריכת שיעור תיאוריה' : 'שיעור תיאוריה חדש'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline ml-1" />
                קטגוריה
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כותרת השיעור *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="הזן כותרת לשיעור"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תיאור השיעור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="תיאור קצר של נושאי השיעור..."
            />
          </div>

          {/* Teacher and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מורה
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => handleInputChange('teacherId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">בחר מורה</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.personalInfo?.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline ml-1" />
                מיקום
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="חדר תיאוריה 1"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline ml-1" />
                שעת התחלה *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שעת סיום *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Duration and Max Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משך השיעור (דקות)
              </label>
              <div className="flex gap-2">
                {[45, 60, 90, 120].map(duration => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => handleDurationChange(duration)}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                      formData.duration === duration
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="1"
                placeholder="משך בדקות"
              />
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline ml-1" />
                מספר תלמידים מקסימלי
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="1"
                max="50"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="mr-2 text-sm text-gray-700">שיעור פעיל</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              {lesson ? 'עדכן שיעור' : 'צור שיעור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
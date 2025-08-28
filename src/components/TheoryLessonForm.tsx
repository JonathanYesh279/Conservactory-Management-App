import { useState, useEffect } from 'react'
import { X, Save, Clock, MapPin, Users, BookOpen } from 'lucide-react'
import { teacherService, schoolYearService } from '../services/apiService'

interface TheoryLessonFormProps {
  theoryLesson?: any
  teachers?: any[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TheoryLessonForm({ theoryLesson, teachers: propTeachers, onSubmit, onCancel }: TheoryLessonFormProps) {
  const [formData, setFormData] = useState({
    category: 'מגמה',
    teacherId: '',
    date: '',
    dayOfWeek: 0,
    startTime: '14:00',
    endTime: '15:00',
    location: 'אולם ערן',
    studentIds: [],
    attendance: { present: [], absent: [] },
    notes: '',
    syllabus: '',
    homework: '',
    schoolYearId: ''
  })

  const [teachers, setTeachers] = useState(propTeachers || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Theory lesson categories from backend schema
  const categories = [
    'תלמידים חדשים ב-ד',
    'מתחילים',
    'מתחילים ב',
    'מתחילים ד',
    'מתקדמים ב',
    'מתקדמים א',
    'מתקדמים ג',
    'תלמידים חדשים בוגרים (ה - ט)',
    'תלמידים חדשים צעירים',
    'הכנה לרסיטל קלאסי יא',
    "הכנה לרסיטל רוק\\פופ\\ג'אז יא",
    "הכנה לרסיטל רוק\\פופ\\ג'אז יב",
    'מגמה',
    'תאוריה כלי',
  ]

  // Valid locations from backend schema
  const locations = [
    'אולם ערן',
    'סטודיו קאמרי 1',
    'סטודיו קאמרי 2',
    'אולפן הקלטות',
    'חדר חזרות 1',
    'חדר חזרות 2',
    'חדר מחשבים',
    'חדר 1',
    'חדר 2',
    'חדר חזרות',
    'חדר 5',
    'חדר 6',
    'חדר 7',
    'חדר 8',
    'חדר 9',
    'חדר 10',
    'חדר 11',
    'חדר 12',
    'חדר 13',
    'חדר 14',
    'חדר 15',
    'חדר 16',
    'חדר 17',
    'חדר 18',
    'חדר 19',
    'חדר 20',
    'חדר 21',
    'חדר 22',
    'חדר 23',
    'חדר 24',
    'חדר 25',
    'חדר 26',
    'חדר תאוריה א',
    'חדר תאוריה ב',
  ]

  const DAYS_OF_WEEK = {
    0: 'ראשון',
    1: 'שני',
    2: 'שלישי',
    3: 'רביעי',
    4: 'חמישי',
    5: 'שישי',
    6: 'שבת'
  }

  // Load teachers and current school year on component mount
  useEffect(() => {
    if (!propTeachers) {
      loadTeachers()
    }
    loadCurrentSchoolYear()
  }, [propTeachers])

  // Pre-populate form if editing existing lesson
  useEffect(() => {
    if (theoryLesson) {
      const lessonDate = new Date(theoryLesson.date)
      setFormData({
        category: theoryLesson.category || 'מגמה',
        teacherId: theoryLesson.teacherId || '',
        date: theoryLesson.date ? new Date(theoryLesson.date).toISOString().split('T')[0] : '',
        dayOfWeek: theoryLesson.dayOfWeek !== undefined ? theoryLesson.dayOfWeek : lessonDate.getDay(),
        startTime: theoryLesson.startTime || '14:00',
        endTime: theoryLesson.endTime || '15:00',
        location: theoryLesson.location || 'אולם ערן',
        studentIds: theoryLesson.studentIds || [],
        attendance: theoryLesson.attendance || { present: [], absent: [] },
        notes: theoryLesson.notes || '',
        syllabus: theoryLesson.syllabus || '',
        homework: theoryLesson.homework || '',
        schoolYearId: theoryLesson.schoolYearId || ''
      })
    }
  }, [theoryLesson])

  const loadTeachers = async () => {
    try {
      const teachersData = await teacherService.getTeachers()
      // Filter teachers to show only those with "מורה תאוריה" role
      const theoryTeachers = teachersData.filter(teacher => 
        teacher.roles && teacher.roles.includes('מורה תאוריה')
      )
      setTeachers(theoryTeachers)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const loadCurrentSchoolYear = async () => {
    try {
      const currentSchoolYear = await schoolYearService.getCurrentSchoolYear()
      if (currentSchoolYear && !formData.schoolYearId) {
        setFormData(prev => ({
          ...prev,
          schoolYearId: currentSchoolYear._id
        }))
      }
    } catch (error) {
      console.error('Error loading current school year:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-calculate dayOfWeek when date changes
    if (field === 'date' && value) {
      const date = new Date(value)
      const dayOfWeek = date.getDay()
      setFormData(prev => ({
        ...prev,
        date: value,
        dayOfWeek
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!formData.category.trim()) {
      setError('יש לבחור קטגוריה לשיעור')
      return false
    }

    if (!formData.teacherId) {
      setError('יש לבחור מורה לשיעור')
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

    if (!formData.location.trim()) {
      setError('יש להזין מיקום לשיעור')
      return false
    }

    // Validate time logic
    const startTime = formData.startTime.split(':').map(Number)
    const endTime = formData.endTime.split(':').map(Number)
    const startMinutes = startTime[0] * 60 + startTime[1]
    const endMinutes = endTime[0] * 60 + endTime[1]
    
    if (endMinutes <= startMinutes) {
      setError('שעת הסיום חייבת להיות אחרי שעת ההתחלה')
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
      // Format date properly for backend - combine date with a base time
      const submitData = {
        ...formData,
        date: new Date(formData.date + 'T' + formData.startTime + ':00.000Z').toISOString()
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
            {theoryLesson ? 'עריכת שיעור תיאוריה' : 'שיעור תיאוריה חדש'}
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
                קטגוריה *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מורה *
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => handleInputChange('teacherId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">בחר מורה</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.personalInfo?.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline ml-1" />
              מיקום *
            </label>
            <select
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              required
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Day of Week (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                יום בשבוע
              </label>
              <input
                type="text"
                value={DAYS_OF_WEEK[formData.dayOfWeek as keyof typeof DAYS_OF_WEEK] || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                disabled
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                required
              />
            </div>
          </div>

          {/* Notes and Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Syllabus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סילבוס
              </label>
              <textarea
                value={formData.syllabus}
                onChange={(e) => handleInputChange('syllabus', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="נושאי השיעור..."
              />
            </div>

            {/* Homework */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שיעורי בית
              </label>
              <textarea
                value={formData.homework}
                onChange={(e) => handleInputChange('homework', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="משימות לבית..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערות
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="הערות כלליות..."
              />
            </div>
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
              {theoryLesson ? 'עדכן שיעור' : 'צור שיעור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
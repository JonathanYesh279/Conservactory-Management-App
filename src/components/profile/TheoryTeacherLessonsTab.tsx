import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Plus, Search, Edit, Trash2, BookOpen, Calendar, Clock, Users } from 'lucide-react'
import apiService from '../../services/apiService'

interface TheoryLesson {
  id: string
  name: string
  description?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number // minutes
  capacity: number
  enrolledCount?: number
  schedule: {
    dayOfWeek: string
    startTime: string
    endTime: string
  }
  status: 'active' | 'inactive'
  venue?: string
  materials?: string[]
}

interface LessonStudent {
  id: string
  firstName: string
  lastName: string
  grade?: string
  instrument?: string
  enrollmentDate: string
  attendance?: {
    total: number
    present: number
    absent: number
  }
}

export default function TheoryTeacherLessonsTab() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<TheoryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TheoryLesson | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [lessonStudents, setLessonStudents] = useState<LessonStudent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTheoryLessons()
  }, [user])

  const loadTheoryLessons = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const teacherId = user._id
      const allLessons = await apiService.theory.getTheoryLessons()
      // Filter lessons for this teacher
      const teacherLessons = allLessons.filter(lesson => lesson.teacherId === teacherId)
      
      // Map backend data to frontend format
      const mappedLessons = teacherLessons.map(lesson => ({
        id: lesson._id,
        name: lesson.name,
        description: lesson.description,
        level: lesson.level,
        duration: lesson.duration,
        capacity: lesson.capacity,
        enrolledCount: lesson.enrolledStudentIds?.length || 0,
        schedule: {
          dayOfWeek: lesson.dayOfWeek,
          startTime: lesson.startTime,
          endTime: lesson.endTime
        },
        status: lesson.isActive ? 'active' : 'inactive',
        venue: lesson.location,
        materials: lesson.materials || []
      }))
      
      setLessons(mappedLessons)
    } catch (error) {
      console.error('Error loading theory lessons:', error)
      setError('שגיאה בטעינת רשימת שיעורי התיאוריה')
    } finally {
      setLoading(false)
    }
  }

  const loadLessonStudents = async (lessonId: string) => {
    try {
      const lesson = await apiService.theory.getTheoryLesson(lessonId)
      const studentIds = lesson.enrolledStudentIds || []
      
      if (studentIds.length === 0) {
        setLessonStudents([])
        return
      }
      
      // Get student details
      const students = await apiService.students.getStudents({ ids: studentIds.join(',') })
      
      // Map backend data to frontend format
      const mappedStudents = students.map(student => ({
        id: student._id,
        firstName: student.personalInfo?.firstName || '',
        lastName: student.personalInfo?.lastName || '',
        grade: student.academicInfo?.gradeLevel,
        instrument: student.primaryInstrument,
        enrollmentDate: student.createdAt || new Date().toISOString(),
        attendance: {
          total: 0, // TODO: Calculate from actual attendance data
          present: 0,
          absent: 0
        }
      }))
      
      setLessonStudents(mappedStudents)
    } catch (error) {
      console.error('Error loading lesson students:', error)
    }
  }

  const filteredLessons = lessons.filter(lesson =>
    searchTerm === '' || 
    lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) return

    try {
      await apiService.theory.deleteTheoryLesson(lessonId)
      setLessons(prev => prev.filter(l => l.id !== lessonId))
      if (selectedLesson === lessonId) {
        setSelectedLesson(null)
        setLessonStudents([])
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('שגיאה במחיקת השיעור')
    }
  }

  const handleLessonSubmit = async (lessonData: Partial<TheoryLesson>) => {
    try {
      if (editingLesson) {
        // Update existing lesson
        const backendData = {
          name: lessonData.name,
          description: lessonData.description,
          level: lessonData.level,
          duration: lessonData.duration,
          capacity: lessonData.capacity,
          dayOfWeek: lessonData.schedule?.dayOfWeek,
          startTime: lessonData.schedule?.startTime,
          endTime: lessonData.schedule?.endTime,
          isActive: lessonData.status === 'active',
          location: lessonData.venue
        }
        
        const updatedLesson = await apiService.theory.updateTheoryLesson(editingLesson.id, backendData)
        
        // Map response back to frontend format
        const mappedLesson = {
          id: updatedLesson._id,
          name: updatedLesson.name,
          description: updatedLesson.description,
          level: updatedLesson.level,
          duration: updatedLesson.duration,
          capacity: updatedLesson.capacity,
          enrolledCount: updatedLesson.enrolledStudentIds?.length || 0,
          schedule: {
            dayOfWeek: updatedLesson.dayOfWeek,
            startTime: updatedLesson.startTime,
            endTime: updatedLesson.endTime
          },
          status: updatedLesson.isActive ? 'active' : 'inactive',
          venue: updatedLesson.location,
          materials: updatedLesson.materials || []
        }
        
        setLessons(prev => prev.map(l => 
          l.id === editingLesson.id ? mappedLesson : l
        ))
      } else {
        // Create new lesson
        const teacherId = user?._id
        const backendData = {
          name: lessonData.name,
          description: lessonData.description,
          level: lessonData.level,
          duration: lessonData.duration,
          capacity: lessonData.capacity,
          dayOfWeek: lessonData.schedule?.dayOfWeek,
          startTime: lessonData.schedule?.startTime,
          endTime: lessonData.schedule?.endTime,
          isActive: lessonData.status === 'active',
          location: lessonData.venue,
          teacherId
        }
        
        const newLesson = await apiService.theory.createTheoryLesson(backendData)
        
        // Map response back to frontend format
        const mappedLesson = {
          id: newLesson._id,
          name: newLesson.name,
          description: newLesson.description,
          level: newLesson.level,
          duration: newLesson.duration,
          capacity: newLesson.capacity,
          enrolledCount: newLesson.enrolledStudentIds?.length || 0,
          schedule: {
            dayOfWeek: newLesson.dayOfWeek,
            startTime: newLesson.startTime,
            endTime: newLesson.endTime
          },
          status: newLesson.isActive ? 'active' : 'inactive',
          venue: newLesson.location,
          materials: newLesson.materials || []
        }
        
        setLessons(prev => [...prev, mappedLesson])
      }
      setShowAddModal(false)
      setEditingLesson(null)
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('שגיאה בשמירת פרטי השיעור')
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחילים'
      case 'intermediate': return 'בינוניים'
      case 'advanced': return 'מתקדמים'
      default: return level
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Show only HH:MM
  }

  const getDayLabel = (day: string) => {
    const days = {
      'sunday': 'יום ראשון',
      'monday': 'יום שני',
      'tuesday': 'יום שלישי',
      'wednesday': 'יום רביעי',
      'thursday': 'יום חמישי',
      'friday': 'יום שישי',
      'saturday': 'יום שבת'
    }
    return days[day.toLowerCase() as keyof typeof days] || day
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען רשימת שיעורים...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-reisinger-yonatan">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            שיעורי התיאוריה שלי
          </h3>
          <p className="text-gray-600 mt-1">
            {lessons.length} שיעורים
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-reisinger-yonatan">הוסף שיעור</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="חיפוש שיעורים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lessons List */}
        <div className="space-y-4">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">
                {searchTerm ? 'לא נמצאו שיעורים' : 'אין שיעורים רשומים'}
              </h3>
              <p className="text-gray-600 font-reisinger-yonatan">
                {searchTerm ? 'נסה מילות חיפוש אחרות' : 'התחל בהוספת השיעור הראשון שלך'}
              </p>
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                  selectedLesson === lesson.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                }`}
                onClick={() => {
                  setSelectedLesson(lesson.id)
                  loadLessonStudents(lesson.id)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      {lesson.name}
                    </h4>
                    <p className="text-sm text-gray-600 font-reisinger-yonatan">
                      {getLevelLabel(lesson.level)} • {lesson.duration} דקות
                    </p>
                    {lesson.description && (
                      <p className="text-sm text-gray-500 mt-1 font-reisinger-yonatan">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingLesson(lesson)
                        setShowAddModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLesson(lesson.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{getDayLabel(lesson.schedule.dayOfWeek)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(lesson.schedule.startTime)} - {formatTime(lesson.schedule.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{lesson.enrolledCount || 0}/{lesson.capacity}</span>
                    </div>
                    {lesson.venue && (
                      <span>{lesson.venue}</span>
                    )}
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    lesson.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lesson.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lesson Students */}
        {selectedLesson && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                תלמידי השיעור
              </h4>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium font-reisinger-yonatan">
                נהל תלמידים
              </button>
            </div>
            
            {lessonStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-reisinger-yonatan">אין תלמידים רשומים לשיעור</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lessonStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm font-reisinger-yonatan">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500 font-reisinger-yonatan">
                        {student.instrument && `${student.instrument} • `}
                        {student.grade && `כיתה ${student.grade} • `}
                        רישום: {new Date(student.enrollmentDate).toLocaleDateString('he-IL')}
                      </div>
                      {student.attendance && (
                        <div className="text-xs text-gray-500 mt-1 font-reisinger-yonatan">
                          נוכחות: {student.attendance.present}/{student.attendance.total} שיעורים
                          <span className={`ml-2 ${
                            (student.attendance.present / student.attendance.total) >= 0.8 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            ({Math.round((student.attendance.present / student.attendance.total) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Lesson Modal */}
      {showAddModal && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowAddModal(false)
            setEditingLesson(null)
          }}
          onSubmit={handleLessonSubmit}
        />
      )}
    </div>
  )
}

// Lesson Modal Component
interface LessonModalProps {
  lesson: TheoryLesson | null
  onClose: () => void
  onSubmit: (data: Partial<TheoryLesson>) => void
}

function LessonModal({ lesson, onClose, onSubmit }: LessonModalProps) {
  const [formData, setFormData] = useState({
    name: lesson?.name || '',
    description: lesson?.description || '',
    level: lesson?.level || 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: lesson?.duration || 60,
    capacity: lesson?.capacity || 15,
    status: lesson?.status || 'active' as 'active' | 'inactive',
    venue: lesson?.venue || '',
    schedule: {
      dayOfWeek: lesson?.schedule?.dayOfWeek || 'sunday',
      startTime: lesson?.schedule?.startTime || '09:00',
      endTime: lesson?.schedule?.endTime || '10:00'
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleScheduleChange = (field: keyof typeof formData.schedule, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {lesson ? 'עריכת שיעור תיאוריה' : 'הוספת שיעור תיאוריה חדש'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              שם השיעור *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תיאור השיעור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                רמה *
              </label>
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוניים</option>
                <option value="advanced">מתקדמים</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                משך השיעור (דקות) *
              </label>
              <input
                type="number"
                required
                min="30"
                max="180"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                קיבולת תלמידים *
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                סטטוס
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">פעיל</option>
                <option value="inactive">לא פעיל</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              יום השיעור *
            </label>
            <select
              required
              value={formData.schedule.dayOfWeek}
              onChange={(e) => handleScheduleChange('dayOfWeek', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sunday">יום ראשון</option>
              <option value="monday">יום שני</option>
              <option value="tuesday">יום שלישי</option>
              <option value="wednesday">יום רביעי</option>
              <option value="thursday">יום חמישי</option>
              <option value="friday">יום שישי</option>
              <option value="saturday">יום שבת</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת התחלה *
              </label>
              <input
                type="time"
                required
                value={formData.schedule.startTime}
                onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת סיום *
              </label>
              <input
                type="time"
                required
                value={formData.schedule.endTime}
                onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מקום השיעור
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              {lesson ? 'עדכן' : 'הוסף'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Plus, Search, Edit, Trash2, UserPlus, BookOpen, Eye, Calendar, AlertTriangle } from 'lucide-react'
import apiService from '../../services/apiService.js'
import EnhancedStudentCard from './EnhancedStudentCard'

interface Student {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  email?: string
  phone?: string
  instrument?: string
  grade?: string
  status: 'active' | 'inactive'
  joinDate?: string
  // Enhanced data from backend
  personalInfo?: {
    fullName: string
    phone?: string
    age?: number
    class?: string
  }
  academicInfo?: {
    instrumentProgress?: Array<{
      instrumentName: string
      currentStage: number
      isPrimary: boolean
    }>
    isActive?: boolean
  }
  teacherAssignments?: Array<{
    teacherId: string
    day: string
    time: string
    duration: number
  }>
  scheduleInfo?: {
    day: string
    startTime: string
    endTime: string
    duration: number
  }
}

export default function TeacherStudentsTab() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    loadTeacherStudents()
  }, [user])

  const loadTeacherStudents = async (showLoading = true) => {
    if (!user?._id) return

    try {
      if (showLoading) setLoading(true)
      setError(null) // Clear previous errors
      
      const teacherId = user._id
      
      // First get teacher profile to access studentIds
      const teacherProfile = await apiService.teachers.getTeacher(teacherId)
      
      if (!teacherProfile) {
        throw new Error('לא נמצא פרופיל מורה')
      }
      
      const studentIds = teacherProfile?.teaching?.studentIds || []
      
      if (studentIds.length === 0) {
        console.log('No students assigned to teacher')
        setStudents([])
        setRetryCount(0)
        return
      }

      // Fetch specific students using batch endpoint
      const students = await apiService.students.getBatchStudents(studentIds)
      
      if (!Array.isArray(students)) {
        throw new Error('תגובה לא תקינה מהשרת')
      }
      
      // Double-check filtering at component level for extra safety
      const filteredStudents = students.filter(student => 
        studentIds.includes(student._id) || studentIds.includes(student.id)
      )
      
      if (filteredStudents.length !== students.length) {
        console.warn(`🔧 Component-level filtering: ${filteredStudents.length}/${students.length} students match teacher's student IDs`)
      }
      
      // Map backend data to enhanced frontend format
      const mappedStudents = filteredStudents.map(student => {
        // Handle fullName split or use firstName/lastName if available
        const fullName = student.personalInfo?.fullName || ''
        const nameParts = fullName.split(' ')
        
        return {
          id: student._id,
          firstName: student.personalInfo?.firstName || nameParts[0] || '',
          lastName: student.personalInfo?.lastName || nameParts.slice(1).join(' ') || '',
          fullName: fullName,
          email: student.personalInfo?.email || student.contactInfo?.email || '',
          phone: student.personalInfo?.phone || student.contactInfo?.phone || '',
          instrument: student.academicInfo?.primaryInstrument || student.primaryInstrument || '',
          grade: student.academicInfo?.gradeLevel || '',
          status: student.academicInfo?.isActive !== false ? 'active' : 'inactive',
          joinDate: student.createdAt,
          // Enhanced backend data for new card
          personalInfo: {
            fullName: fullName,
            phone: student.personalInfo?.phone || student.contactInfo?.phone,
            age: student.personalInfo?.age,
            class: student.personalInfo?.class || student.academicInfo?.class
          },
          academicInfo: {
            instrumentProgress: student.academicInfo?.instrumentProgress || [],
            isActive: student.academicInfo?.isActive !== false
          },
          teacherAssignments: student.teacherAssignments || [],
          scheduleInfo: student.scheduleInfo
        }
      })
      
      setStudents(mappedStudents)
      setRetryCount(0) // Reset retry count on success
    } catch (error) {
      console.error('Error loading teacher students:', error)
      setError('שגיאה בטעינת רשימת התלמידים. בדוק את החיבור לאינטרנט ונסה שוב.')
      setRetryCount(prev => prev + 1)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    searchTerm === '' || 
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteStudent = async (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    const studentName = student?.personalInfo?.fullName || student?.fullName || 'התלמיד'
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${studentName}?\n\nפעולה זו תמחק את כל הנתונים הקשורים לתלמיד ולא ניתנת לביטול.`)) return

    try {
      await apiService.students.deleteStudent(studentId)
      setStudents(prev => prev.filter(s => s.id !== studentId))
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg z-50'
      successMsg.innerHTML = `<div class="flex items-center gap-2 font-reisinger-yonatan"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>${studentName} נמחק בהצלחה</div>`
      document.body.appendChild(successMsg)
      setTimeout(() => successMsg.remove(), 3000)
    } catch (error) {
      console.error('Error deleting student:', error)
      
      // Show error message
      const errorMsg = document.createElement('div')
      errorMsg.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50'
      errorMsg.innerHTML = `<div class="flex items-center gap-2 font-reisinger-yonatan"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>שגיאה במחיקת ${studentName}</div>`
      document.body.appendChild(errorMsg)
      setTimeout(() => errorMsg.remove(), 5000)
    }
  }

  const handleViewDetails = (studentId: string) => {
    // Navigate to student details page
    window.location.href = `/students/${studentId}`
  }

  const handleScheduleLesson = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student) {
      // Open schedule modal or navigate to scheduling page
      console.log('Schedule lesson for:', student.personalInfo?.fullName)
      alert(`תכונה זו תהיה זמינה בקרוב עבור ${student.personalInfo?.fullName}`)
    }
  }

  const handleStudentSubmit = async (studentData: Partial<Student>) => {
    try {
      if (editingStudent) {
        // Update existing student
        const backendData = {
          personalInfo: {
            firstName: studentData.firstName,
            lastName: studentData.lastName
          },
          contactInfo: {
            email: studentData.email,
            phone: studentData.phone
          },
          academicInfo: {
            gradeLevel: studentData.grade
          },
          status: studentData.status
        }
        
        const updatedStudent = await apiService.students.updateStudent(editingStudent.id, backendData)
        
        // Map response back to frontend format
        const mappedStudent = {
          id: updatedStudent._id,
          firstName: updatedStudent.personalInfo?.firstName || '',
          lastName: updatedStudent.personalInfo?.lastName || '',
          email: updatedStudent.contactInfo?.email || '',
          phone: updatedStudent.contactInfo?.phone || '',
          instrument: updatedStudent.primaryInstrument || '',
          grade: updatedStudent.academicInfo?.gradeLevel || '',
          status: updatedStudent.status || 'active',
          joinDate: updatedStudent.createdAt
        }
        
        setStudents(prev => prev.map(s => 
          s.id === editingStudent.id ? mappedStudent : s
        ))
      } else {
        // Create new student
        const teacherId = user?._id
        const backendData = {
          personalInfo: {
            firstName: studentData.firstName,
            lastName: studentData.lastName
          },
          contactInfo: {
            email: studentData.email,
            phone: studentData.phone
          },
          academicInfo: {
            gradeLevel: studentData.grade
          },
          status: studentData.status,
          teacherId
        }
        
        const newStudent = await apiService.students.createStudent(backendData)
        
        // Map response back to frontend format
        const mappedStudent = {
          id: newStudent._id,
          firstName: newStudent.personalInfo?.firstName || '',
          lastName: newStudent.personalInfo?.lastName || '',
          email: newStudent.contactInfo?.email || '',
          phone: newStudent.contactInfo?.phone || '',
          instrument: newStudent.primaryInstrument || '',
          grade: newStudent.academicInfo?.gradeLevel || '',
          status: newStudent.status || 'active',
          joinDate: newStudent.createdAt
        }
        
        setStudents(prev => [...prev, mappedStudent])
      }
      setShowAddModal(false)
      setEditingStudent(null)
    } catch (error) {
      console.error('Error saving student:', error)
      alert('שגיאה בשמירת פרטי התלמיד')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען רשימת תלמידים...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-semibold font-reisinger-yonatan">שגיאה בטעינת הנתונים</h3>
            <p className="text-red-700 text-sm font-reisinger-yonatan mt-1">{error}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadTeacherStudents()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-reisinger-yonatan"
          >
            נסה שוב
          </button>
          {retryCount > 2 && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-reisinger-yonatan"
            >
              רענן דף
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
התלמידים שלי
          </h3>
          <p className="text-gray-600 mt-1">
            {students.length} תלמידים רשומים
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="font-reisinger-yonatan">הוסף תלמיד</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="חיפוש תלמידים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="rtl"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">
            {searchTerm ? 'לא נמצאו תלמידים' : 'אין תלמידים רשומים'}
          </h3>
          <p className="text-gray-600 font-reisinger-yonatan">
            {searchTerm ? 'נסה מילות חיפוש אחרות' : 'התחל בהוספת התלמיד הראשון שלך'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              <UserPlus className="w-4 h-4" />
              הוסף תלמיד ראשון
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Students Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900 font-reisinger-yonatan">סה״כ תלמידים</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{students.length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900 font-reisinger-yonatan">פעילים</span>
              </div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {students.filter(s => s.status === 'active').length}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900 font-reisinger-yonatan">עם שיעורים</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {students.filter(s => s.scheduleInfo || s.teacherAssignments?.length > 0).length}
              </div>
            </div>
          </div>

          {/* Enhanced Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <EnhancedStudentCard
                key={student.id}
                student={student}
                onEdit={(student) => {
                  setEditingStudent(student)
                  setShowAddModal(true)
                }}
                onDelete={handleDeleteStudent}
                onViewDetails={handleViewDetails}
                onScheduleLesson={handleScheduleLesson}
              />
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Student Modal */}
      {showAddModal && (
        <StudentModal
          student={editingStudent}
          onClose={() => {
            setShowAddModal(false)
            setEditingStudent(null)
          }}
          onSubmit={handleStudentSubmit}
        />
      )}
    </div>
  )
}

// Enhanced Student Modal Component
interface StudentModalProps {
  student: Student | null
  onClose: () => void
  onSubmit: (data: Partial<Student>) => void
}

function StudentModal({ student, onClose, onSubmit }: StudentModalProps) {
  const [formData, setFormData] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    instrument: student?.instrument || '',
    grade: student?.grade || '',
    status: student?.status || 'active' as 'active' | 'inactive',
    age: student?.personalInfo?.age || '',
    class: student?.personalInfo?.class || student?.grade || ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'שם פרטי הוא שדה חובה'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'שם משפחה הוא שדה חובה'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת מייל לא תקינה'
    }
    
    if (formData.phone && !/^[\d\-\+\(\)\s]{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'מספר טלפון לא תקין'
    }
    
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 5 || Number(formData.age) > 25)) {
      newErrors.age = 'גיל צריך להיות בין 5 ל-25'
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {student ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שם פרטי *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, firstName: e.target.value }))
                  if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }))
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="הכנס שם פרטי"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600 font-reisinger-yonatan">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שם משפחה *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, lastName: e.target.value }))
                  if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }))
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="הכנס שם משפחה"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600 font-reisinger-yonatan">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                גיל
              </label>
              <input
                type="number"
                min="5"
                max="25"
                value={formData.age}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, age: e.target.value }))
                  if (errors.age) setErrors(prev => ({ ...prev, age: '' }))
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.age ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="גיל"
              />
              {errors.age && (
                <p className="mt-1 text-xs text-red-600 font-reisinger-yonatan">{errors.age}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                כיתה
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="למשל: יא, יב, ט"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              כלי נגינה עיקרי
            </label>
            <select
              value={formData.instrument}
              onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">בחר כלי נגינה</option>
              <option value="פסנתר">פסנתר</option>
              <option value="כינור">כינור</option>
              <option value="צ'לו">צ'לו</option>
              <option value="ויולה">ויולה</option>
              <option value="חצוצרה">חצוצרה</option>
              <option value="טרומבון">טרומבון</option>
              <option value="קלרינט">קלרינט</option>
              <option value="חליל">חליל</option>
              <option value="סקסופון">סקסופון</option>
              <option value="הורן">הורן</option>
              <option value="טובה">טובה</option>
              <option value="כלי הקשה">כלי הקשה</option>
              <option value="גיטרה">גיטרה</option>
              <option value="קונטרבס">קונטרבס</option>
              <option value="אחר">אחר</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              דוא"ל
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, email: e.target.value }))
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
              }`}
              dir="ltr"
              placeholder="student@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 font-reisinger-yonatan">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, phone: e.target.value }))
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
              }`}
              dir="ltr"
              placeholder="05X-XXXXXXX"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 font-reisinger-yonatan">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              סטטוס התלמיד
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">✅ פעיל - תלמיד פעיל</option>
              <option value="inactive">⏸️ לא פעיל - השהייה זמנית</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-reisinger-yonatan flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {student ? 'מעדכן...' : 'מוסיף...'}
                </>
              ) : (
                <>
                  {student ? (
                    <>
                      <Edit className="w-4 h-4" />
                      עדכן תלמיד
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      הוסף תלמיד
                    </>
                  )}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-reisinger-yonatan flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              ביטול
            </button>
          </div>
        </form>

        {/* Success/Error Messages */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-reisinger-yonatan text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>יש שגיאות בטופס, אנא תקן אותן ונסה שוב</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
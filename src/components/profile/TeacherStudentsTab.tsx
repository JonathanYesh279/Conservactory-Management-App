import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Plus, Search, Edit, Trash2, UserPlus, BookOpen, Eye, Calendar, AlertTriangle, Filter, X, CheckSquare, Clock, Music, Star, Phone, Mail, Award } from 'lucide-react'
import apiService from '../../services/apiService.js'
import EnhancedStudentCard from './EnhancedStudentCard'
import { VALID_LOCATIONS } from '../../constants/locations'

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
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    instrument: 'all',
    hasSchedule: 'all',
    bagrutStatus: 'all'
  })
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [allSystemStudents, setAllSystemStudents] = useState<any[]>([])
  const [loadingSystemStudents, setLoadingSystemStudents] = useState(false)

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

  const loadAllSystemStudents = async () => {
    try {
      setLoadingSystemStudents(true)

      // Get all students from the system
      const response = await apiService.students.getStudents()

      if (!response || !Array.isArray(response)) {
        console.error('Invalid response from getStudents')
        setAllSystemStudents([])
        return
      }

      // Get current teacher's student IDs to filter them out
      const teacherId = user?._id
      const teacherProfile = await apiService.teachers.getTeacher(teacherId)
      const assignedStudentIds = teacherProfile?.teaching?.studentIds || []

      // Filter out students that are already assigned to this teacher
      const availableStudents = response.filter(student =>
        !assignedStudentIds.includes(student._id) && !assignedStudentIds.includes(student.id)
      )

      setAllSystemStudents(availableStudents)
    } catch (error) {
      console.error('Error loading all students:', error)
      setAllSystemStudents([])
    } finally {
      setLoadingSystemStudents(false)
    }
  }

  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.instrument?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus = filters.status === 'all' || student.status === filters.status

    // Instrument filter
    const matchesInstrument = filters.instrument === 'all' || student.instrument === filters.instrument

    // Schedule filter
    const hasSchedule = student.scheduleInfo || student.teacherAssignments?.length > 0
    const matchesSchedule = filters.hasSchedule === 'all' ||
      (filters.hasSchedule === 'yes' && hasSchedule) ||
      (filters.hasSchedule === 'no' && !hasSchedule)

    // Bagrut filter
    const isBagrutStudent = student.academicInfo?.isBagrutStudent ||
      student.academicInfo?.instrumentProgress?.some(p => p.currentStage >= 4)
    const matchesBagrut = filters.bagrutStatus === 'all' ||
      (filters.bagrutStatus === 'yes' && isBagrutStudent) ||
      (filters.bagrutStatus === 'no' && !isBagrutStudent)

    return matchesSearch && matchesStatus && matchesInstrument && matchesSchedule && matchesBagrut
  })

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
      // Navigate to schedule with student pre-selected
      window.location.href = `/teacher/schedule?student=${studentId}`
    }
  }

  const handleMarkAttendance = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student) {
      window.location.href = `/teacher/attendance?student=${studentId}`
    }
  }

  const handleAddNote = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    if (student) {
      const note = prompt(`הוסף הערה עבור ${student.personalInfo?.fullName}:`)
      if (note && note.trim()) {
        // In a real app, this would save to the backend
        showNotification(`הערה נוספה עבור ${student.personalInfo?.fullName}`, 'success')
      }
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
    }`
    notification.innerHTML = `<div class="flex items-center gap-2 font-reisinger-yonatan">
      ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}
    </div>`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  const handleBulkAction = (action: string) => {
    const selectedStudentList = Array.from(selectedStudents)

    switch (action) {
      case 'markAttendance':
        window.location.href = `/teacher/attendance?students=${selectedStudentList.join(',')}`
        break
      case 'sendMessage':
        alert(`שליחת הודעה ל-${selectedStudentList.length} תלמידים`)
        break
      case 'export':
        alert(`ייצוא נתונים של ${selectedStudentList.length} תלמידים`)
        break
      default:
        console.log('Bulk action:', action, selectedStudentList)
    }

    setSelectedStudents(new Set())
    setShowBulkActions(false)
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
    setShowBulkActions(newSelection.size > 0)
  }

  const getUniqueInstruments = () => {
    const instruments = students
      .map(s => s.instrument)
      .filter(Boolean)
      .filter((instrument, index, arr) => arr.indexOf(instrument) === index)
    return instruments.sort()
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      instrument: 'all',
      hasSchedule: 'all',
      bagrutStatus: 'all'
    })
  }

  const handleStudentAssignment = async (selectedStudent: any, instrumentData: {
    instrument: string;
    lessonDay?: string;
    lessonTime?: string;
    lessonDuration?: number;
    lessonLocation?: string;
  }) => {
    try {
      const teacherId = user?._id

      // Get the current student to access existing teacherAssignments
      const currentStudent = await apiService.students.getStudent(selectedStudent._id)

      // Check if this teacher already has an assignment with this student
      const existingAssignmentIndex = (currentStudent.teacherAssignments || []).findIndex(
        (assignment: any) => assignment.teacherId === teacherId
      )

      // Create the teacher assignment data
      const teacherAssignmentData = {
        teacherId: teacherId,
        day: instrumentData.lessonDay,
        time: instrumentData.lessonTime,
        duration: instrumentData.lessonDuration || 45,
        location: instrumentData.lessonLocation || '',
        isActive: true
      }

      let updatedAssignments
      if (existingAssignmentIndex >= 0) {
        // Update existing assignment
        updatedAssignments = [...(currentStudent.teacherAssignments || [])]
        updatedAssignments[existingAssignmentIndex] = {
          ...updatedAssignments[existingAssignmentIndex],
          ...teacherAssignmentData
        }
      } else {
        // Add new assignment
        updatedAssignments = [
          ...(currentStudent.teacherAssignments || []),
          teacherAssignmentData
        ]
      }

      // Update the student with the updated teacher assignments array
      await apiService.students.updateStudent(selectedStudent._id, {
        teacherAssignments: updatedAssignments
      })

      // Reload the teacher's students list
      await loadTeacherStudents()

      // Show success message
      showNotification(`${selectedStudent.personalInfo?.fullName} הוקצה בהצלחה`, 'success')

      setShowAssignmentModal(false)
    } catch (error) {
      console.error('Error assigning student:', error)
      showNotification('שגיאה בהקצאת התלמיד', 'error')
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
          onClick={() => {
            setShowAssignmentModal(true)
            loadAllSystemStudents()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="font-reisinger-yonatan">הקצה תלמיד</span>
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
              onClick={() => {
                setShowAssignmentModal(true)
                loadAllSystemStudents()
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              <UserPlus className="w-4 h-4" />
              הקצה תלמיד ראשון
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
                  // For now, we'll disable editing since it was part of the old creation modal
                  // In the future, this can navigate to a student profile editing page
                  alert('עריכת תלמיד זמינה רק למנהלים')
                }}
                onDelete={handleDeleteStudent}
                onViewDetails={handleViewDetails}
                onScheduleLesson={handleScheduleLesson}
              />
            ))}
          </div>
        </>
      )}

      {/* Student Assignment Modal */}
      {showAssignmentModal && (
        <StudentAssignmentModal
          allStudents={allSystemStudents}
          loading={loadingSystemStudents}
          onClose={() => {
            setShowAssignmentModal(false)
            setAllSystemStudents([])
          }}
          onSubmit={handleStudentAssignment}
        />
      )}
    </div>
  )
}

// Student Assignment Modal Component
interface StudentAssignmentModalProps {
  allStudents: any[]
  loading: boolean
  onClose: () => void
  onSubmit: (student: any, instrumentData: {
    instrument: string;
    lessonDay?: string;
    lessonTime?: string;
    lessonDuration?: number;
    lessonLocation?: string;
  }) => void
}

function StudentAssignmentModal({ allStudents, loading, onClose, onSubmit }: StudentAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    instrument: '',
    lessonDay: '',
    lessonTime: '',
    lessonDuration: 45,
    lessonLocation: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Filter students based on search query - enhanced for flexible word matching
  const filteredStudents = allStudents.filter(student => {
    const searchLower = searchQuery.toLowerCase().trim()

    // If no search query, show all students
    if (!searchLower) return true

    const fullName = student.personalInfo?.fullName || `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim()
    const studentClass = student.personalInfo?.class || student.academicInfo?.class || ''
    const instruments = [
      student.academicInfo?.primaryInstrument,
      ...(student.academicInfo?.instrumentProgress?.map((i: any) => i.instrumentName) || [])
    ].filter(Boolean).join(' ')

    // Combine all searchable text
    const searchableText = `${fullName} ${studentClass} ${instruments}`.toLowerCase()

    // Split search query into words and check if ALL words are present
    // This allows searching "בנימין לזר" or "לזר בנימין" to find "לזר בנימין"
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0)

    // Every search word must be found somewhere in the searchable text
    return searchWords.every(word => searchableText.includes(word))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent) {
      alert('אנא בחר תלמיד')
      return
    }

    if (!formData.instrument) {
      alert('אנא בחר כלי נגינה')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(selectedStudent, formData)
    } catch (error) {
      console.error('Error submitting assignment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <h3 className="text-xl font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          הקצאת תלמיד קיים
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="mr-3 text-gray-600">טוען רשימת תלמידים...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-reisinger-yonatan">
                חפש תלמיד במערכת
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="חפש לפי שם, כיתה או כלי נגינה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'לא נמצאו תלמידים התואמים את החיפוש' : 'אין תלמידים זמינים להקצאה'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map(student => {
                    const fullName = student.personalInfo?.fullName || `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim()
                    const studentClass = student.personalInfo?.class || student.academicInfo?.class || ''
                    const primaryInstrument = student.academicInfo?.primaryInstrument || ''
                    const isSelected = selectedStudent?._id === student._id

                    return (
                      <div
                        key={student._id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-r-4 border-indigo-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{fullName}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {studentClass && <span>כיתה {studentClass}</span>}
                              {primaryInstrument && (
                                <>
                                  {studentClass && ' • '}
                                  <span>{primaryInstrument}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <CheckSquare className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Instrument Assignment Section (only shown after student selected) */}
            {selectedStudent && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900 font-reisinger-yonatan">
                  פרטי השיעור עבור {selectedStudent.personalInfo?.fullName}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                      כלי נגינה לשיעור *
                    </label>
                    <select
                      value={formData.instrument}
                      onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
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
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                      יום בשבוע
                    </label>
                    <select
                      value={formData.lessonDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonDay: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">בחר יום</option>
                      <option value="ראשון">יום ראשון</option>
                      <option value="שני">יום שני</option>
                      <option value="שלישי">יום שלישי</option>
                      <option value="רביעי">יום רביעי</option>
                      <option value="חמישי">יום חמישי</option>
                      <option value="שישי">יום שישי</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                      שעת התחלה
                    </label>
                    <input
                      type="time"
                      value={formData.lessonTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                      משך (דקות)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={formData.lessonDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonDuration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                      מיקום
                    </label>
                    <select
                      value={formData.lessonLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, lessonLocation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">בחר חדר</option>
                      {VALID_LOCATIONS.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                type="submit"
                disabled={!selectedStudent || !formData.instrument || submitting}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-reisinger-yonatan flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    מקצה...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    הקצה תלמיד
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-reisinger-yonatan flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
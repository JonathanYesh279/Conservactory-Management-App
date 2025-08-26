/**
 * Student Management Tab Component
 * 
 * Manages students assigned to the teacher
 */

import { useState, useEffect, useRef } from 'react'
import { Users, Plus, Trash2, Calendar, Clock, User, Search, X, ChevronDown } from 'lucide-react'
import { Teacher } from '../../types'
import apiService from '../../../../../services/apiService'

interface StudentManagementTabProps {
  teacher: Teacher
  teacherId: string
}

interface Student {
  _id: string
  personalInfo: {
    fullName: string
  }
  academicInfo?: {
    class?: string
  }
  primaryInstrument?: string
}

const StudentManagementTab: React.FC<StudentManagementTabProps> = ({ teacher, teacherId }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        
        // Fetch teacher's current students
        if (teacher.teaching?.studentIds?.length > 0) {
          const studentPromises = teacher.teaching.studentIds.map(studentId =>
            apiService.students.getStudentById(studentId)
          )
          const studentData = await Promise.all(studentPromises)
          setStudents(studentData)
        }
        
        // Fetch all students for the add student dropdown
        const allStudentsData = await apiService.students.getStudents()
        setAllStudents(allStudentsData)
      } catch (error) {
        console.error('Error fetching students:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [teacher.teaching?.studentIds])

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student._id)
    setSearchTerm(student.personalInfo?.fullName || '')
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSelectedStudentId('')
    setShowDropdown(true)
    setHighlightedIndex(-1)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('')
    setSelectedStudentId('')
    setShowDropdown(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setShowDropdown(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredStudents.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredStudents.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredStudents[highlightedIndex]) {
          handleStudentSelect(filteredStudents[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId) return

    try {
      await apiService.teachers.addStudentToTeacher(teacherId, selectedStudentId)
      
      // Refresh students list
      const newStudent = await apiService.students.getStudentById(selectedStudentId)
      setStudents(prev => [...prev, newStudent])
      
      setIsAddingStudent(false)
      setSelectedStudentId('')
      setSearchTerm('')
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר את התלמיד מהמורה?')) return

    try {
      await apiService.teachers.removeStudentFromTeacher(teacherId, studentId)
      
      // Remove from local state
      setStudents(prev => prev.filter(student => student._id !== studentId))
    } catch (error) {
      console.error('Error removing student:', error)
    }
  }

  // Get available students (not already assigned to this teacher)
  const availableStudents = allStudents.filter(student => 
    !teacher.teaching?.studentIds?.includes(student._id)
  )

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => {
    const fullName = student.personalInfo?.fullName || ''
    const className = student.academicInfo?.class || ''
    const searchQuery = searchTerm.toLowerCase()
    return (
      fullName.toLowerCase().includes(searchQuery) ||
      className.toLowerCase().includes(searchQuery)
    )
  })

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search and dropdown when modal closes
  useEffect(() => {
    if (!isAddingStudent) {
      setSearchTerm('')
      setSelectedStudentId('')
      setShowDropdown(false)
      setHighlightedIndex(-1)
    }
  }, [isAddingStudent])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsAddingStudent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          הוסף תלמיד
        </button>
      </div>

      {/* Add Student Modal */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 teacher-modal-backdrop">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all teacher-modal-container">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">הוסף תלמיד חדש</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-800 teacher-modal-label">
                    חפש ובחר תלמיד
                  </label>
                  <div className="text-xs text-gray-500">
                    ↑↓ לניווט • Enter לבחירה • Esc לסגירה
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  {/* Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="הקלד שם תלמיד או כיתה..."
                      className="w-full pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white teacher-search-input"
                      style={{ paddingLeft: searchTerm ? '2.5rem' : '2.5rem' }}
                    />
                    {searchTerm ? (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center hover:bg-gray-50 rounded-r-lg"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    ) : (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto teacher-search-dropdown teacher-dropdown-enter">
                      {filteredStudents.length > 0 ? (
                        <>
                          {filteredStudents.map((student, index) => (
                            <button
                              key={student._id}
                              onClick={() => handleStudentSelect(student)}
                              className={`w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 teacher-search-option ${
                                index === highlightedIndex ? 'bg-primary-50 text-primary-700 highlighted' : 'text-gray-900'
                              } ${selectedStudentId === student._id ? 'bg-primary-100 text-primary-700 font-medium' : ''}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {student.personalInfo?.fullName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  כיתה {student.academicInfo?.class || 'לא צוין'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          {searchTerm ? 'לא נמצאו תלמידים' : 'אין תלמידים זמינים'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 teacher-modal-buttons">
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentId}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm font-medium teacher-modal-button"
                >
                  הוסף
                </button>
                <button
                  onClick={() => {
                    setIsAddingStudent(false)
                    setSelectedStudentId('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm font-medium teacher-modal-button"
                >
                  בטל
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין תלמידים משויכים</h3>
          <p className="text-gray-600 mb-4">
            עדיין לא שויכו תלמידים למורה זה
          </p>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all shadow-sm font-medium"
          >
            הוסף תלמיד ראשון
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map(student => (
            <div
              key={student._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {student.personalInfo?.fullName || 'ללא שם'}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>כיתה {student.academicInfo?.class || 'לא צוין'}</span>
                      <span>•</span>
                      <span>{student.primaryInstrument || 'ללא כלי'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/students/${student._id}`}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-sm font-medium"
                  >
                    צפה בפרטים
                  </button>
                  <button
                    onClick={() => handleRemoveStudent(student._id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all shadow-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    הסר
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Overview for Students */}
      {students.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            סקירת לוח זמנים
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacher.timeBlocks?.map((timeBlock, index) => (
              <div key={timeBlock._id || index} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{timeBlock.day}</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.round(timeBlock.totalDuration / 60)} שעות
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {timeBlock.startTime} - {timeBlock.endTime}
                </div>
                {timeBlock.location && (
                  <div className="text-sm text-gray-500 mt-1">
                    📍 {timeBlock.location}
                  </div>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  {timeBlock.assignedLessons?.length || 0} שיעורים מתוכננים
                </div>
              </div>
            ))}
          </div>
          
          {(!teacher.timeBlocks || teacher.timeBlocks.length === 0) && (
            <div className="text-center text-gray-500 py-4">
              אין בלוקי זמן מוגדרים עדיין
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentManagementTab
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Edit, Filter, Loader, X, Grid, List, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import Card from '../components/ui/Card'
import Table, { StatusBadge } from '../components/ui/Table'
import StudentCard from '../components/StudentCard'
import StudentForm from '../components/forms/StudentForm'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'

export default function Students() {
  const navigate = useNavigate()
  const { currentSchoolYear, isLoading: schoolYearLoading } = useSchoolYear()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    orchestra: '',
    instrument: '',
    teacher: '',
    stageLevel: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('')
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null)
  const [editingStudentData, setEditingStudentData] = useState<any>(null)
  const [loadingStudentData, setLoadingStudentData] = useState(false)
  const [stageLevelConfirm, setStageLevelConfirm] = useState<{studentId: string, studentName: string, currentLevel: number, newLevel: number} | null>(null)
  const [updatingStageLevel, setUpdatingStageLevel] = useState<string | null>(null)
  const [editingStageLevelId, setEditingStageLevelId] = useState<string | null>(null)

  // Close stage level edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (editingStageLevelId) {
        setEditingStageLevelId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editingStageLevelId])

  // Fetch students and teachers from real API when school year changes
  useEffect(() => {
    if (!schoolYearLoading) {
      // Load even if no school year is selected, backend will handle it
      loadStudents()
      loadTeachers()
    }
  }, [currentSchoolYear, schoolYearLoading])

  // Initialize teacher search term when teachers load and there's an existing filter
  useEffect(() => {
    if (filters.teacher && teachers.length > 0 && !teacherSearchTerm) {
      const selectedTeacher = teachers.find(t => t._id === filters.teacher)
      if (selectedTeacher) {
        setTeacherSearchTerm(selectedTeacher.personalInfo?.fullName || '')
      }
    }
  }, [filters.teacher, teachers, teacherSearchTerm])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Include schoolYearId in the request
      const filters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}
      const response = await apiService.students.getStudents(filters)
      
      // Map response data using CORRECT database field names
      const students = response.map(student => ({
        id: student._id,
        fullName: student.personalInfo.fullName,
        phone: student.personalInfo.phone,
        age: student.personalInfo.age,
        class: student.academicInfo.class,
        primaryInstrument: student.academicInfo.instrumentProgress
          .find(inst => inst.isPrimary)?.instrumentName || 
          student.academicInfo.instrumentProgress[0]?.instrumentName || 'ללא כלי',
        currentStage: student.academicInfo.instrumentProgress
          .find(inst => inst.isPrimary)?.currentStage || 1,
        teacherAssignments: student.teacherAssignments,
        parentName: student.personalInfo.parentName,
        parentPhone: student.personalInfo.parentPhone,
        orchestraIds: student.enrollments.orchestraIds,
        isActive: student.isActive
      }))
      
      // Transform for table display
      const transformedStudents = students.map(student => ({
        id: student.id,
        name: student.fullName,
        instrument: student.primaryInstrument,
        stageLevel: student.currentStage,
        orchestra: student.orchestraIds?.length > 0 ? 'תזמורת' : 'ללא תזמורת',
        grade: <StatusBadge status="completed">{student.class}</StatusBadge>,
        status: <StatusBadge status={student.isActive ? "active" : "inactive"}>
          {student.isActive ? 'פעיל' : 'לא פעיל'}
        </StatusBadge>,
        teacherAssignments: student.teacherAssignments?.length || 0,
        rawData: student,
        // Add the original API response data for StudentCard compatibility
        originalStudent: response.find(s => s._id === student.id),
        actions: (
          <div className="flex space-x-2 space-x-reverse">
            <button 
              className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click
                console.log('Eye icon clicked for student:', student.id)
                handleViewStudent(student.id)
              }}
              title="צפה בפרטי התלמיד"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click
                handleEditStudent(student.id)
              }}
              title="ערוך פרטי התלמיד"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent row click
                handleDeleteClick(student.id, student.name)
              }}
              title="מחק תלמיד"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      }))
      
      setStudents(transformedStudents)
    } catch (err) {
      console.error('Error loading students:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTeachers = async () => {
    try {
      setTeachersLoading(true)
      // Include schoolYearId in the request
      const apiFilters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}
      const teachersData = await apiService.teachers.getTeachers(apiFilters)
      setTeachers(teachersData)
    } catch (err) {
      console.error('Error loading teachers:', err)
    } finally {
      setTeachersLoading(false)
    }
  }

  const handleViewStudent = (studentId) => {
    console.log('=== NAVIGATION DEBUG ===')
    console.log('Student ID:', studentId)
    console.log('Target path:', `/students/${studentId}`)
    console.log('Current location:', window.location.pathname)
    
    // Direct navigation without async
    const targetPath = `/students/${studentId}`
    
    // Force navigation with window.location as fallback
    try {
      navigate(targetPath)
      console.log('Navigate function called successfully')
    } catch (error) {
      console.error('Navigate failed, using window.location:', error)
      window.location.href = targetPath
    }
  }

  const handleEditStudent = async (studentId: string) => {
    try {
      setLoadingStudentData(true)
      setEditingStudentId(studentId)
      
      // Load student data for editing
      const studentData = await apiService.students.getStudentById(studentId)
      setEditingStudentData(studentData)
      
      setShowForm(true)
    } catch (error) {
      console.error('Error loading student for editing:', error)
      alert('שגיאה בטעינת נתוני התלמיד לעריכה')
    } finally {
      setLoadingStudentData(false)
    }
  }

  const handleAddStudent = () => {
    setEditingStudentId(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingStudentId(null)
    setEditingStudentData(null)
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      let studentId = editingStudentId
      
      if (editingStudentId) {
        // Update existing student
        await apiService.students.updateStudent(editingStudentId, formData)
        
        // Handle orchestra enrollment changes
        if (editingStudentData?.enrollments?.orchestraIds) {
          const oldOrchestraIds = editingStudentData.enrollments.orchestraIds
          const newOrchestraIds = formData.enrollments?.orchestraIds || []
          
          // Remove from old orchestras that are no longer selected
          for (const oldId of oldOrchestraIds) {
            if (!newOrchestraIds.includes(oldId)) {
              try {
                await apiService.orchestras.removeMember(oldId, editingStudentId)
                console.log(`Removed student ${editingStudentId} from orchestra ${oldId}`)
              } catch (err) {
                console.error(`Failed to remove from orchestra ${oldId}:`, err)
              }
            }
          }
          
          // Add to new orchestras
          for (const newId of newOrchestraIds) {
            if (!oldOrchestraIds.includes(newId)) {
              try {
                await apiService.orchestras.addMember(newId, editingStudentId)
                console.log(`Added student ${editingStudentId} to orchestra ${newId}`)
              } catch (err) {
                console.error(`Failed to add to orchestra ${newId}:`, err)
              }
            }
          }
        } else if (formData.enrollments?.orchestraIds?.length > 0) {
          // If no previous enrollments, add to all new orchestras
          for (const orchestraId of formData.enrollments.orchestraIds) {
            try {
              await apiService.orchestras.addMember(orchestraId, editingStudentId)
              console.log(`Added student ${editingStudentId} to orchestra ${orchestraId}`)
            } catch (err) {
              console.error(`Failed to add to orchestra ${orchestraId}:`, err)
            }
          }
        }
      } else {
        // Create new student
        const newStudent = await apiService.students.createStudent(formData)
        studentId = newStudent._id
        
        // Add new student to selected orchestras
        if (formData.enrollments?.orchestraIds?.length > 0) {
          for (const orchestraId of formData.enrollments.orchestraIds) {
            try {
              await apiService.orchestras.addMember(orchestraId, studentId)
              console.log(`Added new student ${studentId} to orchestra ${orchestraId}`)
            } catch (err) {
              console.error(`Failed to add to orchestra ${orchestraId}:`, err)
            }
          }
        }
      }
      
      loadStudents() // Reload the students list
      handleCloseForm() // Close the form
    } catch (error) {
      console.error('Error saving student:', error)
      throw error // Let the form handle the error display
    }
  }

  const handleFormCancel = () => {
    handleCloseForm()
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await apiService.students.deleteStudent(studentId)
      // Reload students list after successful deletion
      loadStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
      alert('שגיאה במחיקת התלמיד')
    }
  }

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName })
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      handleDeleteStudent(studentToDelete.id)
      setStudentToDelete(null)
    }
    setShowDeleteModal(false)
  }

  const handleCancelDelete = () => {
    setStudentToDelete(null)
    setShowDeleteModal(false)
  }

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => 
    teacher.personalInfo?.fullName?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) || false
  )

  // Get selected teacher name for display
  const getSelectedTeacherName = () => {
    if (!filters.teacher) return ''
    const teacher = teachers.find(t => t._id === filters.teacher)
    return teacher?.personalInfo?.fullName || ''
  }

  // Handle teacher selection
  const handleTeacherSelect = (teacherId: string, teacherName: string) => {
    setFilters(prev => ({ ...prev, teacher: teacherId }))
    setTeacherSearchTerm(teacherName)
    setShowTeacherDropdown(false)
  }

  // Handle teacher search input
  const handleTeacherSearchChange = (value: string) => {
    setTeacherSearchTerm(value)
    setShowTeacherDropdown(true)
    
    // If the input is cleared, clear the filter
    if (value === '') {
      setFilters(prev => ({ ...prev, teacher: '' }))
    }
  }

  // Handle stage level edit mode
  const handleStageLevelClick = (studentId: string) => {
    setEditingStageLevelId(studentId)
  }

  // Handle stage level update confirmation
  const handleStageLevelChange = (studentId: string, studentName: string, currentLevel: number, increment: boolean) => {
    const newLevel = increment ? currentLevel + 1 : currentLevel - 1
    
    // Validate stage level bounds (1-8)
    if (newLevel < 1 || newLevel > 8) {
      return
    }
    
    setStageLevelConfirm({
      studentId,
      studentName,
      currentLevel,
      newLevel
    })
  }

  const handleConfirmStageLevelUpdate = async () => {
    if (!stageLevelConfirm) return
    
    try {
      setUpdatingStageLevel(stageLevelConfirm.studentId)
      
      await apiService.students.updateStudentStageLevel(stageLevelConfirm.studentId, stageLevelConfirm.newLevel)
      
      // Refresh students data
      await loadStudents()
      
      setStageLevelConfirm(null)
      setEditingStageLevelId(null)
    } catch (error) {
      console.error('Error updating stage level:', error)
      alert('שגיאה בעדכון השלב: ' + error.message)
    } finally {
      setUpdatingStageLevel(null)
    }
  }

  const handleCancelStageLevelUpdate = () => {
    setStageLevelConfirm(null)
    setEditingStageLevelId(null)
  }

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.instrument.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOrchestra = !filters.orchestra || student.orchestra === filters.orchestra
    const matchesInstrument = !filters.instrument || student.instrument === filters.instrument
    const matchesStageLevel = !filters.stageLevel || student.stageLevel === parseInt(filters.stageLevel)
    
    // Teacher filter: check if student has teacher assignment matching the selected teacher
    const matchesTeacher = !filters.teacher || 
      (student.rawData.teacherAssignments && 
       student.rawData.teacherAssignments.some(assignment => assignment.teacherId === filters.teacher))
    
    return matchesSearch && matchesOrchestra && matchesInstrument && matchesStageLevel && matchesTeacher
  })

  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.rawData?.isActive).length
  const inactiveStudents = totalStudents - activeStudents
  const studentsWithLessons = students.filter(s => s.teacherAssignments > 0).length

  const columns = [
    { key: 'name', header: 'שם התלמיד' },
    { key: 'instrument', header: 'כלי נגינה' },
    { 
      key: 'stageLevel', 
      header: 'שלב', 
      align: 'center' as const,
      render: (student: any) => {
        const isEditing = editingStageLevelId === student.id
        const isUpdating = updatingStageLevel === student.id
        
        if (isUpdating) {
          return (
            <div className="flex items-center justify-center">
              <div className="w-16 h-8 flex items-center justify-center bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="text-blue-600 font-medium">...</span>
              </div>
            </div>
          )
        }
        
        if (isEditing) {
          return (
            <div 
              className="flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStageLevelChange(student.id, student.name, student.stageLevel, false)
                }}
                disabled={student.stageLevel <= 1}
                className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                title="הורד שלב"
              >
                -
              </button>
              
              <div className="w-12 h-8 flex items-center justify-center bg-blue-50 rounded-lg border-2 border-blue-300 mx-1">
                <span className="text-blue-700 font-bold text-sm">{student.stageLevel}</span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStageLevelChange(student.id, student.name, student.stageLevel, true)
                }}
                disabled={student.stageLevel >= 8}
                className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                title="העלה שלב"
              >
                +
              </button>
            </div>
          )
        }
        
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStageLevelClick(student.id)
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium border border-transparent hover:border-blue-200"
              title="לחץ לעריכת השלב"
            >
              {student.stageLevel}
            </button>
          </div>
        )
      }
    },
    { key: 'orchestra', header: 'תזמורת' },
    { key: 'grade', header: 'כיתה', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    { key: 'actions', header: 'פעולות', align: 'center' as const, width: '100px' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען תלמידים...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">❌ שגיאה בטעינת הנתונים</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <button 
          onClick={loadStudents}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingStudentData ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">טוען נתוני תלמיד...</p>
              </div>
            ) : (
              <StudentForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isEdit={!!editingStudentId}
                initialData={editingStudentData}
              />
            )}
          </div>
        </div>
      )}
      {/* Filters and Search */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש תלמידים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select 
              value={filters.orchestra}
              onChange={(e) => setFilters(prev => ({ ...prev, orchestra: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל התזמורות</option>
              <option value="תזמורת">תזמורת</option>
              <option value="ללא תזמורת">ללא תזמורת</option>
            </select>
            
            <select 
              value={filters.instrument}
              onChange={(e) => setFilters(prev => ({ ...prev, instrument: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל הכלים</option>
              <option value="חלילית">חלילית</option>
              <option value="חליל צד">חליל צד</option>
              <option value="אבוב">אבוב</option>
              <option value="בסון">בסון</option>
              <option value="סקסופון">סקסופון</option>
              <option value="קלרינט">קלרינט</option>
              <option value="חצוצרה">חצוצרה</option>
              <option value="קרן יער">קרן יער</option>
              <option value="טרומבון">טרומבון</option>
              <option value="טובה/בריטון">טובה/בריטון</option>
              <option value="שירה">שירה</option>
              <option value="כינור">כינור</option>
              <option value="ויולה">ויולה</option>
              <option value="צ'לו">צ'לו</option>
              <option value="קונטרבס">קונטרבס</option>
              <option value="פסנתר">פסנתר</option>
              <option value="גיטרה">גיטרה</option>
              <option value="גיטרה בס">גיטרה בס</option>
              <option value="תופים">תופים</option>
            </select>

            {/* Teacher Filter - Searchable */}
            <div className="relative">
              <input
                type="text"
                placeholder="חפש מורה..."
                value={teacherSearchTerm}
                onChange={(e) => handleTeacherSearchChange(e.target.value)}
                onFocus={() => setShowTeacherDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow click events
                  setTimeout(() => setShowTeacherDropdown(false), 200)
                }}
                disabled={teachersLoading}
                className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
              />
              
              {/* Clear button */}
              {teacherSearchTerm && (
                <button
                  onClick={() => {
                    setTeacherSearchTerm('')
                    setFilters(prev => ({ ...prev, teacher: '' }))
                    setShowTeacherDropdown(false)
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Dropdown */}
              {showTeacherDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {teachersLoading ? (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      <Loader className="w-4 h-4 animate-spin mx-auto mb-1" />
                      טוען מורים...
                    </div>
                  ) : filteredTeachers.length > 0 ? (
                    <>
                      {/* "All teachers" option */}
                      <button
                        onClick={() => handleTeacherSelect('', 'כל המורים')}
                        className={`w-full text-right px-3 py-2 hover:bg-gray-50 border-b border-gray-100 ${
                          filters.teacher === '' ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                        }`}
                      >
                        כל המורים
                      </button>
                      
                      {/* Teacher options */}
                      {filteredTeachers.map(teacher => (
                        <button
                          key={teacher._id}
                          onClick={() => handleTeacherSelect(teacher._id, teacher.personalInfo?.fullName || 'מורה ללא שם')}
                          className={`w-full text-right px-3 py-2 hover:bg-gray-50 ${
                            filters.teacher === teacher._id ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                          }`}
                        >
                          {teacher.personalInfo?.fullName || 'מורה ללא שם'}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      לא נמצאו מורים
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stage Level Filter */}
            <select 
              value={filters.stageLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, stageLevel: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל השלבים</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                <option key={level} value={level}>שלב {level}</option>
              ))}
            </select>

            <button 
              onClick={handleAddStudent}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף תלמיד
            </button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">{totalStudents}</div>
            <div className="text-sm text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">{activeStudents}</div>
            <div className="text-sm text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">{inactiveStudents}</div>
            <div className="text-sm text-gray-600">לא פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{studentsWithLessons}</div>
            <div className="text-sm text-gray-600">עם שיעורים</div>
          </div>
        </Card>
      </div>

      {/* Results Info */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchTerm || filters.orchestra || filters.instrument || filters.teacher || filters.stageLevel ? (
            <span>מציג {filteredStudents.length} מתוך {totalStudents} תלמידים</span>
          ) : (
            <span>סה"כ {totalStudents} תלמידים</span>
          )}
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('table')}
            className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'table'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'table'}
            aria-label="תצוגת טבלה"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">טבלה</span>
            {viewMode === 'table' && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
            )}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-white text-primary-700 shadow-sm border border-gray-200 ring-1 ring-primary-500/20'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
            }`}
            aria-pressed={viewMode === 'grid'}
            aria-label="תצוגת רשת"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">רשת</span>
            {viewMode === 'grid' && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/5 to-primary-600/5 pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Students Display */}
      {viewMode === 'table' ? (
        <Table 
          columns={columns} 
          data={filteredStudents}
          onRowClick={(row) => {
            console.log('=== ROW CLICKED ===')
            console.log('Row data:', row)
            console.log('Student ID from row:', row.id)
            handleViewStudent(row.id)
          }}
          rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student.originalStudent}
              showInstruments={true}
              showTeacherAssignments={true}
              showParentContact={false}
              onClick={() => handleViewStudent(student.id)}
              onDelete={handleDeleteStudent}
              className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
            />
          ))}
        </div>
      )}

      {filteredStudents.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          לא נמצאו תלמידים התואמים לחיפוש
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת תלמיד"
        message={`האם אתה בטוח שברצונך למחוק את התלמיד ${studentToDelete?.name}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {/* Stage Level Update confirmation modal */}
      <ConfirmationModal
        isOpen={!!stageLevelConfirm}
        title="עדכון שלב התלמיד"
        message={stageLevelConfirm ? 
          `האם אתה בטוח שברצונך לשנות את שלב התלמיד "${stageLevelConfirm.studentName}" משלב ${stageLevelConfirm.currentLevel} לשלב ${stageLevelConfirm.newLevel}?`
          : ''
        }
        confirmText="עדכן שלב"
        cancelText="ביטול"
        onConfirm={handleConfirmStageLevelUpdate}
        onCancel={handleCancelStageLevelUpdate}
        variant="primary"
      />
    </div>
  )
}
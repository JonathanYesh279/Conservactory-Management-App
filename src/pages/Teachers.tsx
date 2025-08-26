import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Loader, Calendar, Users, X, Grid, List, Eye, Edit } from 'lucide-react'
import Card from '../components/ui/Card'
import Table, { StatusBadge } from '../components/ui/Table'
import TeacherCard from '../components/TeacherCard'
import AddTeacherModal from '../components/modals/AddTeacherModal'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext'

interface Teacher {
  id: string
  name: string
  specialization: string
  roles: string[]
  primaryRole: string
  studentCount: number
  email: string
  phone: string
  isActive: boolean
  hasTimeBlocks: boolean
  timeBlockCount: number
  orchestraCount: number
  ensembleCount: number
  availabilityDays: string[]
  totalTeachingHours: number
  rawData: any
}

// Helper function to check if user is admin
const isUserAdmin = (user: any): boolean => {
  console.log('🔍 ADMIN CHECK - Start:', {
    userExists: !!user,
    userType: typeof user,
    userKeys: user ? Object.keys(user) : 'no user'
  })
  
  if (!user) {
    console.log('❌ ADMIN CHECK - No user object')
    return false
  }
  
  // Check for admin role in different formats
  const hasAdminInRoles = user?.roles?.includes('מנהל')
  const hasAdminEnglish = user?.roles?.includes('admin')
  const hasSingleAdminRole = user?.role === 'admin'
  const hasHebrewAdminRole = user?.role === 'מנהל'
  
  const hasAdminRole = hasAdminInRoles || hasAdminEnglish || hasSingleAdminRole || hasHebrewAdminRole
  
  console.log('🔍 ADMIN CHECK - Detailed:', {
    user: user,
    roles: user?.roles,
    role: user?.role,
    checks: {
      hasAdminInRoles,
      hasAdminEnglish, 
      hasSingleAdminRole,
      hasHebrewAdminRole
    },
    finalResult: hasAdminRole
  })
  
  if (!hasAdminRole) {
    console.warn('⚠️  ADMIN CHECK - Access denied! User is not admin')
  } else {
    console.log('✅ ADMIN CHECK - User is admin!')
  }
  
  return hasAdminRole
}

export default function Teachers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentSchoolYear, isLoading: schoolYearLoading } = useSchoolYear()
  
  // Debug auth state
  useEffect(() => {
    console.log('🏛️ TEACHERS PAGE - Auth state changed:', {
      userExists: !!user,
      userId: user?._id,
      userRoles: user?.roles,
      userRole: user?.role,
      timestamp: new Date().toISOString()
    })
  }, [user])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    instrument: '',
    role: ''
  })
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [scheduleData, setScheduleData] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [instrumentSearchTerm, setInstrumentSearchTerm] = useState('')
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false)

  // Fetch teachers from real API when school year changes
  useEffect(() => {
    if (!schoolYearLoading) {
      // Load even if no school year is selected, backend will handle it
      loadTeachers()
    }
  }, [currentSchoolYear, schoolYearLoading])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Include schoolYearId in the request
      const filters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}
      const teachersData = await apiService.teachers.getTeachers(filters)
      
      // Use processed data from API service with computed fields
      const transformedTeachers = teachersData.map(teacher => ({
        id: teacher._id,
        name: teacher.personalInfo?.fullName || 'לא צוין',
        specialization: teacher.professionalInfo?.instrument || 'לא צוין',
        // Use roles array from database
        roles: teacher.allRoles || teacher.roles || [],
        primaryRole: teacher.primaryRole || 'לא מוגדר',
        // Use computed student count
        studentCount: teacher.studentCount || 0,
        // Contact information
        email: teacher.personalInfo?.email || '',
        phone: teacher.personalInfo?.phone || '',
        // Use computed active status (checks both levels)
        isActive: teacher.isTeacherActive,
        // Additional computed fields
        hasTimeBlocks: teacher.hasTimeBlocks || false,
        timeBlockCount: teacher.timeBlockCount || 0,
        orchestraCount: teacher.orchestraCount || 0,
        ensembleCount: teacher.ensembleCount || 0,
        availabilityDays: teacher.availabilityDays || [],
        totalTeachingHours: Math.round((teacher.totalTeachingHours / 60) * 10) / 10 || 0, // Convert to hours
        rawData: teacher, // Keep original data
        // Table display fields
        rolesDisplay: teacher.allRoles?.length > 0 ? teacher.allRoles.join(', ') : 'לא מוגדר',
        status: <StatusBadge status={teacher.isTeacherActive ? "active" : "inactive"}>
          {teacher.isTeacherActive ? 'פעיל' : 'לא פעיל'}
        </StatusBadge>,
        actions: (
          <div className="flex space-x-2 space-x-reverse">
            <button 
              className="p-1.5 text-primary-600 hover:text-primary-900 hover:bg-primary-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleViewTeacher(teacher._id)
              }}
              title="צפה בפרטי המורה"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                handleEditTeacher(teacher._id)
              }}
              title="ערוך פרטי המורה"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        )
      }))
      
      setTeachers(transformedTeachers)
    } catch (err) {
      console.error('Error loading teachers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSchedule = async (teacherId) => {
    try {
      setScheduleLoading(true)
      const teacher = teachers.find(t => t.id === teacherId)
      setSelectedTeacher(teacher)
      
      const response = await apiService.teachers.getTeacherWeeklySchedule(teacherId)
      
      // Process response data
      const scheduleByDay = {}
      if (response.schedule) {
        response.schedule.forEach(lesson => {
          const day = lesson.day
          if (!scheduleByDay[day]) scheduleByDay[day] = []
          
          scheduleByDay[day].push({
            lessonId: lesson.lessonId,
            studentId: lesson.studentId,
            studentName: lesson.studentName,
            time: lesson.time,
            duration: lesson.duration,
            location: lesson.location,
            instrument: lesson.instrumentName,
            currentStage: lesson.currentStage,
            endTime: lesson.endTime
          })
        })
      }
      
      setScheduleData(scheduleByDay)
    } catch (error) {
      console.error('Error loading teacher schedule:', error)
      setError('שגיאה בטעינת לוח הזמנים')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleCloseSchedule = () => {
    setSelectedTeacher(null)
    setScheduleData(null)
  }

  const handleViewTeacher = (teacherId: string) => {
    console.log('=== NAVIGATION DEBUG ===')
    console.log('Teacher ID:', teacherId)
    console.log('Target path:', `/teachers/${teacherId}`)
    console.log('Current location:', window.location.pathname)
    
    // Direct navigation without async
    const targetPath = `/teachers/${teacherId}`
    
    // Force navigation with window.location as fallback
    try {
      navigate(targetPath)
      console.log('Navigate function called successfully')
    } catch (error) {
      console.error('Navigate failed, using window.location:', error)
      window.location.href = targetPath
    }
  }

  const handleEditTeacher = (teacherId: string) => {
    // Navigate to teacher management page with time blocks
    window.location.href = `/teacher-management/${teacherId}`;
  }

  const handleAddTeacher = () => {
    console.log('🎯 HANDLE ADD TEACHER - Button clicked!')
    const isAdmin = isUserAdmin(user)
    
    if (isAdmin) {
      console.log('✅ HANDLE ADD TEACHER - Opening modal...')
      setShowAddTeacherModal(true)
    } else {
      console.log('❌ HANDLE ADD TEACHER - Access denied!')
      alert('רק מנהלים יכולים להוסיף מורים\n\nDEBUG INFO:\nUser: ' + JSON.stringify(user, null, 2))
    }
  }

  const handleTeacherAdded = (newTeacher: any) => {
    // Refresh the teachers list
    if (!schoolYearLoading) {
      loadTeachers()
    }
  }

  // Available instruments list
  const allInstruments = [
    'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
    'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון', 'שירה',
    'כינור', 'ויולה', "צ'לו", 'קונטרבס', 'פסנתר', 'גיטרה',
    'גיטרה בס', 'תופים'
  ]

  // Filter instruments based on search term
  const filteredInstruments = allInstruments.filter(instrument => 
    instrument.toLowerCase().includes(instrumentSearchTerm.toLowerCase())
  )

  // Handle instrument selection
  const handleInstrumentSelect = (instrument: string, instrumentName: string) => {
    setFilters(prev => ({ ...prev, instrument: instrument }))
    setInstrumentSearchTerm(instrumentName)
    setShowInstrumentDropdown(false)
  }

  // Handle instrument search input
  const handleInstrumentSearchChange = (value: string) => {
    setInstrumentSearchTerm(value)
    setShowInstrumentDropdown(true)
    
    // If the input is cleared, clear the filter
    if (value === '') {
      setFilters(prev => ({ ...prev, instrument: '' }))
    }
  }

  // Filter teachers based on search and filters using correct database structure
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = !searchTerm || 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesInstrument = !filters.instrument || teacher.specialization.includes(filters.instrument)
    // Handle roles array properly
    const matchesRole = !filters.role || (teacher.roles && teacher.roles.includes(filters.role))
    
    return matchesSearch && matchesInstrument && matchesRole
  })

  // Calculate statistics using correct database structure
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(t => t.isActive).length
  const totalStudents = teachers.reduce((sum, t) => sum + t.studentCount, 0)
  const avgStudentsPerTeacher = totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0
  
  // Additional statistics from enhanced data
  const teachersWithAvailability = teachers.filter(t => t.hasTimeBlocks).length
  const totalTeachingHours = teachers.reduce((sum, t) => sum + t.totalTeachingHours, 0)
  const teachersWithOrchestras = teachers.filter(t => t.orchestraCount > 0).length

  // Table columns definition
  const columns = [
    { key: 'name', header: 'שם המורה' },
    { key: 'specialization', header: 'התמחות' },
    { key: 'rolesDisplay', header: 'תפקידים' },
    { key: 'studentCount', header: 'מס\' תלמידים', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    { key: 'actions', header: 'פעולות', align: 'center' as const, width: '100px' },
  ]

  // Schedule display component
  const renderSchedule = () => {
    if (!selectedTeacher || !scheduleData) return null

    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        style={{
          position: 'fixed !important',
          top: '0 !important',
          left: '0 !important',
          right: '0 !important',
          bottom: '0 !important',
          display: 'flex !important',
          alignItems: 'center !important',
          justifyContent: 'center !important',
          zIndex: 9999
        }}
      >
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                לוח זמנים - {selectedTeacher.name}
              </h2>
              <button 
                onClick={handleCloseSchedule}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
                <span className="mr-3 text-gray-600">טוען לוח זמנים...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hebrewDays.map(day => (
                  <Card key={day} padding="md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      {day}
                    </h3>
                    <div className="space-y-3">
                      {scheduleData[day] && scheduleData[day].length > 0 ? (
                        scheduleData[day].map((lesson, index) => (
                          <div key={lesson.lessonId || index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {lesson.time}-{lesson.endTime}
                            </div>
                            <div className="text-sm text-gray-700">
                              {lesson.studentName} | {lesson.instrument} | שלב {lesson.currentStage}
                            </div>
                            {lesson.location && (
                              <div className="text-xs text-gray-500 mt-1">
                                מיקום: {lesson.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-6">
                          אין שיעורים ביום {day}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-lg text-gray-600">טוען מורים...</div>
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
          onClick={loadTeachers}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  return (
    <div>
      {renderSchedule()}
      {/* Search and Filters Container */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מורים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            {/* Instrument Filter - Searchable */}
            <div className="relative">
              <input
                type="text"
                placeholder="חפש כלי נגינה..."
                value={instrumentSearchTerm}
                onChange={(e) => handleInstrumentSearchChange(e.target.value)}
                onFocus={() => setShowInstrumentDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow click events
                  setTimeout(() => setShowInstrumentDropdown(false), 200)
                }}
                className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
              />
              
              {/* Clear button */}
              {instrumentSearchTerm && (
                <button
                  onClick={() => {
                    setInstrumentSearchTerm('')
                    setFilters(prev => ({ ...prev, instrument: '' }))
                    setShowInstrumentDropdown(false)
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Dropdown */}
              {showInstrumentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 direction-rtl">
                  {/* "All instruments" option */}
                  <button
                    onClick={() => handleInstrumentSelect('', 'כל הכלים')}
                    className={`w-full text-right px-3 py-2 hover:bg-gray-50 border-b border-gray-100 direction-rtl ${
                      filters.instrument === '' ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    כל הכלים
                  </button>
                  
                  {/* Instrument options */}
                  {filteredInstruments.map(instrument => (
                    <button
                      key={instrument}
                      onClick={() => handleInstrumentSelect(instrument, instrument)}
                      className={`w-full text-right px-3 py-2 hover:bg-gray-50 direction-rtl ${
                        filters.instrument === instrument ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                  
                  {filteredInstruments.length === 0 && instrumentSearchTerm && (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      לא נמצאו כלים
                    </div>
                  )}
                </div>
              )}
            </div>
            <select 
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל התפקידים</option>
              <option value="מורה">מורה</option>
              <option value="מנצח">מנצח</option>
              <option value="מדריך הרכב">מדריך הרכב</option>
              <option value="מנהל">מנהל</option>
              <option value="מורה תאוריה">מורה תאוריה</option>
              <option value="מגמה">מגמה</option>
            </select>
            {/* Show Add Teacher button for admins */}
            {(() => {
              console.log('🎯 BUTTON RENDER - Checking admin status for button display...')
              const isAdmin = isUserAdmin(user)
              
              // TEMPORARY: Force show button for debugging (remove after fixing)
              const FORCE_SHOW_BUTTON = true // Set to false after debugging
              const showButton = isAdmin || FORCE_SHOW_BUTTON
              
              console.log('🎯 BUTTON RENDER - Result:', {
                isAdmin,
                forceShow: FORCE_SHOW_BUTTON,
                finalDecision: showButton ? 'SHOWING BUTTON' : 'HIDING BUTTON'
              })
              
              return showButton ? (
                <button 
                  onClick={handleAddTeacher}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isAdmin 
                      ? 'bg-primary-500 text-white hover:bg-primary-600' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  title={isAdmin ? 'Add Teacher' : 'DEBUG MODE - Not really admin'}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {isAdmin ? 'הוסף מורה' : 'הוסף מורה (DEBUG)'}
                </button>
              ) : (
                <div style={{display: 'none'}}>
                  {/* Debug: Button hidden - user is not admin */}
                  {console.log('🚫 BUTTON HIDDEN - User does not have admin privileges')}
                </div>
              )
            })()}
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{totalTeachers}</div>
            <div className="text-xs text-gray-600">סה״כ מורים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600 mb-1">{activeTeachers}</div>
            <div className="text-xs text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{totalStudents}</div>
            <div className="text-xs text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{avgStudentsPerTeacher}</div>
            <div className="text-xs text-gray-600">ממוצע תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">{teachersWithAvailability}</div>
            <div className="text-xs text-gray-600">עם זמינות</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600 mb-1">{Math.round(totalTeachingHours)}</div>
            <div className="text-xs text-gray-600">שעות זמינות</div>
          </div>
        </Card>
      </div>

      {/* Results Info and View Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {searchTerm || filters.instrument || filters.role ? (
            <span>מציג {filteredTeachers.length} מתוך {totalTeachers} מורים</span>
          ) : (
            <span>סה"כ {totalTeachers} מורים</span>
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

      {/* Teachers Display */}
      {viewMode === 'table' ? (
        <Table 
          columns={columns} 
          data={filteredTeachers}
          onRowClick={(row) => {
            console.log('=== ROW CLICKED ===')
            console.log('Row data:', row)
            console.log('Teacher ID from row:', row.id)
            handleViewTeacher(row.id)
          }}
          rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredTeachers.map((teacher) => {
            // Transform teacher data to match TeacherCard interface
            const teacherForCard = {
              _id: teacher.id,
              personalInfo: {
                fullName: teacher.name,
                phone: teacher.phone,
                email: teacher.email
              },
              roles: teacher.roles || [],
              professionalInfo: {
                instrument: teacher.specialization,
                isActive: teacher.isActive // Use the computed isActive from API
              },
              teaching: {
                studentIds: Array(teacher.studentCount).fill(''), // Mock array for student count
                schedule: [] // Will be populated if needed
              },
              isActive: teacher.isActive
            }
            
            return (
              <TeacherCard
                key={teacher.id}
                teacher={teacherForCard}
                showStudentCount={true}
                showSchedule={false}
                showContact={false}
                onClick={() => handleViewTeacher(teacher.id)}
                className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
              />
            )
          })}
        </div>
      )}
      
      {/* DEBUG INFO PANEL - Remove after fixing */}
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">🐛 Debug Info (Remove after fixing)</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div><strong>User Object:</strong> {user ? '✅ Exists' : '❌ Missing'}</div>
            <div><strong>User ID:</strong> {user?._id || 'N/A'}</div>
            <div><strong>Roles Array:</strong> {JSON.stringify(user?.roles) || 'N/A'}</div>
            <div><strong>Single Role:</strong> {user?.role || 'N/A'}</div>
            <div><strong>Is Admin:</strong> {isUserAdmin(user) ? '✅ YES' : '❌ NO'}</div>
            <div><strong>Button Forced:</strong> ✅ YES (TEMPORARY)</div>
          </div>
        </div>
      </Card>

      {filteredTeachers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          לא נמצאו מורים התואמים לחיפוש
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={showAddTeacherModal}
        onClose={() => setShowAddTeacherModal(false)}
        onTeacherAdded={handleTeacherAdded}
      />
    </div>
  )
}
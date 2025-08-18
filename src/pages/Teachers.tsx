import { useState, useEffect } from 'react'
import { Search, Plus, Filter, Loader, Calendar, Users } from 'lucide-react'
import Card from '../components/ui/Card'
import apiService from '../services/apiService'

export default function Teachers() {
  const [teachers, setTeachers] = useState([])
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

  // Fetch teachers from real API
  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const teachersData = await apiService.teachers.getTeachers()
      
      // Transform API data using EXACT field names
      const transformedTeachers = teachersData.map(teacher => ({
        id: teacher._id,
        // Use exact field name: personalInfo.fullName
        name: teacher.personalInfo?.fullName || 'לא צוין',
        // Use exact field name: professionalInfo.instrument
        specialization: teacher.professionalInfo?.instrument || 'לא צוין',
        // Get roles from roles array
        roles: teacher.roles || [],
        // Use exact field name: teaching.studentIds
        studentCount: teacher.teaching?.studentIds?.length || 0,
        email: teacher.personalInfo?.email || '',
        phone: teacher.personalInfo?.phone || '',
        isActive: teacher.isActive,
        rawData: teacher // Keep original data
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

  const handleEditTeacher = (teacherId) => {
    console.log('Edit teacher:', teacherId)
    // Navigate to teacher edit page
  }

  const handleAddTeacher = () => {
    console.log('Add new teacher')
    // Navigate to add teacher page
  }

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = !searchTerm || 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesInstrument = !filters.instrument || teacher.specialization.includes(filters.instrument)
    const matchesRole = !filters.role || teacher.roles.includes(filters.role)
    
    return matchesSearch && matchesInstrument && matchesRole
  })

  // Calculate statistics
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(t => t.isActive).length
  const totalStudents = teachers.reduce((sum, t) => sum + t.studentCount, 0)
  const avgStudentsPerTeacher = totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0

  // Schedule display component
  const renderSchedule = () => {
    if (!selectedTeacher || !scheduleData) return null

    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            <select 
              value={filters.instrument}
              onChange={(e) => setFilters(prev => ({ ...prev, instrument: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            >
              <option value="">כל ההתמחויות</option>
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
            <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
              <Filter className="w-4 h-4 ml-1" />
              מסננים
            </button>
            <button 
              onClick={handleAddTeacher}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף מורה
            </button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-1">{totalTeachers}</div>
            <div className="text-sm text-gray-600">סה״כ מורים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">{activeTeachers}</div>
            <div className="text-sm text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{totalStudents}</div>
            <div className="text-sm text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{avgStudentsPerTeacher}</div>
            <div className="text-sm text-gray-600">ממוצע תלמידים למורה</div>
          </div>
        </Card>
      </div>

      {/* Results Info */}
      {searchTerm || filters.instrument || filters.role ? (
        <div className="mb-4 text-sm text-gray-600">
          מציג {filteredTeachers.length} מתוך {totalTeachers} מורים
        </div>
      ) : null}

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="mr-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 ml-1" />
                  {teacher.studentCount} תלמידים
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${teacher.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{teacher.specialization}</p>
              <div className="flex flex-wrap gap-1">
                {teacher.roles.map((role, index) => (
                  <span 
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleViewSchedule(teacher.id)}
                className="flex-1 bg-primary-50 text-primary-600 px-3 py-2 rounded text-sm hover:bg-primary-100 flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 ml-1" />
                צפה בלו״ז
              </button>
              <button 
                onClick={() => handleEditTeacher(teacher.id)}
                className="flex-1 bg-secondary-50 text-secondary-600 px-3 py-2 rounded text-sm hover:bg-secondary-100"
              >
                ערוך פרופיל
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          לא נמצאו מורים התואמים לחיפוש
        </div>
      )}
    </div>
  )
}
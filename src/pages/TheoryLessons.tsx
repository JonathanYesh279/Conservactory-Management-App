import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Calendar, Clock, Users, BookOpen, Trash2, AlertTriangle, Settings } from 'lucide-react'
import { Card } from '../components/ui/card'
import StatsCard from '../components/ui/StatsCard'
import TheoryLessonForm from '../components/TheoryLessonForm'
import TheoryLessonCard from '../components/TheoryLessonCard'
import BulkTheoryUpdateTab from '../components/BulkTheoryUpdateTab'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import Modal from '../components/ui/Modal'
import { theoryService } from '../services/apiService'
import { 
  filterLessons, 
  type TheoryLesson 
} from '../utils/theoryLessonUtils'

// Custom CSS for scrollbar styling
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

export default function TheoryLessons() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<TheoryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TheoryLesson | null>(null)
  const [editingLessons, setEditingLessons] = useState<TheoryLesson[]>([])
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'bulk-edit'>('create')
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'lessons' | 'bulk'>('lessons')
  
  // Bulk selection state
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    teacherId: '',
    date: ''
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<any>(null)

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleteType, setBulkDeleteType] = useState<'date' | 'category' | 'teacher'>('date')
  const [bulkDeleteData, setBulkDeleteData] = useState({
    startDate: '',
    endDate: '',
    category: '',
    teacherId: ''
  })

  // Load theory lessons on component mount
  useEffect(() => {
    loadTheoryLessons()
  }, [])

  const loadTheoryLessons = async () => {
    try {
      setLoading(true)
      setError(null)
      const lessonsData = await theoryService.getTheoryLessons(filters)
      setLessons(lessonsData)
    } catch (error) {
      console.error('Error loading theory lessons:', error)
      setError('שגיאה בטעינת שיעורי התיאוריה')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format day header
  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lessonDate = new Date(date)
    lessonDate.setHours(0, 0, 0, 0)
    
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
    
    const dayName = dayNames[date.getDay()]
    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    
    let prefix = ''
    if (lessonDate.getTime() === today.getTime()) {
      prefix = 'היום - '
    } else if (lessonDate.getTime() === today.getTime() + 86400000) {
      prefix = 'מחר - '
    }
    
    return {
      prefix,
      main: `יום ${dayName}, ${day} ב${month} ${year}`,
      isToday: lessonDate.getTime() === today.getTime(),
      isPast: lessonDate < today
    }
  }

  // Group lessons by individual dates
  const groupedLessonsByDay = useMemo(() => {
    // First filter the lessons
    const filtered = filterLessons(lessons, {
      searchQuery,
      category: filters.category,
      teacherId: filters.teacherId,
      date: filters.date
    })

    // Group by date
    const lessonsByDate = new Map<string, TheoryLesson[]>()
    
    filtered.forEach(lesson => {
      const dateKey = lesson.date // Assuming date is in YYYY-MM-DD format
      if (!lessonsByDate.has(dateKey)) {
        lessonsByDate.set(dateKey, [])
      }
      lessonsByDate.get(dateKey)!.push(lesson)
    })

    // Sort lessons within each day by time
    const sortByTime = (a: TheoryLesson, b: TheoryLesson) => {
      const timeA = a.startTime || '00:00'
      const timeB = b.startTime || '00:00'
      return timeA.localeCompare(timeB)
    }

    lessonsByDate.forEach((dayLessons) => {
      dayLessons.sort(sortByTime)
    })

    // Convert to array and sort by date
    const sortedDates = Array.from(lessonsByDate.entries()).sort((a, b) => {
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    })

    // Get today's date for categorization
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Categorize dates
    const todayLessons: Array<[string, TheoryLesson[]]> = []
    const futureLessons: Array<[string, TheoryLesson[]]> = []
    const pastLessons: Array<[string, TheoryLesson[]]> = []

    sortedDates.forEach(([date, lessons]) => {
      const lessonDate = new Date(date)
      lessonDate.setHours(0, 0, 0, 0)
      
      if (lessonDate.getTime() === today.getTime()) {
        todayLessons.push([date, lessons])
      } else if (lessonDate > today) {
        futureLessons.push([date, lessons])
      } else {
        pastLessons.push([date, lessons])
      }
    })

    // Reverse past lessons so most recent is first
    pastLessons.reverse()

    return {
      today: todayLessons,
      future: futureLessons,
      past: pastLessons,
      all: [...todayLessons, ...futureLessons, ...pastLessons],
      flatList: sortedDates.flatMap(([, lessons]) => lessons)
    }
  }, [lessons, searchQuery, filters])

  // Use the flat list for table view
  const filteredAndSortedLessons = groupedLessonsByDay.flatList

  // Calculate statistics
  const stats = {
    totalLessons: lessons.length,
    activeLessons: lessons.filter(l => l.isActive).length,
    totalStudents: lessons.reduce((sum, l) => sum + (l.studentIds?.length || 0), 0),
    averageAttendance: lessons.length > 0 
      ? Math.round(lessons.reduce((sum, l) => {
          const attendees = l.attendanceList?.filter(a => a.status === 'הגיע/ה').length || 0
          return sum + (attendees / (l.maxStudents || 1))
        }, 0) * 100 / lessons.length)
      : 0
  }

  const handleCreateLesson = () => {
    setEditingLesson(null)
    setEditingLessons([])
    setFormMode('create')
    setShowForm(true)
  }

  const handleViewLesson = (lesson: TheoryLesson) => {
    navigate(`/theory-lessons/${lesson._id}`)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setEditingLessons([])
    setFormMode('edit')
    setShowForm(true)
  }

  const handleFormSubmit = async (lessonData) => {
    try {
      if (lessonData.mode === 'edit') {
        const { mode, lessonId, ...updateData } = lessonData
        await theoryService.updateTheoryLesson(lessonId, updateData)
      } else if (lessonData.mode === 'bulk-edit') {
        const { mode, lessonIds, updateData } = lessonData
        await theoryService.bulkUpdateTheoryLessons(lessonIds, updateData)
      } else if (lessonData.mode === 'bulk-create' || lessonData.isBulk) {
        // Handle bulk creation
        const { isBulk, mode, ...bulkData } = lessonData
        await theoryService.bulkCreateTheoryLessons(bulkData)
      } else {
        const { mode, ...createData } = lessonData
        await theoryService.createTheoryLesson(createData)
      }
      setShowForm(false)
      setEditingLesson(null)
      setEditingLessons([])
      setFormMode('create')
      setSelectedLessons(new Set())
      await loadTheoryLessons()
    } catch (error) {
      console.error('Error saving theory lesson:', error)
      throw error
    }
  }

  const handleDeleteLesson = (lesson: any) => {
    setLessonToDelete(lesson)
    setShowDeleteModal(true)
  }

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return

    try {
      await theoryService.deleteTheoryLesson(lessonToDelete._id)
      await loadTheoryLessons()
      setShowDeleteModal(false)
      setLessonToDelete(null)
    } catch (error) {
      console.error('Error deleting theory lesson:', error)
      setError('שגיאה במחיקת שיעור התיאוריה')
    }
  }

  // Bulk delete handlers
  const handleBulkDelete = async () => {
    try {
      let result
      switch (bulkDeleteType) {
        case 'date':
          if (!bulkDeleteData.startDate || !bulkDeleteData.endDate) {
            setError('נדרש לבחור תאריכי התחלה וסיום')
            return
          }
          result = await theoryService.deleteTheoryLessonsByDateRange(
            bulkDeleteData.startDate,
            bulkDeleteData.endDate
          )
          break
        case 'category':
          if (!bulkDeleteData.category) {
            setError('נדרש לבחור קטגוריה')
            return
          }
          result = await theoryService.deleteTheoryLessonsByCategory(bulkDeleteData.category)
          break
        case 'teacher':
          if (!bulkDeleteData.teacherId) {
            setError('נדרש לבחור מורה')
            return
          }
          result = await theoryService.deleteTheoryLessonsByTeacher(bulkDeleteData.teacherId)
          break
        default:
          setError('סוג מחיקה לא תקין')
          return
      }

      await loadTheoryLessons()
      setShowBulkDeleteModal(false)
      setBulkDeleteData({ startDate: '', endDate: '', category: '', teacherId: '' })
      setError(null)
      console.log(`✅ נמחקו ${result.deletedCount} שיעורי תיאוריה בהצלחה`)
    } catch (error: any) {
      setError(error.message || 'שגיאה במחיקת שיעורי התיאוריה')
      setShowBulkDeleteModal(false)
    }
  }

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false)
    setBulkDeleteData({ startDate: '', endDate: '', category: '', teacherId: '' })
  }

  // Bulk selection handlers
  const handleSelectLesson = (lessonId: string) => {
    const newSelected = new Set(selectedLessons)
    if (newSelected.has(lessonId)) {
      newSelected.delete(lessonId)
    } else {
      newSelected.add(lessonId)
    }
    setSelectedLessons(newSelected)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLessons(new Set())
    } else {
      setSelectedLessons(new Set(filteredAndSortedLessons.map(lesson => lesson._id)))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkEdit = () => {
    const lessonsToEdit = lessons.filter(lesson => selectedLessons.has(lesson._id))
    if (lessonsToEdit.length === 0) {
      setError('אנא בחר שיעורים לעריכה')
      return
    }
    
    setEditingLessons(lessonsToEdit)
    setEditingLesson(null)
    setFormMode('bulk-edit')
    setShowForm(true)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען שיעורי תיאוריה...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">שיעורי תיאוריה</h1>
          <p className="text-gray-600 mt-1">ניהול שיעורי תיאוריה ומעקב נוכחות</p>
          
          {/* Tab Navigation */}
          <div className="flex space-x-4 rtl:space-x-reverse mt-4">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'lessons'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 ml-2" />
              רשימת שיעורים
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4 ml-2" />
              עדכון שיעורים קבוצתי
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'lessons' && (
            <>
              {selectedLessons.size > 0 && (
                <>
                  <button
                    onClick={handleBulkEdit}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title={`עריכה קבוצתית של ${selectedLessons.size} שיעורים`}
                  >
                    <Users className="w-4 h-4 ml-1" />
                    עריכה קבוצתית ({selectedLessons.size})
                  </button>
                  <button
                    onClick={() => setSelectedLessons(new Set())}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="בטל בחירה"
                  >
                    ביטול בחירה
                  </button>
                </>
              )}
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="מחיקה קבוצתית של שיעורי תיאוריה"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                מחיקת שיעורים
              </button>
              <button
                onClick={handleCreateLesson}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 ml-2" />
                שיעור חדש
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'lessons' ? (
        <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="סה״כ שיעורים"
          value={stats.totalLessons.toString()}
          subtitle="שיעורי תיאוריה"
          icon={<BookOpen />}
          color="blue"
        />
        <StatsCard
          title="שיעורים פעילים"
          value={stats.activeLessons.toString()}
          subtitle="שיעורים פעילים"
          icon={<Calendar />}
          color="green"
        />
        <StatsCard
          title="סה״כ תלמידים"
          value={stats.totalStudents.toString()}
          subtitle="נרשמים לשיעורים"
          icon={<Users />}
          color="purple"
        />
        <StatsCard
          title="נוכחות ממוצעת"
          value={`${stats.averageAttendance}%`}
          subtitle="אחוז נוכחות"
          icon={<Clock />}
          color="orange"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש שיעורים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">כל הקטגוריות</option>
              <option value="תיאוריה כללית">תיאוריה כללית</option>
              <option value="הרמוניה">הרמוניה</option>
              <option value="קומפוזיציה">קומפוזיציה</option>
              <option value="היסטוריה של המוזיקה">היסטוריה של המוזיקה</option>
              <option value="אימון אוזן">אימון אוזן</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="md:w-48">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({ category: '', teacherId: '', date: '' })
              setSearchQuery('')
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Theory Lessons Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              שיעורי תיאוריה ({filteredAndSortedLessons.length})
            </h3>
            {filteredAndSortedLessons.length > 0 && (
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="ml-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                בחר הכל ({selectedLessons.size} נבחרו)
              </label>
            )}
          </div>
          <button
            onClick={loadTheoryLessons}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            רענן
          </button>
        </div>

        {filteredAndSortedLessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין שיעורי תיאוריה</h3>
            <p className="text-gray-600 mb-4">התחל על ידי יצירת שיעור התיאוריה הראשון</p>
            <button
              onClick={handleCreateLesson}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 ml-2" />
              צור שיעור ראשון
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Lessons Section */}
            {groupedLessonsByDay.today.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-primary-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">להיום</h2>
                </div>
                {groupedLessonsByDay.today.map(([date, dayLessons]) => {
                  const dayInfo = formatDayHeader(date)
                  return (
                    <div key={date} className="bg-primary-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-primary-900">
                          {dayInfo.main}
                        </h3>
                        <span className="text-sm text-primary-700 font-medium">
                          {dayLessons.length} שיעורים
                          {dayLessons.length > 1 && (
                            <span className="mr-2 text-xs text-primary-600">← גלל</span>
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                          <div className="flex gap-4 px-1" style={{ minWidth: 'max-content' }}>
                            {dayLessons.map(lesson => (
                              <div key={lesson._id} className="w-80 flex-shrink-0">
                                <TheoryLessonCard
                                  lesson={lesson}
                                  onView={handleViewLesson}
                                  onEdit={handleEditLesson}
                                  onDelete={handleDeleteLesson}
                                  selectable={true}
                                  selected={selectedLessons.has(lesson._id)}
                                  onSelect={handleSelectLesson}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Future Lessons Section */}
            {groupedLessonsByDay.future.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-blue-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">שיעורים עתידיים</h2>
                </div>
                {groupedLessonsByDay.future.map(([date, dayLessons]) => {
                  const dayInfo = formatDayHeader(date)
                  return (
                    <div key={date} className="bg-blue-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-blue-900">
                          <span className="text-blue-700">{dayInfo.prefix}</span>
                          {dayInfo.main}
                        </h3>
                        <span className="text-sm text-blue-700 font-medium">
                          {dayLessons.length} שיעורים
                          {dayLessons.length > 1 && (
                            <span className="mr-2 text-xs text-blue-600">← גלל</span>
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                          <div className="flex gap-4 px-1" style={{ minWidth: 'max-content' }}>
                            {dayLessons.map(lesson => (
                              <div key={lesson._id} className="w-80 flex-shrink-0">
                                <TheoryLessonCard
                                  lesson={lesson}
                                  onView={handleViewLesson}
                                  onEdit={handleEditLesson}
                                  onDelete={handleDeleteLesson}
                                  selectable={true}
                                  selected={selectedLessons.has(lesson._id)}
                                  onSelect={handleSelectLesson}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Past Lessons Section */}
            {groupedLessonsByDay.past.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-gray-400 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">שיעורים שהסתיימו</h2>
                </div>
                {groupedLessonsByDay.past.map(([date, dayLessons]) => {
                  const dayInfo = formatDayHeader(date)
                  return (
                    <div key={date} className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-700">
                          {dayInfo.main}
                        </h3>
                        <span className="text-sm text-gray-600 font-medium">
                          {dayLessons.length} שיעורים
                          {dayLessons.length > 1 && (
                            <span className="mr-2 text-xs text-gray-500">← גלל</span>
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                          <div className="flex gap-4 px-1" style={{ minWidth: 'max-content' }}>
                            {dayLessons.map(lesson => (
                              <div key={lesson._id} className="w-80 flex-shrink-0">
                                <TheoryLessonCard
                                  lesson={lesson}
                                  onView={handleViewLesson}
                                  onEdit={handleEditLesson}
                                  onDelete={handleDeleteLesson}
                                  selectable={true}
                                  selected={selectedLessons.has(lesson._id)}
                                  onSelect={handleSelectLesson}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>
      
      </>
      ) : (
        /* Bulk Update Tab */
        <BulkTheoryUpdateTab
          lessons={lessons}
          onRefresh={loadTheoryLessons}
          searchQuery={searchQuery}
          filters={filters}
        />
      )}

      {/* Theory Lesson Form Modal */}
      {showForm && (
        <TheoryLessonForm
          theoryLesson={editingLesson}
          theoryLessons={editingLessons}
          mode={formMode}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingLesson(null)
            setEditingLessons([])
            setFormMode('create')
            setSelectedLessons(new Set())
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת שיעור תיאוריה"
        message={
          lessonToDelete
            ? `האם אתה בטוח שברצונך למחוק את שיעור התיאוריה "${lessonToDelete.title}"?\n\nפרטי השיעור:\n• תאריך: ${new Date(lessonToDelete.date).toLocaleDateString('he-IL')}\n• משך: ${lessonToDelete.duration} דקות\n• תלמידים רשומים: ${lessonToDelete.registeredStudents?.length || 0}\n\nפעולה זו לא ניתנת לביטול.`
            : 'האם אתה בטוח שברצונך למחוק את שיעור התיאוריה?'
        }
        confirmText="מחק שיעור"
        cancelText="ביטול"
        onConfirm={confirmDeleteLesson}
        onCancel={() => {
          setShowDeleteModal(false)
          setLessonToDelete(null)
        }}
        variant="danger"
      />

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        title="מחיקה קבוצתית של שיעורי תיאוריה"
        maxWidth="lg"
      >
        <div className="p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 ml-2" />
              <p className="text-yellow-800">
                ⚠️ פעולה זו תמחק שיעורי תיאוריה על בסיס הקריטריונים שנבחרו. 
                פעולה זו אינה ניתנת לביטול!
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Bulk Delete Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג מחיקה
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="date"
                    checked={bulkDeleteType === 'date'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'date')}
                    className="ml-2"
                  />
                  טווח תאריכים
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="category"
                    checked={bulkDeleteType === 'category'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'category')}
                    className="ml-2"
                  />
                  לפי קטגוריה
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="teacher"
                    checked={bulkDeleteType === 'teacher'}
                    onChange={(e) => setBulkDeleteType(e.target.value as 'teacher')}
                    className="ml-2"
                  />
                  לפי מורה
                </label>
              </div>
            </div>

            {/* Date Range */}
            {bulkDeleteType === 'date' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך התחלה
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteData.startDate}
                    onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תאריך סיום
                  </label>
                  <input
                    type="date"
                    value={bulkDeleteData.endDate}
                    onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Category Selection */}
            {bulkDeleteType === 'category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה
                </label>
                <select
                  value={bulkDeleteData.category}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  <option value="תלמידים חדשים ב-ד">תלמידים חדשים ב-ד</option>
                  <option value="מתחילים">מתחילים</option>
                  <option value="מתחילים ב">מתחילים ב</option>
                  <option value="מתחילים ד">מתחילים ד</option>
                  <option value="מתקדמים ב">מתקדמים ב</option>
                  <option value="מתקדמים א">מתקדמים א</option>
                  <option value="מתקדמים ג">מתקדמים ג</option>
                  <option value="תלמידים חדשים בוגרים (ה - ט)">תלמידים חדשים בוגרים (ה - ט)</option>
                  <option value="תלמידים חדשים צעירים">תלמידים חדשים צעירים</option>
                  <option value="הכנה לרסיטל קלאסי יא">הכנה לרסיטל קלאסי יא</option>
                  <option value="הכנה לרסיטל רוק\פופ\ג'אז יא">הכנה לרסיטל רוק\פופ\ג'אז יא</option>
                  <option value="הכנה לרסיטל רוק\פופ\ג'אז יב">הכנה לרסיטל רוק\פופ\ג'אז יב</option>
                  <option value="מגמה">מגמה</option>
                  <option value="תאוריה כלי">תאוריה כלי</option>
                </select>
              </div>
            )}

            {/* Teacher Selection */}
            {bulkDeleteType === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מורה
                </label>
                <input
                  type="text"
                  placeholder="הזן מזהה מורה או שם"
                  value={bulkDeleteData.teacherId}
                  onChange={(e) => setBulkDeleteData({ ...bulkDeleteData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  ניתן להזין מזהה מורה או לחפש לפי שם
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={cancelBulkDelete}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={
                (bulkDeleteType === 'date' && (!bulkDeleteData.startDate || !bulkDeleteData.endDate)) ||
                (bulkDeleteType === 'category' && !bulkDeleteData.category) ||
                (bulkDeleteType === 'teacher' && !bulkDeleteData.teacherId)
              }
            >
              <Trash2 className="w-4 h-4 ml-2 inline" />
              מחק שיעורי תיאוריה
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}
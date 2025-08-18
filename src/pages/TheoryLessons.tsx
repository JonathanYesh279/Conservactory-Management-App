import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, Clock, Users, BookOpen, Grid, List } from 'lucide-react'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import TheoryLessonForm from '../components/TheoryLessonForm'
import TheoryLessonCard from '../components/TheoryLessonCard'
import { theoryService } from '../services/apiService'
import { 
  filterLessons, 
  sortLessons, 
  formatLessonDate, 
  formatLessonTime, 
  formatLessonAttendance,
  calculateAttendancePercentage,
  type TheoryLesson 
} from '../utils/theoryLessonUtils'

export default function TheoryLessons() {
  const [lessons, setLessons] = useState<TheoryLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TheoryLesson | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'teacher' | 'attendance' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState({
    category: '',
    teacherId: '',
    date: ''
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

  // Filter and sort lessons using utility functions
  const filteredAndSortedLessons = sortLessons(
    filterLessons(lessons, {
      searchQuery,
      category: filters.category,
      teacherId: filters.teacherId,
      date: filters.date
    }),
    sortBy,
    sortOrder
  )

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
    setShowForm(true)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setShowForm(true)
  }

  const handleFormSubmit = async (lessonData) => {
    try {
      if (editingLesson) {
        await theoryService.updateTheoryLesson(editingLesson._id, lessonData)
      } else {
        await theoryService.createTheoryLesson(lessonData)
      }
      setShowForm(false)
      setEditingLesson(null)
      await loadTheoryLessons()
    } catch (error) {
      console.error('Error saving theory lesson:', error)
      throw error
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את שיעור התיאוריה?')) {
      try {
        await theoryService.deleteTheoryLesson(lessonId)
        await loadTheoryLessons()
      } catch (error) {
        console.error('Error deleting theory lesson:', error)
        setError('שגיאה במחיקת שיעור התיאוריה')
      }
    }
  }

  // Table columns configuration
  const columns = [
    {
      key: 'title',
      label: 'כותרת השיעור',
      render: (lesson) => (
        <div>
          <div className="font-medium text-gray-900">{lesson.title}</div>
          <div className="text-sm text-gray-500">{lesson.category}</div>
        </div>
      )
    },
    {
      key: 'teacher',
      label: 'מורה',
      render: (lesson) => lesson.teacherName || 'לא הוקצה'
    },
    {
      key: 'schedule',
      label: 'מועד',
      render: (lesson: TheoryLesson) => (
        <div>
          <div className="text-sm font-medium">
            {formatLessonDate(lesson)}
          </div>
          <div className="text-xs text-gray-500">
            {formatLessonTime(lesson)}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'מיקום',
      render: (lesson) => lesson.location || 'לא צוין'
    },
    {
      key: 'attendance',
      label: 'נוכחות',
      render: (lesson: TheoryLesson) => {
        const attendanceText = formatLessonAttendance(lesson)
        const percentage = calculateAttendancePercentage(lesson)
        
        return (
          <div className="flex items-center">
            <span className="text-sm font-medium">{attendanceText}</span>
            <span className="mr-2 text-xs text-gray-500">({percentage}%)</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'סטטוס',
      render: (lesson) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          lesson.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {lesson.isActive ? 'פעיל' : 'לא פעיל'}
        </span>
      )
    }
  ]

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">שיעורי תיאוריה</h1>
          <p className="text-gray-600 mt-1">ניהול שיעורי תיאוריה ומעקב נוכחות</p>
        </div>
        <button
          onClick={handleCreateLesson}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-2" />
          שיעור חדש
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

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
          <h3 className="text-lg font-semibold text-gray-900">
            שיעורי תיאוריה ({filteredAndSortedLessons.length})
          </h3>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="תצוגת כרטיסים"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="תצוגת טבלה"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date">מיון לפי תאריך</option>
              <option value="title">מיון לפי כותרת</option>
              <option value="teacher">מיון לפי מורה</option>
              <option value="category">מיון לפי קטגוריה</option>
              <option value="attendance">מיון לפי נוכחות</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              title={sortOrder === 'asc' ? 'מיון יורד' : 'מיון עולה'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            <button
              onClick={loadTheoryLessons}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              רענן
            </button>
          </div>
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
        ) : viewMode === 'table' ? (
          <Table
            data={filteredAndSortedLessons}
            columns={columns}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
            actions={true}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedLessons.map(lesson => (
              <TheoryLessonCard
                key={lesson._id}
                lesson={lesson}
                onEdit={handleEditLesson}
                onDelete={handleDeleteLesson}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Theory Lesson Form Modal */}
      {showForm && (
        <TheoryLessonForm
          lesson={editingLesson}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingLesson(null)
          }}
        />
      )}
    </div>
  )
}
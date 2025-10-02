import { useState, useEffect } from 'react'
import { Users, GraduationCap, Music, Calendar } from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import { Card } from '../components/ui/card'
import apiService from '../services/apiService'
import { useSchoolYear } from '../services/schoolYearContext'
import { useAuth } from '../services/authContext.jsx'
import ConductorDashboard from '../components/dashboard/ConductorDashboard'
import TeacherDashboard from '../components/dashboard/TeacherDashboard'
import TheoryTeacherDashboard from '../components/dashboard/TheoryTeacherDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const { currentSchoolYear } = useSchoolYear()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeStudents: 0,
    staffMembers: 0,
    activeOrchestras: 0,
    weeklyRehearsals: 0,
    studentsTrend: 0,
    staffTrend: 0,
    rehearsalsTrend: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [currentSchoolYear])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Prepare filters with school year if available
      const filters = currentSchoolYear ? { schoolYearId: currentSchoolYear._id } : {}
      
      // Load all data in parallel for better performance
      const [students, teachers, orchestras, rehearsals] = await Promise.all([
        apiService.students.getStudents(filters),
        apiService.teachers.getTeachers(filters),
        apiService.orchestras.getOrchestras(filters),
        apiService.rehearsals.getRehearsals(filters)
      ])

      // Calculate active students count
      const activeStudentsCount = students.filter(s => s.isActive !== false).length
      
      // Calculate active teachers count
      const activeTeachersCount = teachers.filter(t => t.isActive !== false).length
      
      // Calculate active orchestras count
      const activeOrchestrasCount = orchestras.filter(o => o.isActive !== false).length
      
      // Calculate weekly rehearsals (rehearsals in the next 7 days)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weeklyRehearsalsCount = rehearsals.filter(r => {
        const rehearsalDate = new Date(r.date)
        return rehearsalDate >= today && rehearsalDate <= nextWeek
      }).length

      // Calculate trends (mock for now, can be enhanced with historical data)
      const studentsTrend = Math.floor(Math.random() * 20) - 10 // Random between -10 and 10
      const staffTrend = Math.floor(Math.random() * 5) - 2 // Random between -2 and 3
      const rehearsalsTrend = Math.floor(Math.random() * 8) - 4 // Random between -4 and 4

      setStats({
        activeStudents: activeStudentsCount,
        staffMembers: activeTeachersCount,
        activeOrchestras: activeOrchestrasCount,
        weeklyRehearsals: weeklyRehearsalsCount,
        studentsTrend,
        staffTrend,
        rehearsalsTrend
      })

      // Generate recent activities from real data
      const activities = []
      
      // Add recently added students (last 5)
      const recentStudents = students
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 2)
      
      recentStudents.forEach(student => {
        activities.push({
          type: 'student',
          title: 'רישום תלמיד חדש',
          description: `${student.personalInfo?.fullName || 'תלמיד'} נרשם לקונסרבטוריון`,
          time: getRelativeTime(student.createdAt),
          color: 'primary'
        })
      })

      // Add upcoming rehearsals (next 3)
      const upcomingRehearsals = rehearsals
        .filter(r => new Date(r.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 2)
      
      upcomingRehearsals.forEach(rehearsal => {
        activities.push({
          type: 'rehearsal',
          title: 'חזרה נקבעה',
          description: `${rehearsal.orchestraId?.name || 'תזמורת'} - ${formatDate(rehearsal.date)} ${rehearsal.startTime || ''}`,
          time: getRelativeTime(rehearsal.createdAt),
          color: 'success'
        })
      })

      // Add teacher assignments
      if (teachers.length > 0) {
        const teachersWithStudents = teachers
          .filter(t => t.studentCount > 0)
          .slice(0, 1)
        
        teachersWithStudents.forEach(teacher => {
          activities.push({
            type: 'assignment',
            title: 'שיבוץ מורה',
            description: `${teacher.personalInfo?.fullName || 'מורה'} - ${teacher.studentCount} תלמידים`,
            time: 'השבוע',
            color: 'orange'
          })
        })
      }

      setRecentActivities(activities.slice(0, 5))

      // Generate upcoming events from rehearsals and mock data
      const events = []
      
      // Add upcoming rehearsals as events
      const nextRehearsals = rehearsals
        .filter(r => new Date(r.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 2)
      
      nextRehearsals.forEach(rehearsal => {
        events.push({
          title: rehearsal.orchestraId?.name || 'חזרת תזמורת',
          date: formatDate(rehearsal.date),
          description: `${rehearsal.type || 'חזרה'} - ${rehearsal.location || 'אולם ראשי'}`,
          isPrimary: rehearsal.type === 'concert'
        })
      })

      // Add mock events for demonstration
      events.push({
        title: 'קונצרט חורף',
        date: '15 בדצמבר',
        description: 'כל התזמורות מבצעות',
        isPrimary: true
      })

      if (events.length < 3) {
        events.push({
          title: 'אספת סגל',
          date: '8 בדצמבר',
          description: 'ישיבת תכנון חודשית',
          isPrimary: false
        })
      }

      setUpcomingEvents(events.slice(0, 3))

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format relative time
  const getRelativeTime = (date) => {
    if (!date) return 'לאחרונה'
    
    const now = new Date()
    const then = new Date(date)
    const diff = now - then
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `לפני ${minutes} דקות`
    if (hours < 24) return `לפני ${hours} שעות`
    if (days < 7) return `לפני ${days} ימים`
    return 'השבוע'
  }

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  // Helper function to determine user role
  const getUserRole = () => {
    if (!user) return 'admin'

    // Check for admin role first
    if (user.role === 'admin' ||
        user.roles?.includes('admin') ||
        user.role === 'מנהל' ||
        user.roles?.includes('מנהל')) {
      return 'admin'
    }

    // Check for theory teacher role (specifically has theory-related roles)
    if (user.role === 'theory-teacher' ||
        user.roles?.includes('theory-teacher') ||
        user.roles?.includes('theory_teacher') ||
        user.role === 'מורה תיאוריה' ||
        user.roles?.includes('מורה תיאוריה')) {
      return 'theory-teacher'
    }

    // Check for conductor role
    if (user.role === 'conductor' ||
        user.roles?.includes('conductor') ||
        user.role === 'מנצח' ||
        user.roles?.includes('מנצח') ||
        user.conducting?.orchestraIds?.length > 0) {
      return 'conductor'
    }

    // Check for teacher role - check Hebrew roles too!
    if (user.role === 'teacher' ||
        user.roles?.includes('teacher') ||
        user.role === 'מורה' ||
        user.roles?.includes('מורה') ||
        user.teaching?.studentIds?.length > 0) {
      return 'teacher'
    }

    // Default to admin
    return 'admin'
  }

  // Return role-specific dashboard
  const userRole = getUserRole()

  if (userRole === 'theory-teacher') {
    return <TheoryTeacherDashboard />
  }

  if (userRole === 'conductor') {
    return <ConductorDashboard />
  }

  if (userRole === 'teacher') {
    return <TeacherDashboard />
  }

  // Default admin dashboard
  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="תלמידים פעילים"
          value={loading ? "..." : stats.activeStudents.toString()}
          subtitle="תלמידים רשומים"
          icon={<Users />}
          color="blue"
          trend={stats.studentsTrend !== 0 ? {
            value: Math.abs(stats.studentsTrend),
            label: "מהחודש שעבר",
            direction: stats.studentsTrend > 0 ? "up" : "down"
          } : undefined}
        />
        
        <StatsCard
          title="חברי סגל"
          value={loading ? "..." : stats.staffMembers.toString()}
          subtitle="מורים ומדריכים"
          icon={<GraduationCap />}
          color="green"
          trend={stats.staffTrend !== 0 ? {
            value: Math.abs(stats.staffTrend),
            label: "מהרבעון שעבר",
            direction: stats.staffTrend > 0 ? "up" : "down"
          } : undefined}
        />
        
        <StatsCard
          title="הרכבים פעילים"
          value={loading ? "..." : stats.activeOrchestras.toString()}
          subtitle="תזמורות וקבוצות"
          icon={<Music />}
          color="purple"
        />
        
        <StatsCard
          title="חזרות השבוע"
          value={loading ? "..." : stats.weeklyRehearsals.toString()}
          subtitle="מפגשים מתוכננים"
          icon={<Calendar />}
          color="orange"
          trend={stats.rehearsalsTrend !== 0 ? {
            value: Math.abs(stats.rehearsalsTrend),
            label: "מהשבוע שעבר",
            direction: stats.rehearsalsTrend > 0 ? "up" : "down"
          } : undefined}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">פעילות אחרונה</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                צפה בהכל
              </button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">טוען...</div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full mt-2 ml-4`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">אין פעילות אחרונה</div>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">אירועים קרובים</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                יצירת אירוע
              </button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">טוען...</div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg ${event.isPrimary ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium ${event.isPrimary ? 'text-primary-900' : 'text-gray-900'}`}>
                        {event.title}
                      </p>
                      <span className={`text-xs ${event.isPrimary ? 'text-primary-600' : 'text-gray-500'}`}>
                        {event.date}
                      </span>
                    </div>
                    <p className={`text-sm ${event.isPrimary ? 'text-primary-700' : 'text-gray-600'}`}>
                      {event.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">אין אירועים קרובים</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">התקדמות חודשית</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">סטטיסטיקות החודש</p>
              {!loading && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">{stats.activeStudents}</p>
                    <p className="text-sm text-gray-600">תלמידים</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success-600">{stats.weeklyRehearsals}</p>
                    <p className="text-sm text-gray-600">חזרות</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">התפלגות תלמידים</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">התפלגות לפי הרכבים</p>
              {!loading && (
                <div className="mt-4">
                  <p className="text-3xl font-bold text-purple-600">{stats.activeOrchestras}</p>
                  <p className="text-sm text-gray-600">הרכבים פעילים</p>
                  <p className="text-lg mt-2 text-gray-700">
                    ממוצע: {stats.activeOrchestras > 0 ? Math.floor(stats.activeStudents / stats.activeOrchestras) : 0} תלמידים להרכב
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
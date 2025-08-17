import { Users, GraduationCap, Music, Calendar } from 'lucide-react'
import StatsCard from '../components/ui/StatsCard'
import Card from '../components/ui/Card'

export default function Dashboard() {
  return (
    <div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="תלמידים פעילים"
          value="150"
          subtitle="תלמידים רשומים"
          icon={<Users />}
          color="blue"
          trend={{ value: 12, label: "מהחודש שעבר", direction: "up" }}
        />
        
        <StatsCard
          title="חברי סגל"
          value="25"
          subtitle="מורים ומדריכים"
          icon={<GraduationCap />}
          color="green"
          trend={{ value: 2, label: "מהרבעון שעבר", direction: "up" }}
        />
        
        <StatsCard
          title="הרכבים פעילים"
          value="8"
          subtitle="תזמורות וקבוצות"
          icon={<Music />}
          color="purple"
        />
        
        <StatsCard
          title="חזרות השבוע"
          value="12"
          subtitle="מפגשים מתוכננים"
          icon={<Calendar />}
          color="orange"
          trend={{ value: 3, label: "מהשבוע שעבר", direction: "up" }}
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
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 ml-4"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">רישום תלמיד חדש</p>
                    <span className="text-xs text-gray-500">לפני שעתיים</span>
                  </div>
                  <p className="text-sm text-gray-600">שרה יונסון הצטרפה לתזמורת הקאמרית</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 ml-4"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">חזרה נקבעה</p>
                    <span className="text-xs text-gray-500">לפני 4 שעות</span>
                  </div>
                  <p className="text-sm text-gray-600">תזמורת סימפונית - יום שישי 19:00</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 ml-4"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">עדכון התקדמות בגרות</p>
                    <span className="text-xs text-gray-500">לפני יום</span>
                  </div>
                  <p className="text-sm text-gray-600">3 תלמידים השלימו דרישות תיאוריה</p>
                </div>
              </div>
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
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-primary-900">קונצרט חורף</p>
                  <span className="text-xs text-primary-600">15 בדצמבר</span>
                </div>
                <p className="text-sm text-primary-700">כל התזמורות מבצעות</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">אספת סגל</p>
                  <span className="text-xs text-gray-500">8 בדצמבר</span>
                </div>
                <p className="text-sm text-gray-600">ישיבת תכנון חודשית</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">בחינות בגרות</p>
                  <span className="text-xs text-gray-500">20 בדצמבר</span>
                </div>
                <p className="text-sm text-gray-600">הערכות תיאוריה ומעשיות</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">התקדמות חודשית</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">תרשים התקדמות יתווסף בקרוב</p>
          </div>
        </Card>
        
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">התפלגות תלמידים</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">תרשים התפלגות יתווסף בקרוב</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
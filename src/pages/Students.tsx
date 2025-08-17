import { Search, Plus, Eye, Edit, Filter } from 'lucide-react'
import Card from '../components/ui/Card'
import Table, { StatusBadge } from '../components/ui/Table'

export default function Students() {
  const students = [
    { 
      id: 1, 
      name: 'שרה יונסון', 
      instrument: 'כינור', 
      orchestra: 'תזמורת קאמרית', 
      grade: <StatusBadge status="completed">A</StatusBadge>,
      status: <StatusBadge status="active">פעיל</StatusBadge>,
      actions: (
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-1 text-primary-600 hover:text-primary-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-900">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    },
    { 
      id: 2, 
      name: 'מיכאל צ׳ן', 
      instrument: 'פסנתר', 
      orchestra: 'תזמורת סימפונית', 
      grade: <StatusBadge status="in-progress">B+</StatusBadge>,
      status: <StatusBadge status="active">פעיל</StatusBadge>,
      actions: (
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-1 text-primary-600 hover:text-primary-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-900">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    },
    { 
      id: 3, 
      name: 'אמה רודריגז', 
      instrument: 'צ׳לו', 
      orchestra: 'רביעיית מיתרים', 
      grade: <StatusBadge status="completed">A-</StatusBadge>,
      status: <StatusBadge status="active">פעיל</StatusBadge>,
      actions: (
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-1 text-primary-600 hover:text-primary-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-900">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    },
    { 
      id: 4, 
      name: 'דוד קים', 
      instrument: 'צליל', 
      orchestra: 'הרכב נשיפה', 
      grade: <StatusBadge status="pending">B</StatusBadge>,
      status: <StatusBadge status="inactive">לא פעיל</StatusBadge>,
      actions: (
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-1 text-primary-600 hover:text-primary-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-900">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    },
    { 
      id: 5, 
      name: 'ליזה ואנג', 
      instrument: 'קלרינט', 
      orchestra: 'תזמורת סימפונית', 
      grade: <StatusBadge status="completed">A</StatusBadge>,
      status: <StatusBadge status="active">פעיל</StatusBadge>,
      actions: (
        <div className="flex space-x-2 space-x-reverse">
          <button className="p-1 text-primary-600 hover:text-primary-900">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-600 hover:text-gray-900">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ]

  const columns = [
    { key: 'name', header: 'שם התלמיד' },
    { key: 'instrument', header: 'כלי נגינה' },
    { key: 'orchestra', header: 'תזמורת' },
    { key: 'grade', header: 'ציון', align: 'center' as const },
    { key: 'status', header: 'סטטוס', align: 'center' as const },
    { key: 'actions', header: 'פעולות', align: 'center' as const, width: '100px' },
  ]

  return (
    <div>
      {/* Filters and Search */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש תלמידים..."
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900">
              <option>כל התזמורות</option>
              <option>תזמורת סימפונית</option>
              <option>תזמורת קאמרית</option>
              <option>רביעיית מיתרים</option>
              <option>הרכב נשיפה</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900">
              <option>כל הכלים</option>
              <option>כינור</option>
              <option>פסנתר</option>
              <option>צ׳לו</option>
              <option>צליל</option>
              <option>קלרינט</option>
            </select>
            <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
              <Filter className="w-4 h-4 ml-1" />
              מסננים
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
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
            <div className="text-3xl font-bold text-primary-600 mb-1">150</div>
            <div className="text-sm text-gray-600">סה״כ תלמידים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-1">142</div>
            <div className="text-sm text-gray-600">פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">8</div>
            <div className="text-sm text-gray-600">לא פעילים</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">4.2</div>
            <div className="text-sm text-gray-600">ממוצע ציונים</div>
          </div>
        </Card>
      </div>

      {/* Students Table */}
      <Table columns={columns} data={students} />
    </div>
  )
}
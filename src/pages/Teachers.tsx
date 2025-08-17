import { Search, Plus, Filter } from 'lucide-react'
import Card from '../components/ui/Card'

export default function Teachers() {
  const teachers = [
    { id: 1, name: 'ד"ר מריה גונסלס', specialization: 'כינור, מוסיקה קאמרית', experience: '15 שנים' },
    { id: 2, name: 'פרופ׳ יוחנן סמית', specialization: 'פסנתר, תיאוריה מוסיקלית', experience: '20 שנים' },
    { id: 3, name: 'גב׳ אלנה פטרוב', specialization: 'צ׳לו, ניצוח תזמורת', experience: '12 שנים' },
    { id: 4, name: 'מר ג׳יימס וילסון', specialization: 'כלי נשיפה', experience: '8 שנים' },
  ]

  return (
    <div>
      {/* Search and Filters Container */}
      <Card className="mb-6" padding="md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מורים..."
                className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900">
              <option>כל ההתמחויות</option>
              <option>כינור</option>
              <option>פסנתר</option>
              <option>צ'לו</option>
              <option>כלי נשיפה</option>
              <option>ניצוח</option>
              <option>תיאוריה מוסיקלית</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900">
              <option>כל רמות הניסיון</option>
              <option>0-5 שנים</option>
              <option>5-10 שנים</option>
              <option>10-15 שנים</option>
              <option>15+ שנים</option>
            </select>
            <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
              <Filter className="w-4 h-4 ml-1" />
              מסננים
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              <Plus className="w-4 h-4 ml-2" />
              הוסף מורה
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="mr-4">
                <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                <p className="text-sm text-gray-500">{teacher.experience}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">{teacher.specialization}</p>
            </div>
            <div className="flex space-x-2">
              <button className="flex-1 bg-primary-50 text-primary-600 px-3 py-2 rounded text-sm hover:bg-primary-100">
                צפה בלו״ז
              </button>
              <button className="flex-1 bg-secondary-50 text-secondary-600 px-3 py-2 rounded text-sm hover:bg-secondary-100">
                ערוך פרופיל
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
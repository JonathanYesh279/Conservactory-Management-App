/**
 * Schedule Tab Component
 * 
 * Displays and manages teacher's schedule and time blocks
 */

import { useState } from 'react'
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, Users } from 'lucide-react'
import { Teacher } from '../../types'

interface ScheduleTabProps {
  teacher: Teacher
  teacherId: string
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ teacher, teacherId }) => {
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null)
  const [isAddingTimeBlock, setIsAddingTimeBlock] = useState(false)

  // Days of the week in Hebrew
  const daysOfWeek = [
    'ראשון',
    'שני', 
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת'
  ]

  // Group time blocks by day
  const timeBlocksByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = teacher.teaching?.timeBlocks?.filter(block => block.day === day) || []
    return acc
  }, {})

  const getTotalWeeklyHours = () => {
    return teacher.teaching?.timeBlocks?.reduce((total, block) => total + (block.totalDuration || 0), 0) / 60 || 0
  }

  const getTotalStudentsInSchedule = () => {
    const studentIds = new Set()
    teacher.teaching?.schedule?.forEach(slot => {
      if (slot.studentId) studentIds.add(slot.studentId)
    })
    return studentIds.size
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            לוח זמנים
          </h2>
          <p className="text-sm text-gray-600">
            ניהול בלוקי הזמן ולוח השיעורים השבועי
          </p>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {Math.round(getTotalWeeklyHours())}
            </div>
            <div className="text-gray-600">שעות שבועיות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teacher.teaching?.timeBlocks?.length || 0}
            </div>
            <div className="text-gray-600">בלוקי זמן</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getTotalStudentsInSchedule()}
            </div>
            <div className="text-gray-600">תלמידים בלוח</div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">לוח זמנים שבועי</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {daysOfWeek.map(day => (
            <div key={day} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-20 flex-shrink-0">
                  <h4 className="font-medium text-gray-900">{day}</h4>
                </div>
                
                <div className="flex-1">
                  {timeBlocksByDay[day].length === 0 ? (
                    <div className="text-gray-500 text-sm italic">
                      אין בלוקי זמן ביום זה
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeBlocksByDay[day].map((timeBlock, index) => (
                        <div
                          key={timeBlock._id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <Clock className="w-4 h-4" />
                              {timeBlock.startTime} - {timeBlock.endTime}
                            </div>
                            
                            {timeBlock.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                {timeBlock.location}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 text-sm text-blue-600">
                              <Users className="w-4 h-4" />
                              {timeBlock.assignedLessons?.length || 0} שיעורים
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTimeBlock(timeBlock)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              פרטים
                            </button>
                            <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Block Details Modal */}
      {selectedTimeBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                פרטי בלוק זמן - {selectedTimeBlock.day}
              </h3>
              <button
                onClick={() => setSelectedTimeBlock(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">זמן</label>
                  <p className="text-gray-900">
                    {selectedTimeBlock.startTime} - {selectedTimeBlock.endTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">משך (דקות)</label>
                  <p className="text-gray-900">{selectedTimeBlock.totalDuration}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">מיקום</label>
                  <p className="text-gray-900">{selectedTimeBlock.location || 'לא צוין'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">סטטוס</label>
                  <p className="text-gray-900">
                    {selectedTimeBlock.isActive ? 'פעיל' : 'לא פעיל'}
                  </p>
                </div>
              </div>
              
              {selectedTimeBlock.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">הערות</label>
                  <p className="text-gray-900">{selectedTimeBlock.notes}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">
                  שיעורים מתוכננים ({selectedTimeBlock.assignedLessons?.length || 0})
                </label>
                {selectedTimeBlock.assignedLessons?.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedTimeBlock.assignedLessons.map((lesson, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        שיעור {index + 1}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">אין שיעורים מתוכננים</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  ערוך בלוק זמן
                </button>
                <button
                  onClick={() => setSelectedTimeBlock(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Schedule Display */}
      {teacher.teaching?.schedule?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            שיעורים מתוכננים (מערכת ישנה)
          </h3>
          <div className="grid gap-3">
            {teacher.teaching.schedule.map((scheduleSlot, index) => (
              <div
                key={scheduleSlot._id || index}
                className="flex items-center justify-between p-3 bg-white rounded border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">{scheduleSlot.day}</div>
                  <div className="text-sm text-gray-600">
                    {scheduleSlot.startTime} - {scheduleSlot.endTime}
                  </div>
                  <div className="text-sm text-gray-600">
                    {scheduleSlot.duration} דקות
                  </div>
                  {scheduleSlot.location && (
                    <div className="text-sm text-gray-600">
                      📍 {scheduleSlot.location}
                    </div>
                  )}
                </div>
                <div className="text-sm text-blue-600">
                  תלמיד ID: {scheduleSlot.studentId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Time Block Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsAddingTimeBlock(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          הוסף בלוק זמן חדש
        </button>
      </div>
    </div>
  )
}

export default ScheduleTab
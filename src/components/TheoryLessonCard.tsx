import { Calendar, Clock, Users, MapPin, BookOpen, Edit, Trash2, UserCheck } from 'lucide-react'
import { 
  formatLessonDate, 
  formatLessonTime, 
  formatLessonAttendance, 
  calculateAttendancePercentage,
  getLessonStatus,
  getAttendanceColor,
  formatDuration,
  getEnrollmentInfo,
  type TheoryLesson 
} from '../utils/theoryLessonUtils'

interface TheoryLessonCardProps {
  lesson: TheoryLesson
  onEdit?: (lesson: TheoryLesson) => void
  onDelete?: (lessonId: string) => void
  onViewAttendance?: (lesson: TheoryLesson) => void
}

export default function TheoryLessonCard({ lesson, onEdit, onDelete, onViewAttendance }: TheoryLessonCardProps) {
  // Use utility functions for consistent formatting as specified in requirements
  const formattedDate = formatLessonDate(lesson)
  const formattedTime = formatLessonTime(lesson)
  const attendanceText = formatLessonAttendance(lesson)
  const attendancePercentage = calculateAttendancePercentage(lesson)
  const lessonStatus = getLessonStatus(lesson)
  const enrollmentInfo = getEnrollmentInfo(lesson)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                {lesson.category}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${lessonStatus.colorClass}`}>
                {lessonStatus.text}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h3>
            {lesson.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {onViewAttendance && (
              <button
                onClick={() => onViewAttendance(lesson)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="צפה בנוכחות"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(lesson)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="ערוך שיעור"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(lesson._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="מחק שיעור"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Teacher */}
        {lesson.teacherName && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium text-gray-900 ml-1">מורה:</span>
            {lesson.teacherName}
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">תאריך:</span>
            {formattedDate}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">שעה:</span>
            {formattedTime}
          </div>
        </div>

        {/* Location and Duration */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">מיקום:</span>
            {lesson.location || 'לא צוין'}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">משך:</span>
            {formatDuration(lesson.duration)}
          </div>
        </div>

        {/* Attendance */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">נוכחות:</span>
            <span className="text-gray-600">{attendanceText}</span>
          </div>
          
          {/* Attendance Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getAttendanceColor(attendancePercentage)}`}
                style={{ width: `${Math.min(100, attendancePercentage)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{attendancePercentage}%</span>
          </div>
        </div>

        {/* Students Count */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          {enrollmentInfo.enrolled} תלמידים רשומים מתוך {enrollmentInfo.capacity} מקומות
          {enrollmentInfo.available > 0 && (
            <span className="text-green-600 mr-2">({enrollmentInfo.available} מקומות פנויים)</span>
          )}
          {enrollmentInfo.isFull && (
            <span className="text-red-600 mr-2">(מלא)</span>
          )}
        </div>
      </div>
    </div>
  )
}
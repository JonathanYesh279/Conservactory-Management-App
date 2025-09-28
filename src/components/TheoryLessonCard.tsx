import { Calendar, Clock, MapPin, BookOpen, Edit, Trash2, UserCheck, Eye } from 'lucide-react'
import {
  formatLessonDate,
  formatLessonTime,
  getLessonStatus,
  type TheoryLesson
} from '../utils/theoryLessonUtils'
import TeacherNameDisplay from './TeacherNameDisplay'

interface TheoryLessonCardProps {
  lesson: TheoryLesson
  onView?: (lesson: TheoryLesson) => void
  onEdit?: (lesson: TheoryLesson) => void
  onDelete?: (lessonId: string) => void
  onViewAttendance?: (lesson: TheoryLesson) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (lessonId: string) => void
}

export default function TheoryLessonCard({ lesson, onView, onEdit, onDelete, onViewAttendance, selectable, selected, onSelect }: TheoryLessonCardProps) {
  // Use utility functions for consistent formatting as specified in requirements
  const formattedDate = formatLessonDate(lesson)
  const formattedTime = formatLessonTime(lesson)
  const lessonStatus = getLessonStatus(lesson)

  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${
      selected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200'
    }`}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          {selectable && (
            <div className="flex items-center ml-3">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelect?.(lesson._id)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
          )}
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
            {/* Teacher name displayed prominently under the title */}
            <TeacherNameDisplay
              lesson={lesson}
              className="text-sm font-medium text-gray-700 mb-1"
              showIcon={true}
            />
            {lesson.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {onView && (
              <button
                onClick={() => onView(lesson)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="צפה בפרטים"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
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

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 ml-2 text-gray-400" />
          <span className="font-medium text-gray-900 ml-1">מיקום:</span>
          {lesson.location || 'לא צוין'}
        </div>
      </div>
    </div>
  )
}
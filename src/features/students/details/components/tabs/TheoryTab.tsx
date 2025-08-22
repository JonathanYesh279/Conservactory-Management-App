/**
 * Theory Tab Component
 * 
 * Displays student's theory class enrollments and progress.
 */

import { useState, useMemo } from 'react'
import { BookOpen, Calendar, TrendingUp, Award, Clock, FileText, CheckCircle, XCircle, AlertTriangle, BarChart3, Target, Star, User, Download, Plus } from 'lucide-react'
import { StudentDetails, TheoryClass } from '../../types'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface TheoryTabProps {
  student: StudentDetails
  studentId: string
}

const TheoryTab: React.FC<TheoryTabProps> = ({ student, studentId }) => {
  const { theoryClasses } = student

  const ProgressBar: React.FC<{ current: number; total: number; label: string }> = ({ 
    current, 
    total, 
    label 
  }) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900">{current} / {total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">שיעורי תיאוריה</h2>
      
      {theoryClasses && theoryClasses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {theoryClasses.map((theoryClass, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg p-6 border-2 ${
                theoryClass.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{theoryClass.className}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  theoryClass.isActive 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {theoryClass.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>הצטרף: {new Date(theoryClass.enrollmentDate).toLocaleDateString('he-IL')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>רמה: {theoryClass.level}</span>
                </div>

                {theoryClass.grade !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-600">ציון:</span>
                    <span className={`font-medium ${
                      theoryClass.grade >= 80 ? 'text-green-600' :
                      theoryClass.grade >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {theoryClass.grade}
                    </span>
                  </div>
                )}

                {theoryClass.progress && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">התקדמות</h4>
                    <ProgressBar 
                      current={theoryClass.progress.completed} 
                      total={theoryClass.progress.total} 
                      label="שיעורים שהושלמו"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      עדכון אחרון: {new Date(theoryClass.progress.lastUpdate).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>התלמיד אינו לומד שיעורי תיאוריה כרגע</p>
        </div>
      )}
    </div>
  )
}

export default TheoryTab
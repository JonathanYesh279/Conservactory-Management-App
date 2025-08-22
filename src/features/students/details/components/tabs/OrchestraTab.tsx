/**
 * Orchestra Tab Component
 * 
 * Displays student's orchestra enrollments and performance history.
 */

import { useState, useMemo } from 'react'
import { Music, Calendar, Award, Users, Clock, MapPin, Star, Plus, ChevronRight, Play, Volume2, User, Trophy, Target, CheckCircle, AlertCircle } from 'lucide-react'
import { StudentDetails, OrchestraEnrollment } from '../../types'
import { Bar, Line } from 'react-chartjs-2'
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
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface OrchestraTabProps {
  student: StudentDetails
  studentId: string
}

const OrchestraTab: React.FC<OrchestraTabProps> = ({ student, studentId }) => {
  const { orchestraEnrollments } = student

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">תזמורות</h2>
      
      {orchestraEnrollments && orchestraEnrollments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orchestraEnrollments.map((enrollment, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg p-6 border-2 ${
                enrollment.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{enrollment.orchestraName}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  enrollment.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {enrollment.isActive ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>הצטרף: {new Date(enrollment.enrollmentDate).toLocaleDateString('he-IL')}</span>
                </div>

                {enrollment.position && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>תפקיד: {enrollment.position}</span>
                  </div>
                )}

                {enrollment.partAssignment && (
                  <div className="text-sm text-gray-600">
                    <strong>חלק:</strong> {enrollment.partAssignment}
                  </div>
                )}

                {enrollment.performanceHistory && enrollment.performanceHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">היסטוריית הופעות</h4>
                    <div className="space-y-2">
                      {enrollment.performanceHistory.map((performance, perfIndex) => (
                        <div key={perfIndex} className="bg-gray-50 p-3 rounded text-sm">
                          <div className="font-medium text-gray-900">{performance.concertName}</div>
                          <div className="text-gray-600">
                            {new Date(performance.date).toLocaleDateString('he-IL')} • {performance.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>התלמיד אינו חבר בתזמורות כרגע</p>
        </div>
      )}
    </div>
  )
}

export default OrchestraTab
import { Music, User, Users, Calendar, MapPin, Edit, Trash2, Eye, Clock } from 'lucide-react'
import { 
  getOrchestraTypeInfo,
  getOrchestraStatus,
  calculateOrchestraStats,
  getConductorName,
  formatMemberCount,
  formatRehearsalCount,
  getMemberInstrumentsSummary,
  type Orchestra
} from '../utils/orchestraUtils'

interface OrchestraCardProps {
  orchestra: Orchestra
  onEdit?: (orchestra: Orchestra) => void
  onDelete?: (orchestraId: string) => void
  onViewDetails?: (orchestraId: string) => void
}

export default function OrchestraCard({ orchestra, onEdit, onDelete, onViewDetails }: OrchestraCardProps) {
  const typeInfo = getOrchestraTypeInfo(orchestra.type)
  const status = getOrchestraStatus(orchestra)
  const stats = calculateOrchestraStats(orchestra)
  const instrumentsSummary = getMemberInstrumentsSummary(orchestra.members)

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(orchestra._id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(orchestra)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(orchestra._id)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {typeInfo.text}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {status.text}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">
              {orchestra.name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <User className="w-3 h-3 ml-1" />
              {getConductorName(orchestra)}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 mr-2">
            {onViewDetails && (
              <button
                onClick={handleViewDetails}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="צפה בפרטים"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="ערוך תזמורת"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="מחק תזמורת"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 ml-2 text-gray-400" />
          <span className="font-medium text-gray-900 ml-1">מיקום:</span>
          {orchestra.location}
        </div>

        {/* Members and Rehearsals */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">חברים:</span>
            {formatMemberCount(stats.memberCount)}
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 ml-2 text-gray-400" />
            <span className="font-medium text-gray-900 ml-1">חזרות:</span>
            {formatRehearsalCount(stats.rehearsalCount)}
          </div>
        </div>

        {/* Instruments Summary */}
        {instrumentsSummary.totalInstruments > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                <Music className="w-4 h-4 inline ml-1" />
                כלי נגינה
              </span>
              <span className="text-xs text-gray-500">
                {instrumentsSummary.totalInstruments} סוגים
              </span>
            </div>
            
            {instrumentsSummary.primaryInstruments.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {instrumentsSummary.primaryInstruments.slice(0, 4).map(instrument => (
                  <span 
                    key={instrument}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                  >
                    {instrument}
                    <span className="mr-1 text-gray-600">
                      ({instrumentsSummary.instrumentCounts[instrument]})
                    </span>
                  </span>
                ))}
                {instrumentsSummary.primaryInstruments.length > 4 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{instrumentsSummary.primaryInstruments.length - 4} נוספים
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Attendance Rate */}
        {stats.averageAttendance > 0 && (
          <div className="flex items-center bg-gray-50 rounded-lg p-3">
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 ml-2 text-gray-400" />
              <span className="font-medium text-gray-900 ml-1">נוכחות ממוצעת:</span>
              <span className="text-gray-600">{stats.averageAttendance}%</span>
            </div>
          </div>
        )}


        {/* Footer Statistics */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100 flex justify-between">
          <span>
            הרכב {stats.orchestraSize}
          </span>
          <span>
            {stats.isFullyConfigured ? 'מוגדר במלואו' : 'דורש השלמה'}
          </span>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, MapPin, Users, Edit, Trash2, CheckCircle, XCircle, Check, X, Search, Save, RotateCcw } from 'lucide-react'
import { rehearsalService, orchestraService } from '../services/apiService'
import { 
  formatRehearsalDateTime, 
  getRehearsalStatus,
  calculateAttendanceStats,
  getRehearsalColor,
  type Rehearsal 
} from '../utils/rehearsalUtils'
import Card from '../components/ui/Card'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import RehearsalForm from '../components/RehearsalForm'

export default function RehearsalDetails() {
  const { rehearsalId } = useParams<{ rehearsalId: string }>()
  const navigate = useNavigate()
  
  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null)
  const [orchestras, setOrchestras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  // Attendance state
  const [attendanceState, setAttendanceState] = useState<{
    present: Set<string>
    absent: Set<string>
  }>({
    present: new Set(),
    absent: new Set()
  })
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('')
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [hasAttendanceChanges, setHasAttendanceChanges] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [attendanceSuccess, setAttendanceSuccess] = useState(false)
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (rehearsalId) {
      loadRehearsalDetails()
    }
  }, [rehearsalId])

  const loadRehearsalDetails = async () => {
    if (!rehearsalId) return

    try {
      setLoading(true)
      setError(null)

      const [rehearsalsData, orchestrasData] = await Promise.all([
        rehearsalService.getRehearsals(),
        orchestraService.getOrchestras()
      ])

      // Find the specific rehearsal and enrich it with orchestra data
      const foundRehearsal = rehearsalsData.find((r: Rehearsal) => r._id === rehearsalId)
      if (!foundRehearsal) {
        setError('החזרה לא נמצאה')
        return
      }

      const orchestra = orchestrasData.find((orch: any) => orch._id === foundRehearsal.groupId)
      const enrichedRehearsal = {
        ...foundRehearsal,
        orchestra: orchestra ? {
          _id: orchestra._id,
          name: orchestra.name,
          type: orchestra.type,
          memberIds: orchestra.memberIds || [],
          conductor: orchestra.conductor,
          members: orchestra.members
        } : undefined
      }

      setRehearsal(enrichedRehearsal)
      setOrchestras(orchestrasData)
      
      // Initialize attendance state
      setAttendanceState({
        present: new Set(foundRehearsal.attendance?.present || []),
        absent: new Set(foundRehearsal.attendance?.absent || [])
      })
    } catch (error: any) {
      console.error('Error loading rehearsal details:', error)
      setError('שגיאה בטעינת פרטי החזרה')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRehearsal = async (data: any) => {
    if (!rehearsal) return

    try {
      await rehearsalService.updateRehearsal(rehearsal._id, data)
      setShowEditForm(false)
      await loadRehearsalDetails()
    } catch (error: any) {
      throw new Error(error.message || 'שגיאה בעדכון החזרה')
    }
  }

  const handleDeleteRehearsal = () => {
    setShowDeleteModal(true)
  }

  const confirmDeleteRehearsal = async () => {
    if (!rehearsal) return

    try {
      await rehearsalService.deleteRehearsal(rehearsal._id)
      navigate('/rehearsals')
    } catch (error: any) {
      setError('שגיאה במחיקת החזרה')
    } finally {
      setShowDeleteModal(false)
    }
  }

  const cancelDeleteRehearsal = () => {
    setShowDeleteModal(false)
  }

  // Attendance functions
  useEffect(() => {
    if (!rehearsal) return
    
    // Check if there are changes
    const originalPresent = new Set(rehearsal.attendance?.present || [])
    const originalAbsent = new Set(rehearsal.attendance?.absent || [])
    
    const hasChanges = 
      originalPresent.size !== attendanceState.present.size ||
      originalAbsent.size !== attendanceState.absent.size ||
      [...attendanceState.present].some(id => !originalPresent.has(id)) ||
      [...attendanceState.absent].some(id => !originalAbsent.has(id))
    
    setHasAttendanceChanges(hasChanges)
  }, [attendanceState, rehearsal])

  const handleAttendanceChange = (memberId: string, status: 'present' | 'absent' | 'unmarked') => {
    setAttendanceState(prev => {
      const newState = {
        present: new Set(prev.present),
        absent: new Set(prev.absent)
      }

      // Remove from both sets first
      newState.present.delete(memberId)
      newState.absent.delete(memberId)

      // Add to appropriate set if not unmarked
      if (status === 'present') {
        newState.present.add(memberId)
      } else if (status === 'absent') {
        newState.absent.add(memberId)
      }

      return newState
    })
    setAttendanceError(null)
  }

  const handleQuickMarkAll = (status: 'present' | 'absent') => {
    if (!rehearsal?.orchestra?.members) return
    
    setAttendanceState(prev => {
      const newState = {
        present: new Set<string>(),
        absent: new Set<string>()
      }

      if (status === 'present') {
        rehearsal.orchestra!.members!.forEach(member => newState.present.add(member._id))
      } else {
        rehearsal.orchestra!.members!.forEach(member => newState.absent.add(member._id))
      }

      return newState
    })
    setAttendanceError(null)
  }

  const handleAttendanceReset = () => {
    if (!rehearsal) return
    
    setAttendanceState({
      present: new Set(rehearsal.attendance?.present || []),
      absent: new Set(rehearsal.attendance?.absent || [])
    })
    setAttendanceError(null)
  }

  const handleSaveAttendance = async () => {
    if (!rehearsal) return
    
    setAttendanceLoading(true)
    setAttendanceError(null)

    try {
      const attendanceData = {
        present: [...attendanceState.present],
        absent: [...attendanceState.absent]
      }

      await rehearsalService.updateAttendance(rehearsal._id, attendanceData)
      setAttendanceSuccess(true)
      setTimeout(() => {
        setAttendanceSuccess(false)
      }, 2000)
      await loadRehearsalDetails()
    } catch (error: any) {
      setAttendanceError(error.message || 'שגיאה בשמירת הנוכחות')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const getAttendanceStatus = (memberId: string): 'present' | 'absent' | 'unmarked' => {
    if (attendanceState.present.has(memberId)) return 'present'
    if (attendanceState.absent.has(memberId)) return 'absent'
    return 'unmarked'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען פרטי החזרה...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => navigate('/rehearsals')}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            חזור לחזרות
          </button>
        </div>
      </div>
    )
  }

  if (!rehearsal) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">החזרה לא נמצאה</h2>
          <button
            onClick={() => navigate('/rehearsals')}
            className="text-primary-600 hover:text-primary-800 underline"
          >
            חזור לחזרות
          </button>
        </div>
      </div>
    )
  }

  const status = getRehearsalStatus(rehearsal)
  const attendanceStats = calculateAttendanceStats(rehearsal)
  const color = getRehearsalColor(rehearsal)
  const dateTime = formatRehearsalDateTime(rehearsal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rehearsals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="חזור לחזרות"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">פרטי החזרה</h1>
            <p className="text-gray-600 mt-1">{rehearsal.orchestra?.name || 'ללא שם'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
          <button
            onClick={handleDeleteRehearsal}
            className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            מחק
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Rehearsal Info Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {rehearsal.orchestra?.name || 'ללא שם'}
                </h2>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    rehearsal.type === 'תזמורת' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {rehearsal.type}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${status.colorClass}`}>
                    {status.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">תאריך</div>
                  <div className="text-gray-600">{dateTime.date}</div>
                  <div className="text-sm text-gray-500">{dateTime.dayName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">שעה</div>
                  <div className="text-gray-600">{dateTime.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">מיקום</div>
                  <div className="text-gray-600">{rehearsal.location || 'לא צוין מיקום'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">חברי התזמורת</div>
                  <div className="text-gray-600">
                    {rehearsal.orchestra?.members?.length || 0} חברים
                  </div>
                </div>
              </div>
            </div>

            {rehearsal.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="font-medium text-gray-900 mb-2">הערות</div>
                <div className="text-gray-600 whitespace-pre-wrap">{rehearsal.notes}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Management Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">ניהול נוכחות</h3>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickMarkAll('present')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                >
                  סמן הכל נוכח
                </button>
                <button
                  onClick={() => handleQuickMarkAll('absent')}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                >
                  סמן הכל נעדר
                </button>
                {hasAttendanceChanges && (
                  <button
                    onClick={handleAttendanceReset}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 mr-1 inline" />
                    איפוס
                  </button>
                )}
              </div>
            </div>

            {/* Success Message */}
            {attendanceSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                  <span className="text-green-800 text-sm">הנוכחות נשמרה בהצלחה!</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {attendanceError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-600 ml-2" />
                  <span className="text-red-800 text-sm">{attendanceError}</span>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attendanceState.present.size}</div>
                <div className="text-sm text-gray-600">נוכחים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceState.absent.size}</div>
                <div className="text-sm text-gray-600">נעדרים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {(rehearsal.orchestra?.members?.length || 0) - attendanceState.present.size - attendanceState.absent.size}
                </div>
                <div className="text-sm text-gray-600">לא סומנו</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rehearsal.orchestra?.members?.length || 0}</div>
                <div className="text-sm text-gray-600">סה״כ</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש חבר..."
                value={attendanceSearchQuery}
                onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rehearsal.orchestra?.members
                ?.filter(member =>
                  member.personalInfo?.fullName?.toLowerCase().includes(attendanceSearchQuery.toLowerCase()) ||
                  member.academicInfo?.class?.includes(attendanceSearchQuery)
                )
                .map(member => {
                  const status = getAttendanceStatus(member._id)
                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.personalInfo?.fullName}</div>
                        {member.academicInfo?.class && (
                          <div className="text-sm text-gray-500">{member.academicInfo.class}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAttendanceChange(member._id, status === 'present' ? 'unmarked' : 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            status === 'present' 
                              ? 'bg-green-100 text-green-600 border-2 border-green-300' 
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-green-50'
                          }`}
                          title="נוכח"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleAttendanceChange(member._id, status === 'absent' ? 'unmarked' : 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            status === 'absent' 
                              ? 'bg-red-100 text-red-600 border-2 border-red-300' 
                              : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-red-50'
                          }`}
                          title="נעדר"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Save Button */}
            {hasAttendanceChanges && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveAttendance}
                  disabled={attendanceLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {attendanceLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      שמור נוכחות
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <RehearsalForm
          orchestras={orchestras}
          existingRehearsals={[]}
          onSubmit={handleEditRehearsal}
          onCancel={() => setShowEditForm(false)}
          initialData={{
            groupId: rehearsal.groupId,
            type: rehearsal.type,
            date: rehearsal.date.split('T')[0],
            startTime: rehearsal.startTime,
            endTime: rehearsal.endTime,
            location: rehearsal.location,
            notes: rehearsal.notes,
            isActive: rehearsal.isActive
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת חזרה"
        message="האם אתה בטוח שברצונך למחוק את החזרה? פעולה זו אינה ניתנת לביטול ותמחק את כל הנתונים הקשורים לחזרה כולל נוכחות שנרשמה."
        confirmText="מחק לצמיתות"
        cancelText="ביטול"
        onConfirm={confirmDeleteRehearsal}
        onCancel={cancelDeleteRehearsal}
        variant="danger"
      />

    </div>
  )
}
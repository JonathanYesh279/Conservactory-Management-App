import React, { useState, useEffect } from 'react'
import { useAuth } from '../../services/authContext.jsx'
import { Plus, Search, Edit, Trash2, Music, Users } from 'lucide-react'
import apiService from '../../services/apiService'

interface Orchestra {
  id: string
  name: string
  description?: string
  type: 'youth' | 'adult' | 'chamber' | 'symphony'
  level: 'beginner' | 'intermediate' | 'advanced'
  memberCount?: number
  status: 'active' | 'inactive'
  rehearsalDay?: string
  rehearsalTime?: string
  venue?: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  instrument: string
  section: string
  status: 'active' | 'inactive'
}

export default function ConductorOrchestrasTab() {
  const { user } = useAuth()
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingOrchestra, setEditingOrchestra] = useState<Orchestra | null>(null)
  const [selectedOrchestra, setSelectedOrchestra] = useState<string | null>(null)
  const [orchestraMembers, setOrchestraMembers] = useState<Member[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConductorOrchestras()
  }, [user])

  const loadConductorOrchestras = async () => {
    if (!user?._id) return

    try {
      setLoading(true)
      const conductorId = user._id
      
      // First get teacher profile to access orchestraIds
      const teacherProfile = await apiService.teachers.getTeacher(conductorId)
      
      if (!teacherProfile) {
        throw new Error('לא נמצא פרופיל מנצח')
      }
      
      const orchestraIds = teacherProfile?.conducting?.orchestraIds || []
      
      if (orchestraIds.length === 0) {
        console.log('No orchestras assigned to conductor')
        setOrchestras([])
        return
      }

      // Fetch specific orchestras using batch approach
      const orchestrasData = await apiService.orchestras.getBatchOrchestras(orchestraIds)
      
      if (!Array.isArray(orchestrasData)) {
        throw new Error('תגובה לא תקינה מהשרת')
      }
      
      // Map backend data to frontend format
      const mappedOrchestras = orchestrasData.map(orchestra => ({
        id: orchestra._id,
        name: orchestra.name,
        description: orchestra.description,
        type: orchestra.type,
        level: orchestra.level,
        memberCount: orchestra.memberCount || 0,
        status: orchestra.status || 'active',
        rehearsalDay: orchestra.rehearsalSchedule?.day,
        rehearsalTime: orchestra.rehearsalSchedule?.time,
        venue: orchestra.venue
      }))
      
      setOrchestras(mappedOrchestras)
    } catch (error) {
      console.error('Error loading conductor orchestras:', error)
      setError('שגיאה בטעינת רשימת התזמורות')
    } finally {
      setLoading(false)
    }
  }

  const loadOrchestraMembers = async (orchestraId: string) => {
    try {
      const orchestra = await apiService.orchestras.getOrchestra(orchestraId)
      const members = orchestra.memberDetails || []
      
      // Map backend data to frontend format
      const mappedMembers = members.map(member => ({
        id: member._id,
        firstName: member.personalInfo?.firstName || '',
        lastName: member.personalInfo?.lastName || '',
        instrument: member.primaryInstrument || '',
        section: member.section || '',
        status: member.status || 'active'
      }))
      
      setOrchestraMembers(mappedMembers)
    } catch (error) {
      console.error('Error loading orchestra members:', error)
    }
  }

  const filteredOrchestras = orchestras.filter(orchestra =>
    searchTerm === '' || 
    orchestra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orchestra.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orchestra.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteOrchestra = async (orchestraId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תזמורת זו?')) return

    try {
      await apiService.orchestras.deleteOrchestra(orchestraId)
      setOrchestras(prev => prev.filter(o => o.id !== orchestraId))
      if (selectedOrchestra === orchestraId) {
        setSelectedOrchestra(null)
        setOrchestraMembers([])
      }
    } catch (error) {
      console.error('Error deleting orchestra:', error)
      alert('שגיאה במחיקת התזמורת')
    }
  }

  const handleOrchestraSubmit = async (orchestraData: Partial<Orchestra>) => {
    try {
      if (editingOrchestra) {
        // Update existing orchestra
        const backendData = {
          name: orchestraData.name,
          description: orchestraData.description,
          type: orchestraData.type,
          level: orchestraData.level,
          status: orchestraData.status,
          rehearsalSchedule: {
            day: orchestraData.rehearsalDay,
            time: orchestraData.rehearsalTime
          },
          venue: orchestraData.venue
        }
        
        const updatedOrchestra = await apiService.orchestras.updateOrchestra(editingOrchestra.id, backendData)
        
        // Map response back to frontend format
        const mappedOrchestra = {
          id: updatedOrchestra._id,
          name: updatedOrchestra.name,
          description: updatedOrchestra.description,
          type: updatedOrchestra.type,
          level: updatedOrchestra.level,
          memberCount: updatedOrchestra.memberCount || 0,
          status: updatedOrchestra.status || 'active',
          rehearsalDay: updatedOrchestra.rehearsalSchedule?.day,
          rehearsalTime: updatedOrchestra.rehearsalSchedule?.time,
          venue: updatedOrchestra.venue
        }
        
        setOrchestras(prev => prev.map(o => 
          o.id === editingOrchestra.id ? mappedOrchestra : o
        ))
      } else {
        // Create new orchestra
        const conductorId = user?._id
        const backendData = {
          name: orchestraData.name,
          description: orchestraData.description,
          type: orchestraData.type,
          level: orchestraData.level,
          status: orchestraData.status,
          rehearsalSchedule: {
            day: orchestraData.rehearsalDay,
            time: orchestraData.rehearsalTime
          },
          venue: orchestraData.venue,
          conductorId
        }
        
        const newOrchestra = await apiService.orchestras.createOrchestra(backendData)
        
        // Map response back to frontend format
        const mappedOrchestra = {
          id: newOrchestra._id,
          name: newOrchestra.name,
          description: newOrchestra.description,
          type: newOrchestra.type,
          level: newOrchestra.level,
          memberCount: newOrchestra.memberCount || 0,
          status: newOrchestra.status || 'active',
          rehearsalDay: newOrchestra.rehearsalSchedule?.day,
          rehearsalTime: newOrchestra.rehearsalSchedule?.time,
          venue: newOrchestra.venue
        }
        
        setOrchestras(prev => [...prev, mappedOrchestra])
      }
      setShowAddModal(false)
      setEditingOrchestra(null)
    } catch (error) {
      console.error('Error saving orchestra:', error)
      alert('שגיאה בשמירת פרטי התזמורת')
    }
  }

  const getOrchestraTypeLabel = (type: string) => {
    switch (type) {
      case 'youth': return 'תזמורת נוער'
      case 'adult': return 'תזמורת מבוגרים'
      case 'chamber': return 'תזמורת קאמרית'
      case 'symphony': return 'תזמורת סימפונית'
      default: return type
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'מתחילים'
      case 'intermediate': return 'בינוניים'
      case 'advanced': return 'מתקדמים'
      default: return level
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">טוען רשימת תזמורות...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-reisinger-yonatan">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 font-reisinger-yonatan">
            תזמורות שאני מנצח
          </h3>
          <p className="text-gray-600 mt-1">
            {orchestras.length} תזמורות
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="font-reisinger-yonatan">הוסף תזמורת</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="חיפוש תזמורות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orchestras List */}
        <div className="space-y-4">
          {filteredOrchestras.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-reisinger-yonatan">
                {searchTerm ? 'לא נמצאו תזמורות' : 'אין תזמורות רשומות'}
              </h3>
              <p className="text-gray-600 font-reisinger-yonatan">
                {searchTerm ? 'נסה מילות חיפוש אחרות' : 'התחל בהוספת התזמורת הראשונה שלך'}
              </p>
            </div>
          ) : (
            filteredOrchestras.map((orchestra) => (
              <div 
                key={orchestra.id} 
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer transform hover:-translate-y-1 group ${
                  selectedOrchestra === orchestra.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                }`}
                onClick={() => {
                  setSelectedOrchestra(orchestra.id)
                  loadOrchestraMembers(orchestra.id)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                      {orchestra.name}
                    </h4>
                    <p className="text-sm text-gray-600 font-reisinger-yonatan">
                      {getOrchestraTypeLabel(orchestra.type)} • {getLevelLabel(orchestra.level)}
                    </p>
                    {orchestra.description && (
                      <p className="text-sm text-gray-500 mt-1 font-reisinger-yonatan">
                        {orchestra.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingOrchestra(orchestra)
                        setShowAddModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="עריכת תזמורת"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteOrchestra(orchestra.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="מחיקת תזמורת"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{orchestra.memberCount || 0} חברים</span>
                    </div>
                    {orchestra.rehearsalDay && (
                      <span>חזרות: {orchestra.rehearsalDay}</span>
                    )}
                  </div>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    orchestra.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {orchestra.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Orchestra Members */}
        {selectedOrchestra && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 font-reisinger-yonatan">
                חברי התזמורת
              </h4>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium font-reisinger-yonatan">
                נהל חברים
              </button>
            </div>
            
            {orchestraMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-reisinger-yonatan">אין חברים רשומים בתזמורת</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orchestraMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200">
                    <div>
                      <div className="font-medium text-sm font-reisinger-yonatan">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-xs text-gray-500 font-reisinger-yonatan">
                        {member.instrument} • {member.section}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Orchestra Modal */}
      {showAddModal && (
        <OrchestraModal
          orchestra={editingOrchestra}
          onClose={() => {
            setShowAddModal(false)
            setEditingOrchestra(null)
          }}
          onSubmit={handleOrchestraSubmit}
        />
      )}
    </div>
  )
}

// Orchestra Modal Component
interface OrchestraModalProps {
  orchestra: Orchestra | null
  onClose: () => void
  onSubmit: (data: Partial<Orchestra>) => void
}

function OrchestraModal({ orchestra, onClose, onSubmit }: OrchestraModalProps) {
  const [formData, setFormData] = useState({
    name: orchestra?.name || '',
    description: orchestra?.description || '',
    type: orchestra?.type || 'youth' as 'youth' | 'adult' | 'chamber' | 'symphony',
    level: orchestra?.level || 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    status: orchestra?.status || 'active' as 'active' | 'inactive',
    rehearsalDay: orchestra?.rehearsalDay || '',
    rehearsalTime: orchestra?.rehearsalTime || '',
    venue: orchestra?.venue || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
        <h3 className="text-lg font-bold text-gray-900 mb-4 font-reisinger-yonatan">
          {orchestra ? 'עריכת תזמורת' : 'הוספת תזמורת חדשה'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              שם התזמורת *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              תיאור
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                סוג תזמורת *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="youth">תזמורת נוער</option>
                <option value="adult">תזמורת מבוגרים</option>
                <option value="chamber">תזמורת קאמרית</option>
                <option value="symphony">תזמורת סימפונית</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                רמה *
              </label>
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">מתחילים</option>
                <option value="intermediate">בינוניים</option>
                <option value="advanced">מתקדמים</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                יום חזרות
              </label>
              <input
                type="text"
                value={formData.rehearsalDay}
                onChange={(e) => setFormData(prev => ({ ...prev, rehearsalDay: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="כלומר: יום ראשון"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
                שעת חזרות
              </label>
              <input
                type="time"
                value={formData.rehearsalTime}
                onChange={(e) => setFormData(prev => ({ ...prev, rehearsalTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              מקום חזרות
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-reisinger-yonatan">
              סטטוס
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">פעיל</option>
              <option value="inactive">לא פעיל</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-reisinger-yonatan"
            >
              {orchestra ? 'עדכן' : 'הוסף'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-reisinger-yonatan"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
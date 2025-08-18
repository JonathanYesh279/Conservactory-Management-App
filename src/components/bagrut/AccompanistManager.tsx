import { useState } from 'react'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Phone,
  Music,
  UserCheck,
  Calendar,
  Clock
} from 'lucide-react'
import Card from '../ui/Card'

interface Accompanist {
  name: string
  instrument: string
  phone: string | null
}

interface AccompanimentData {
  type: 'נגן מלווה' | 'הרכב'
  accompanists: Accompanist[]
}

interface AccompanistManagerProps {
  accompaniment: AccompanimentData
  onUpdate: (accompaniment: AccompanimentData) => void
  readonly?: boolean
}

export default function AccompanistManager({ 
  accompaniment, 
  onUpdate, 
  readonly = false 
}: AccompanistManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<Accompanist | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccompanist, setNewAccompanist] = useState<Accompanist>({
    name: '',
    instrument: '',
    phone: null
  })

  const ACCOMPANIMENT_TYPES = ['נגן מלווה', 'הרכב'] as const
  
  const COMMON_INSTRUMENTS = [
    'פסנתר',
    'גיטרה',
    'כינור',
    'ויולה',
    'צ\'לו',
    'קונטרבס',
    'חלילית',
    'קלרינט',
    'סקסופון',
    'חצוצרה',
    'טרומבון',
    'תופים',
    'כלי הקשה',
    'אחר'
  ]

  const updateAccompanimentType = (type: 'נגן מלווה' | 'הרכב') => {
    onUpdate({
      ...accompaniment,
      type
    })
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditData({ ...accompaniment.accompanists[index] })
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditData(null)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editData) {
      const updatedAccompanists = [...accompaniment.accompanists]
      updatedAccompanists[editingIndex] = editData
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
      setEditingIndex(null)
      setEditData(null)
    }
  }

  const deleteAccompanist = (index: number) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק נגן זה?')) {
      const updatedAccompanists = accompaniment.accompanists.filter((_, i) => i !== index)
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
    }
  }

  const addAccompanist = () => {
    if (newAccompanist.name && newAccompanist.instrument) {
      const updatedAccompanists = [...accompaniment.accompanists, newAccompanist]
      onUpdate({
        ...accompaniment,
        accompanists: updatedAccompanists
      })
      setNewAccompanist({
        name: '',
        instrument: '',
        phone: null
      })
      setShowAddForm(false)
    }
  }

  const cancelAdd = () => {
    setNewAccompanist({
      name: '',
      instrument: '',
      phone: null
    })
    setShowAddForm(false)
  }

  const validatePhone = (phone: string) => {
    if (!phone) return true
    const phonePattern = /^05\d{8}$/
    return phonePattern.test(phone)
  }

  const renderAccompanistCard = (accompanist: Accompanist, index: number) => {
    const isEditing = editingIndex === index

    return (
      <Card key={index} padding="md" className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      שם הנגן *
                    </label>
                    <input
                      type="text"
                      value={editData?.name || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="שם מלא"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      כלי נגינה *
                    </label>
                    <select
                      value={editData?.instrument || ''}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, instrument: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">בחר כלי נגינה</option>
                      {COMMON_INSTRUMENTS.map(instrument => (
                        <option key={instrument} value={instrument}>{instrument}</option>
                      ))}
                    </select>
                    {editData?.instrument === 'אחר' && (
                      <input
                        type="text"
                        value={editData?.instrument || ''}
                        onChange={(e) => setEditData(prev => prev ? { ...prev, instrument: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                        placeholder="ציין כלי נגינה"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר טלפון
                  </label>
                  <input
                    type="tel"
                    value={editData?.phone || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, phone: e.target.value || null } : null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      editData?.phone && !validatePhone(editData.phone)
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="050-1234567"
                  />
                  {editData?.phone && !validatePhone(editData.phone) && (
                    <p className="text-red-500 text-xs mt-1">מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-2">
                  <UserCheck className="w-5 h-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {accompanist.name}
                  </h3>
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <Music className="w-4 h-4 mr-2" />
                  <span className="text-sm">{accompanist.instrument}</span>
                </div>
                
                {accompanist.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a 
                      href={`tel:${accompanist.phone}`}
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      {accompanist.phone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {!readonly && (
            <div className="flex items-center gap-2 mr-4">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={!editData?.name || !editData?.instrument}
                    className="p-2 text-green-600 hover:text-green-800 disabled:text-gray-400"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(index)}
                    className="p-2 text-primary-600 hover:text-primary-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAccompanist(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-3 text-primary-600" />
          ליווי מוזיקלי
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">נגנים:</span> {accompaniment.accompanists.length}
          </div>
          
          {!readonly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              הוסף נגן
            </button>
          )}
        </div>
      </div>

      {/* Accompaniment Type Selection */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">סוג הליווי</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACCOMPANIMENT_TYPES.map(type => (
            <div key={type}>
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="accompanimentType"
                  value={type}
                  checked={accompaniment.type === type}
                  onChange={(e) => !readonly && updateAccompanimentType(e.target.value as 'נגן מלווה' | 'הרכב')}
                  disabled={readonly}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <div className="mr-3">
                  <div className="font-medium text-gray-900">{type}</div>
                  <div className="text-sm text-gray-600">
                    {type === 'נגן מלווה' 
                      ? 'נגן יחיד המלווה את הביצוע'
                      : 'הרכב של מספר נגנים'
                    }
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Accompaniment Requirements */}
      <Card padding="md" className="bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <Users className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">דרישות הליווי</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• יש לציין לפחות נגן אחד מלווה</li>
              <li>• חובה לכלול פרטי קשר של הנגן המלווה</li>
              <li>• במידה ומדובר בהרכב - יש לציין את כל הנגנים</li>
              <li>• יש לתאם עם הנגן המלווה מספר חזרות לפני הבגרות</li>
            </ul>
            
            <div className="mt-3 flex items-center gap-6">
              <div className={`flex items-center text-sm ${
                accompaniment.accompanists.length > 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                <span className="font-medium">נגנים:</span>
                <span className="mr-1">{accompaniment.accompanists.length} (מינימום 1)</span>
                {accompaniment.accompanists.length > 0 ? ' ✓' : ' ⚠️'}
              </div>
              
              <div className={`flex items-center text-sm ${
                accompaniment.accompanists.some(a => a.phone) ? 'text-green-700' : 'text-amber-700'
              }`}>
                <span className="font-medium">פרטי קשר:</span>
                <span className="mr-1">{accompaniment.accompanists.filter(a => a.phone).length} מתוך {accompaniment.accompanists.length}</span>
                {accompaniment.accompanists.some(a => a.phone) ? ' ✓' : ' ⚠️'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add New Accompanist Form */}
      {showAddForm && !readonly && (
        <Card padding="md" className="border-2 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">הוספת נגן מלווה</h3>
            <button
              onClick={cancelAdd}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הנגן *
                </label>
                <input
                  type="text"
                  value={newAccompanist.name}
                  onChange={(e) => setNewAccompanist(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="שם מלא"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כלי נגינה *
                </label>
                <select
                  value={newAccompanist.instrument}
                  onChange={(e) => setNewAccompanist(prev => ({ ...prev, instrument: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">בחר כלי נגינה</option>
                  {COMMON_INSTRUMENTS.map(instrument => (
                    <option key={instrument} value={instrument}>{instrument}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מספר טלפון
              </label>
              <input
                type="tel"
                value={newAccompanist.phone || ''}
                onChange={(e) => setNewAccompanist(prev => ({ ...prev, phone: e.target.value || null }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  newAccompanist.phone && !validatePhone(newAccompanist.phone)
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="050-1234567"
              />
              {newAccompanist.phone && !validatePhone(newAccompanist.phone) && (
                <p className="text-red-500 text-xs mt-1">מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={cancelAdd}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={addAccompanist}
                disabled={!newAccompanist.name || !newAccompanist.instrument}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הוסף נגן
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Accompanists List */}
      {accompaniment.accompanists.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            נגנים מלווים ({accompaniment.type})
          </h3>
          {accompaniment.accompanists.map((accompanist, index) => 
            renderAccompanistCard(accompanist, index)
          )}
        </div>
      ) : (
        <Card padding="md">
          <div className="text-center py-8">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">אין נגנים מלווים</h3>
            <p className="text-gray-600 mb-4">הוסף נגן מלווה לביצוע הבגרות</p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                הוסף נגן ראשון
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Rehearsal Scheduling Section */}
      {accompaniment.accompanists.length > 0 && (
        <Card padding="md" className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">תיאום חזרות</h3>
              <p className="text-sm text-yellow-800 mb-3">
                חשוב לתאם עם הנגנים המלווים מספר חזרות לפני הבגרות כדי להבטיח ביצוע מוצלח.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center text-sm text-yellow-800 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    מספר חזרות מומלץ
                  </div>
                  <div className="font-medium">3-5 חזרות</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center text-sm text-yellow-800 mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    תדירות
                  </div>
                  <div className="font-medium">פעמיים בשבוע</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
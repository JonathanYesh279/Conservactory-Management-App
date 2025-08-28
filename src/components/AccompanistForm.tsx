import React, { useState, useEffect } from 'react'
import { Save, X, Users, Music, Phone, Mail, AlertCircle } from 'lucide-react'
import Card from './ui/Card'
import type { Accompanist } from '../types/bagrut.types'

interface AccompanistFormProps {
  initialData?: Partial<Accompanist>
  onSubmit: (data: Omit<Accompanist, '_id'>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

const AccompanistForm: React.FC<AccompanistFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<Omit<Accompanist, '_id'>>({
    name: '',
    instrument: '',
    phone: '',
    email: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Common accompaniment instruments
  const accompanimentInstruments = [
    'פסנתר',
    'גיטרה',
    'כינור',
    'ויולה',
    "צ'לו",
    'קונטרבס',
    'חלילית',
    'חליל צד',
    'אבוב',
    'קלרינט',
    'סקסופון',
    'בסון',
    'חצוצרה',
    'קרן יער',
    'טרומבון',
    'תופים',
    'כלי הקשה',
    'אחר'
  ]

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        instrument: initialData.instrument || '',
        phone: initialData.phone || '',
        email: initialData.email || ''
      })
    }
  }, [initialData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'שם המלווה הוא שדה חובה'
    }

    if (!formData.instrument.trim()) {
      newErrors.instrument = 'כלי הליווי הוא שדה חובה'
    }

    // Email validation (optional field)
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'כתובת אימייל לא תקינה'
    }

    // Phone validation (optional field, Israeli format)
    if (formData.phone && !formData.phone.match(/^[\d\-\s\+\(\)]+$/)) {
      newErrors.phone = 'מספר טלפון לא תקין'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting accompanist:', error)
      setErrors({ general: 'שגיאה בשמירת המלווה. אנא נסה שוב.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="bg-white rounded-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'עריכת מלווה' : 'מלווה חדש'}
          </h2>
          <p className="text-gray-600 mt-1">
            הוספת נגן מלווה לביצוע הבגרות
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{errors.general}</span>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            פרטי המלווה
          </h3>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם המלווה <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="לדוגמה: יוסי כהן"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Instrument */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כלי הליווי <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-gray-400" />
                <select
                  value={formData.instrument}
                  onChange={(e) => handleInputChange('instrument', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.instrument ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">בחר כלי</option>
                  {accompanimentInstruments.map(instrument => (
                    <option key={instrument} value={instrument}>
                      {instrument}
                    </option>
                  ))}
                </select>
              </div>
              {errors.instrument && (
                <p className="text-red-600 text-sm mt-1">{errors.instrument}</p>
              )}
              
              {/* Custom instrument input if "אחר" is selected */}
              {formData.instrument === 'אחר' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="הכנס את שם הכלי"
                    onChange={(e) => handleInputChange('instrument', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי קשר</h3>
          
          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר טלפון
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="לדוגמה: 054-123-4567"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  dir="ltr"
                />
              </div>
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת אימייל
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="לדוגמה: yosi@example.com"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  dir="ltr"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">מידע חשוב</p>
              <p>
                פרטי הקשר יועברו למלווה לתיאום חזרות ויום הבגרות. 
                ודא שהפרטים נכונים ועדכניים.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ביטול
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמור מלווה
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AccompanistForm
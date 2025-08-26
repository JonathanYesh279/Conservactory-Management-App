/**
 * Quick Actions Modal Component
 * 
 * Provides comprehensive quick actions interface for printing, exporting,
 * and emailing student reports and data.
 */

import { useState, useRef } from 'react'
import { 
  X, 
  Printer, 
  Download, 
  Mail, 
  FileText, 
  Award, 
  Calendar,
  BarChart3,
  Music,
  FileSpreadsheet,
  FileImage,
  Send,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react'
import { StudentDetails } from '../types'
import { 
  quickActionsService, 
  ExportOptions, 
  PrintOptions, 
  EmailOptions 
} from '@/services/quickActionsService'
import toast from 'react-hot-toast'

interface QuickActionsModalProps {
  student: StudentDetails
  isOpen: boolean
  onClose: () => void
}

type ActionType = 'print' | 'export' | 'email' | 'certificate'

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const [activeAction, setActiveAction] = useState<ActionType>('print')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Print options state
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    type: 'summary',
    orientation: 'portrait',
    includePhotos: true,
    includeCharts: true
  })
  
  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includePersonal: true,
    includeAcademic: true,
    includeAttendance: true,
    includeOrchestra: true,
    includeTheory: true,
    includeDocuments: false
  })
  
  // Email options state
  const [emailOptions, setEmailOptions] = useState<EmailOptions>({
    recipients: [student.personalInfo.parentEmail || ''].filter(Boolean),
    subject: `דוח תלמיד: ${student.personalInfo.fullName}`,
    message: `שלום,\n\nמצורף דוח מפורט על התקדמות התלמיד/ה ${student.personalInfo.fullName}.\n\nבברכה,\nצוות הקונסרבטוריון`,
    attachments: [{ type: 'summary', format: 'pdf' }]
  })
  
  // Certificate options state
  const [certificateData, setCertificateData] = useState({
    title: 'הישג מצוין בלימודי מוזיקה',
    description: 'על התמדה ומצוינות בלימודים',
    signedBy: 'מנהל הקונסרבטוריון'
  })
  
  const emailRecipientsRef = useRef<HTMLTextAreaElement>(null)

  if (!isOpen) return null

  const handlePrint = async () => {
    setIsProcessing(true)
    try {
      await quickActionsService.printReport(student, printOptions)
      onClose()
    } catch (error) {
      console.error('Print failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = async () => {
    setIsProcessing(true)
    try {
      await quickActionsService.downloadExport(student, exportOptions)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEmail = async () => {
    if (emailOptions.recipients.length === 0) {
      toast.error('יש להוסיף לפחות נמען אחד')
      return
    }
    
    setIsProcessing(true)
    try {
      await quickActionsService.sendEmail(student, emailOptions)
      onClose()
    } catch (error) {
      console.error('Email failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateCertificate = async () => {
    setIsProcessing(true)
    try {
      const blob = await quickActionsService.generateCertificate(student, {
        ...certificateData,
        date: new Date()
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `תעודה_${student.personalInfo.fullName || 'תלמיד'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('תעודה נוצרה בהצלחה')
      onClose()
    } catch (error) {
      console.error('Certificate generation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const addEmailRecipient = () => {
    const newEmail = prompt('הזן כתובת אימייל:')
    if (newEmail && newEmail.includes('@')) {
      setEmailOptions(prev => ({
        ...prev,
        recipients: [...prev.recipients, newEmail]
      }))
    }
  }

  const removeEmailRecipient = (index: number) => {
    setEmailOptions(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }))
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        right: '0 !important',
        bottom: '0 !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        zIndex: 9999
      }}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">פעולות מהירות</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {/* Action Type Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveAction('print')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'print' 
                    ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Printer className="w-5 h-5" />
                הדפסה
              </button>
              
              <button
                onClick={() => setActiveAction('export')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'export' 
                    ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Download className="w-5 h-5" />
                ייצוא
              </button>
              
              <button
                onClick={() => setActiveAction('email')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'email' 
                    ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Mail className="w-5 h-5" />
                שליחת אימייל
              </button>
              
              <button
                onClick={() => setActiveAction('certificate')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                  activeAction === 'certificate' 
                    ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Award className="w-5 h-5" />
                תעודת הוקרה
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Print Options */}
            {activeAction === 'print' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">אפשרויות הדפסה</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">סוג דוח</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'summary', label: 'דוח קצר', icon: FileText },
                          { value: 'detailed', label: 'דוח מפורט', icon: BarChart3 },
                          { value: 'attendance', label: 'דוח נוכחות', icon: Calendar },
                          { value: 'schedule', label: 'לוח זמנים', icon: Calendar }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setPrintOptions(prev => ({ ...prev, type: option.value as any }))}
                            className={`flex items-center gap-2 p-3 border rounded-lg text-right transition-colors ${
                              printOptions.type === option.value
                                ? 'border-primary-300 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">כיוון עמוד</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setPrintOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            printOptions.orientation === 'portrait'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          לאורך
                        </button>
                        <button
                          onClick={() => setPrintOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            printOptions.orientation === 'landscape'
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          לרוחב
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={printOptions.includePhotos}
                          onChange={(e) => setPrintOptions(prev => ({ ...prev, includePhotos: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">כלול תמונות</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={printOptions.includeCharts}
                          onChange={(e) => setPrintOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">כלול גרפים וטבלאות</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            {activeAction === 'export' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">אפשרויות ייצוא</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">פורמט קובץ</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'pdf', label: 'PDF', icon: FileImage },
                          { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
                          { value: 'csv', label: 'CSV', icon: FileText },
                          { value: 'json', label: 'JSON', icon: FileText }
                        ].map(format => (
                          <button
                            key={format.value}
                            onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                            className={`flex items-center gap-2 p-3 border rounded-lg text-right transition-colors ${
                              exportOptions.format === format.value
                                ? 'border-primary-300 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <format.icon className="w-4 h-4" />
                            {format.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נתונים לייצוא</label>
                      <div className="space-y-2">
                        {[
                          { key: 'includePersonal', label: 'פרטים אישיים' },
                          { key: 'includeAcademic', label: 'פרטים אקדמיים' },
                          { key: 'includeAttendance', label: 'נתוני נוכחות' },
                          { key: 'includeOrchestra', label: 'תזמורות והרכבים' },
                          { key: 'includeTheory', label: 'שיעורי תיאוריה' },
                          { key: 'includeDocuments', label: 'רשימת מסמכים' }
                        ].map(option => (
                          <label key={option.key} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                              onChange={(e) => setExportOptions(prev => ({ 
                                ...prev, 
                                [option.key]: e.target.checked 
                              }))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Options */}
            {activeAction === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">שליחת אימייל</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נמענים</label>
                      <div className="space-y-2">
                        {emailOptions.recipients.map((email, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 flex-1">{email}</span>
                            <button
                              onClick={() => removeEmailRecipient(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addEmailRecipient}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          הוסף נמען
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">נושא</label>
                      <input
                        type="text"
                        value={emailOptions.subject}
                        onChange={(e) => setEmailOptions(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">הודעה</label>
                      <textarea
                        value={emailOptions.message}
                        onChange={(e) => setEmailOptions(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">קבצים מצורפים</label>
                      <div className="space-y-2">
                        {emailOptions.attachments?.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 flex-1">
                              {attachment.type === 'summary' ? 'דוח קצר' : 
                               attachment.type === 'detailed' ? 'דוח מפורט' : 'תעודה'} 
                              ({attachment.format.toUpperCase()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Options */}
            {activeAction === 'certificate' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">תעודת הוקרה</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">כותרת התעודה</label>
                      <input
                        type="text"
                        value={certificateData.title}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">תיאור ההישג</label>
                      <textarea
                        value={certificateData.description}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">חתימה</label>
                      <input
                        type="text"
                        value={certificateData.signedBy}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, signedBy: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <strong>תצוגה מקדימה:</strong>
                          <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-center">
                            <div className="font-bold text-lg">תעודת הוקרה</div>
                            <div className="mt-2">מוענקת בזאת לתלמיד/ה:</div>
                            <div className="font-bold text-xl text-blue-600">{student.personalInfo.fullName}</div>
                            <div className="mt-2">{certificateData.title}</div>
                            <div className="text-sm text-gray-600">{certificateData.description}</div>
                            <div className="mt-2 text-sm">חתימה: {certificateData.signedBy}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-600" />
            <span>תלמיד: {student.personalInfo.fullName}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            
            <button
              onClick={() => {
                switch (activeAction) {
                  case 'print':
                    handlePrint()
                    break
                  case 'export':
                    handleExport()
                    break
                  case 'email':
                    handleEmail()
                    break
                  case 'certificate':
                    handleGenerateCertificate()
                    break
                }
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  {activeAction === 'print' && <Printer className="w-4 h-4" />}
                  {activeAction === 'export' && <Download className="w-4 h-4" />}
                  {activeAction === 'email' && <Send className="w-4 h-4" />}
                  {activeAction === 'certificate' && <Award className="w-4 h-4" />}
                  
                  {activeAction === 'print' && 'הדפס'}
                  {activeAction === 'export' && 'ייצא'}
                  {activeAction === 'email' && 'שלח'}
                  {activeAction === 'certificate' && 'צור תעודה'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickActionsModal
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Edit, Trash2, Download, Upload, Plus,
  User, Calendar, Music, FileText, Award, Clock,
  CheckCircle, XCircle, AlertCircle, Star, BookOpen,
  Users, File, Loader, ChevronRight
} from 'lucide-react'
import Card from '../components/ui/Card'
import Table from '../components/ui/Table'
import StatsCard from '../components/ui/StatsCard'
import ConfirmationModal from '../components/ui/ConfirmationModal'
import { useBagrut } from '../hooks/useBagrut'
import apiService from '../services/apiService'
import type { Bagrut, Presentation, ProgramPiece } from '../types/bagrut.types'

interface TabProps {
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  badge?: number
}

const Tab: React.FC<TabProps> = ({ label, icon, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center px-4 py-3 border-b-2 transition-all
      ${isActive 
        ? 'border-primary-600 text-primary-600 bg-primary-50' 
        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
      }
    `}
  >
    {icon}
    <span className="mr-2 font-medium">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="mr-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
        {badge}
      </span>
    )}
  </button>
)

export default function BagrutDetails() {
  const { bagrutId } = useParams<{ bagrutId: string }>()
  const navigate = useNavigate()
  const { 
    bagrut, 
    loading, 
    error, 
    fetchBagrutById,
    deleteBagrut,
    completeBagrut,
    calculateFinalGrade,
    uploadDocument,
    removeDocument,
    downloadDocument
  } = useBagrut()

  const [activeTab, setActiveTab] = useState('overview')
  const [student, setStudent] = useState<any>(null)
  const [teacher, setTeacher] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [teacherSignature, setTeacherSignature] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)

  useEffect(() => {
    if (bagrutId) {
      loadBagrutDetails()
    }
  }, [bagrutId])

  const loadBagrutDetails = async () => {
    if (!bagrutId) return

    try {
      await fetchBagrutById(bagrutId)
    } catch (err) {
      console.error('Error loading bagrut:', err)
    }
  }

  useEffect(() => {
    if (bagrut) {
      loadAdditionalData()
    }
  }, [bagrut])

  const loadAdditionalData = async () => {
    if (!bagrut) return

    try {
      const [studentData, teacherData] = await Promise.all([
        apiService.students.getStudentById(bagrut.studentId),
        apiService.teachers.getTeacherById(bagrut.teacherId)
      ])
      
      setStudent(studentData)
      setTeacher(teacherData)
    } catch (err) {
      console.error('Error loading additional data:', err)
    }
  }

  const handleDelete = async () => {
    if (!bagrutId) return

    const success = await deleteBagrut(bagrutId)
    if (success) {
      navigate('/bagruts')
    }
    setShowDeleteModal(false)
  }

  const handleComplete = async () => {
    if (!bagrutId || !teacherSignature.trim()) return

    const success = await completeBagrut(bagrutId, teacherSignature)
    if (success) {
      await loadBagrutDetails()
      setShowCompleteModal(false)
      setTeacherSignature('')
    }
  }

  const handleCalculateGrade = async () => {
    if (!bagrutId) return

    const success = await calculateFinalGrade(bagrutId)
    if (success) {
      await loadBagrutDetails()
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !bagrutId) return

    setUploadingDocument(true)
    try {
      const category = prompt('בחר קטגוריה: תעודה, תכנית, הקלטה, מכתב המלצה, אחר')
      const description = prompt('תיאור המסמך (אופציונלי)')
      
      if (category) {
        const success = await uploadDocument(bagrutId, file, category, description || undefined)
        if (success) {
          await loadBagrutDetails()
        }
      }
    } catch (err) {
      console.error('Error uploading document:', err)
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDownload = async (documentId: string, fileName: string) => {
    if (!bagrutId) return

    const blob = await downloadDocument(bagrutId, documentId)
    if (blob) {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    if (!bagrutId || !window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return

    const success = await removeDocument(bagrutId, documentId)
    if (success) {
      await loadBagrutDetails()
    }
  }

  const handleExportPDF = async () => {
    if (!bagrutId) return

    try {
      const response = await fetch(`/api/bagrut/${bagrutId}/export/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bagrut-${student?.personalInfo?.fullName || bagrutId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting PDF:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <div className="text-gray-600">טוען פרטי בגרות...</div>
        </div>
      </div>
    )
  }

  if (error || !bagrut) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת הבגרות</h3>
        <p className="text-gray-600 mb-4">{error || 'בגרות לא נמצאה'}</p>
        <button
          onClick={() => navigate('/bagruts')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור לרשימת בגרויות
        </button>
      </div>
    )
  }

  // Calculate progress
  const presentationsCompleted = bagrut.presentations?.filter(p => p.isCompleted).length || 0
  const totalPresentations = 4
  const magenCompleted = bagrut.magenBagrut?.isCompleted ? 1 : 0
  const programPieces = bagrut.program?.length || 0
  const documentsCount = bagrut.documents?.length || 0

  const overallProgress = Math.round(
    ((presentationsCompleted + magenCompleted) / (totalPresentations + 1)) * 100
  )

  // Status color
  const getStatusColor = () => {
    if (bagrut.isCompleted) return 'green'
    if (overallProgress >= 50) return 'orange'
    return 'red'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bagruts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                בגרות - {student?.personalInfo?.fullName || 'טוען...'}
              </h1>
              {bagrut.isCompleted ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  הושלם
                </span>
              ) : (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  בתהליך
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                מורה: {teacher?.personalInfo?.fullName || 'טוען...'}
              </span>
              {bagrut.conservatoryName && (
                <span className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {bagrut.conservatoryName}
                </span>
              )}
              {bagrut.testDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(bagrut.testDate).toLocaleDateString('he-IL')}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!bagrut.isCompleted && (
            <>
              <button
                onClick={handleCalculateGrade}
                className="flex items-center px-3 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                <Award className="w-4 h-4 ml-1" />
                חשב ציון
              </button>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="flex items-center px-3 py-2 text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 ml-1" />
                השלם בגרות
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/bagruts/${bagrutId}/edit`)}
            className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 ml-1" />
            ערוך
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center px-3 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Download className="w-4 h-4 ml-1" />
            ייצא PDF
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-3 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 ml-1" />
            מחק
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="התקדמות כללית"
          value={`${overallProgress}%`}
          subtitle="השלמת משימות"
          icon={<Clock />}
          color={getStatusColor()}
        />
        <StatsCard
          title="מצגות"
          value={`${presentationsCompleted}/${totalPresentations}`}
          subtitle="מצגות שהושלמו"
          icon={<BookOpen />}
          color={presentationsCompleted === totalPresentations ? 'green' : 'orange'}
        />
        <StatsCard
          title="תכנית"
          value={programPieces.toString()}
          subtitle="יצירות בתכנית"
          icon={<Music />}
          color="blue"
        />
        <StatsCard
          title="מסמכים"
          value={documentsCount.toString()}
          subtitle="מסמכים מצורפים"
          icon={<FileText />}
          color="purple"
        />
        <StatsCard
          title="ציון סופי"
          value={bagrut.finalGrade?.toString() || '-'}
          subtitle={bagrut.finalGradeLevel || 'טרם חושב'}
          icon={<Award />}
          color={bagrut.finalGrade && bagrut.finalGrade >= 90 ? 'green' : 'gray'}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <Tab
              label="סקירה כללית"
              icon={<FileText className="w-4 h-4" />}
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <Tab
              label="תכנית"
              icon={<Music className="w-4 h-4" />}
              isActive={activeTab === 'program'}
              onClick={() => setActiveTab('program')}
              badge={programPieces}
            />
            <Tab
              label="מצגות"
              icon={<BookOpen className="w-4 h-4" />}
              isActive={activeTab === 'presentations'}
              onClick={() => setActiveTab('presentations')}
              badge={presentationsCompleted}
            />
            <Tab
              label="מגן בגרות"
              icon={<Star className="w-4 h-4" />}
              isActive={activeTab === 'magen'}
              onClick={() => setActiveTab('magen')}
            />
            <Tab
              label="ציונים"
              icon={<Award className="w-4 h-4" />}
              isActive={activeTab === 'grading'}
              onClick={() => setActiveTab('grading')}
            />
            <Tab
              label="מסמכים"
              icon={<File className="w-4 h-4" />}
              isActive={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              badge={documentsCount}
            />
            <Tab
              label="מלווים"
              icon={<Users className="w-4 h-4" />}
              isActive={activeTab === 'accompanists'}
              onClick={() => setActiveTab('accompanists')}
              badge={bagrut.accompaniment?.accompanists?.length || 0}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי התלמיד</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">שם:</span>
                    <span className="font-medium">{student?.personalInfo?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">טלפון:</span>
                    <span className="font-medium" dir="ltr">{student?.personalInfo?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">כיתה:</span>
                    <span className="font-medium">{student?.academicInfo?.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">כלי ראשי:</span>
                    <span className="font-medium">
                      {student?.academicInfo?.instrumentProgress?.find((i: any) => i.isPrimary)?.instrumentName}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פרטי בגרות</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">מורה מנחה:</span>
                    <span className="font-medium">{teacher?.personalInfo?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">קונסרבטוריון:</span>
                    <span className="font-medium">{bagrut.conservatoryName || 'לא צוין'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">תאריך מבחן:</span>
                    <span className="font-medium">
                      {bagrut.testDate ? new Date(bagrut.testDate).toLocaleDateString('he-IL') : 'לא נקבע'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">סטטוס:</span>
                    <span className={`font-medium ${bagrut.isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                      {bagrut.isCompleted ? 'הושלם' : 'בתהליך'}
                    </span>
                  </div>
                </div>
              </Card>

              {bagrut.notes && (
                <Card className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">הערות</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{bagrut.notes}</p>
                </Card>
              )}
            </div>
          )}

          {/* Program Tab */}
          {activeTab === 'program' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">תכנית הביצוע</h3>
                <button
                  onClick={() => navigate(`/bagruts/${bagrutId}/edit?tab=program`)}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף יצירה
                </button>
              </div>
              
              {bagrut.program && bagrut.program.length > 0 ? (
                <Table
                  data={bagrut.program}
                  columns={[
                    { key: 'pieceNumber', header: 'מס׳', width: '60px' },
                    { key: 'composerName', header: 'מלחין' },
                    { key: 'pieceName', header: 'שם היצירה' },
                    { key: 'period', header: 'תקופה' },
                    { key: 'duration', header: 'משך' },
                    { key: 'notes', header: 'הערות' }
                  ]}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>אין יצירות בתכנית</p>
                </div>
              )}
            </div>
          )}

          {/* Presentations Tab */}
          {activeTab === 'presentations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">מצגות</h3>
              
              {bagrut.presentations?.map((presentation, index) => (
                <Card key={index} className={presentation.isCompleted ? 'bg-green-50' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">מצגת {presentation.presentationNumber}</h4>
                        {presentation.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-700 font-medium mb-1">{presentation.topic || 'לא צוין נושא'}</p>
                      {presentation.description && (
                        <p className="text-gray-600 text-sm mb-2">{presentation.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {presentation.presentationDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(presentation.presentationDate).toLocaleDateString('he-IL')}
                          </span>
                        )}
                        {presentation.duration && (
                          <span>משך: {presentation.duration}</span>
                        )}
                        {presentation.grade !== undefined && (
                          <span className="font-semibold text-primary-600">
                            ציון: {presentation.grade}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/bagruts/${bagrutId}/edit?tab=presentations&presentation=${index}`)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}

              {/* Magen Bagrut in presentations section */}
              <Card className={bagrut.magenBagrut?.isCompleted ? 'bg-green-50' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">מגן בגרות</h4>
                      {bagrut.magenBagrut?.isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      {bagrut.magenBagrut?.projectTitle || 'לא צוין נושא'}
                    </p>
                    {bagrut.magenBagrut?.projectType && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs mb-2">
                        {bagrut.magenBagrut.projectType}
                      </span>
                    )}
                    {bagrut.magenBagrut?.grade !== undefined && (
                      <div className="text-sm font-semibold text-primary-600">
                        ציון: {bagrut.magenBagrut.grade}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/bagruts/${bagrutId}/edit?tab=magen`)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Magen Bagrut Tab */}
          {activeTab === 'magen' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">מגן בגרות</h3>
              
              {bagrut.magenBagrut ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">סוג הפרויקט</label>
                      <p className="font-medium">{bagrut.magenBagrut.projectType || 'לא צוין'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">כותרת הפרויקט</label>
                      <p className="font-medium">{bagrut.magenBagrut.projectTitle || 'לא צוינה'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">תאריך הגשה</label>
                      <p className="font-medium">
                        {bagrut.magenBagrut.submissionDate 
                          ? new Date(bagrut.magenBagrut.submissionDate).toLocaleDateString('he-IL')
                          : 'לא נקבע'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ציון</label>
                      <p className="font-medium text-lg text-primary-600">
                        {bagrut.magenBagrut.grade || 'טרם ניתן'}
                      </p>
                    </div>
                  </div>
                  
                  {bagrut.magenBagrut.projectDescription && (
                    <div>
                      <label className="text-sm text-gray-600">תיאור הפרויקט</label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                        {bagrut.magenBagrut.projectDescription}
                      </p>
                    </div>
                  )}
                  
                  {bagrut.magenBagrut.evaluatorNotes && (
                    <div>
                      <label className="text-sm text-gray-600">הערות המעריך</label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                        {bagrut.magenBagrut.evaluatorNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>לא הוזנו פרטי מגן בגרות</p>
                </div>
              )}
            </Card>
          )}

          {/* Grading Tab */}
          {activeTab === 'grading' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">פירוט ציונים</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ציון ביצוע</span>
                      <span className="text-xl font-semibold">
                        {bagrut.gradingDetails?.performanceGrade || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ממוצע מצגות</span>
                      <span className="text-xl font-semibold">
                        {bagrut.gradingDetails?.presentationsAverage || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ציון מגן בגרות</span>
                      <span className="text-xl font-semibold">
                        {bagrut.gradingDetails?.magenBagrutGrade || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">הערכת מורה</span>
                      <span className="text-xl font-semibold">
                        {bagrut.gradingDetails?.teacherEvaluation || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ציון חבר שופטים</span>
                      <span className="text-xl font-semibold">
                        {bagrut.gradingDetails?.juryGrade || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center p-4 bg-primary-50 rounded-lg">
                      <span className="text-lg font-semibold text-gray-700">ציון סופי</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-primary-600">
                          {bagrut.finalGrade || '-'}
                        </span>
                        {bagrut.finalGradeLevel && (
                          <div className="text-sm text-gray-600 mt-1">{bagrut.finalGradeLevel}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {bagrut.gradingDetails?.notes && (
                    <div className="pt-4">
                      <label className="text-sm text-gray-600">הערות</label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                        {bagrut.gradingDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">מסמכים</h3>
                <label className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                  <Upload className="w-4 h-4 ml-1" />
                  העלה מסמך
                  <input
                    type="file"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploadingDocument}
                  />
                </label>
              </div>

              {uploadingDocument && (
                <div className="text-center py-4">
                  <Loader className="w-6 h-6 animate-spin mx-auto text-primary-600" />
                  <p className="text-sm text-gray-600 mt-2">מעלה מסמך...</p>
                </div>
              )}
              
              {bagrut.documents && bagrut.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bagrut.documents.map((doc) => (
                    <Card key={doc._id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <File className="w-8 h-8 text-gray-400 mb-2" />
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{doc.fileName}</h4>
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mb-2">
                            {doc.category}
                          </span>
                          {doc.description && (
                            <p className="text-xs text-gray-600">{doc.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(doc.uploadDate).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDocumentDownload(doc._id!, doc.fileName)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="הורד"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDocumentDelete(doc._id!)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>אין מסמכים מצורפים</p>
                </div>
              )}
            </div>
          )}

          {/* Accompanists Tab */}
          {activeTab === 'accompanists' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">מלווים</h3>
                <button
                  onClick={() => navigate(`/bagruts/${bagrutId}/edit?tab=accompanists`)}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף מלווה
                </button>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-gray-600">סוג ליווי: </span>
                <span className="font-medium">{bagrut.accompaniment?.type || 'לא צוין'}</span>
              </div>

              {bagrut.accompaniment?.accompanists && bagrut.accompaniment.accompanists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bagrut.accompaniment.accompanists.map((accompanist, index) => (
                    <Card key={index}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{accompanist.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">כלי: {accompanist.instrument}</p>
                          {accompanist.phone && (
                            <p className="text-sm text-gray-600" dir="ltr">{accompanist.phone}</p>
                          )}
                          {accompanist.email && (
                            <p className="text-sm text-gray-600">{accompanist.email}</p>
                          )}
                        </div>
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p>לא הוגדרו מלווים</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="מחיקת בגרות"
        message={`האם אתה בטוח שברצונך למחוק את הבגרות של ${student?.personalInfo?.fullName}? פעולה זו לא ניתנת לביטול.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
      />

      {/* Complete Bagrut Modal */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        title="השלמת בגרות"
        message="האם אתה בטוח שברצונך להשלים את הבגרות? לאחר ההשלמה לא ניתן יהיה לערוך את הנתונים."
        confirmText="השלם בגרות"
        cancelText="ביטול"
        onConfirm={handleComplete}
        onCancel={() => setShowCompleteModal(false)}
        variant="primary"
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            חתימת המורה
          </label>
          <input
            type="text"
            value={teacherSignature}
            onChange={(e) => setTeacherSignature(e.target.value)}
            placeholder="הכנס את שמך המלא כחתימה"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </ConfirmationModal>
    </div>
  )
}
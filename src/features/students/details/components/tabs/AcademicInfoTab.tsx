/**
 * Academic Info Tab Component
 * 
 * Displays student academic information including instrument progress,
 * teacher assignments, academic performance, and educational details.
 */

import { useState, useMemo } from 'react'
import { GraduationCap, Music, User, TrendingUp, School, BookOpen, Award, Target, Star, Clock, Trophy, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import { StudentDetails } from '../../types'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AcademicInfoTabProps {
  student: StudentDetails
  studentId: string
}

// Hebrew stage definitions
const HEBREW_STAGES = {
  1: { name: "א'", description: 'שלב התחלתי' },
  2: { name: "ב'", description: 'שלב בסיסי' },
  3: { name: "ג'", description: 'שלב בינוני נמוך' },
  4: { name: "ד'", description: 'שלב בינוני' },
  5: { name: "ה'", description: 'שלב בינוני גבוה' },
  6: { name: "ו'", description: 'שלב מתקדם' },
  7: { name: "ז'", description: 'שלב מתקדם גבוה' },
  8: { name: "ח'", description: 'שלב מוכשר' }
}

// Achievement definitions
const ACHIEVEMENTS = {
  practiceHours: {
    bronze: { threshold: 50, name: 'מתרגל ברונזה', icon: '🥉' },
    silver: { threshold: 100, name: 'מתרגל כסף', icon: '🥈' },
    gold: { threshold: 200, name: 'מתרגל זהב', icon: '🥇' }
  },
  stageProgress: {
    fastLearner: { name: 'לומד מהיר', icon: '⚡' },
    consistent: { name: 'עקבי', icon: '📈' },
    dedicated: { name: 'מסור', icon: '💪' }
  },
  performance: {
    soloist: { name: 'סולן', icon: '🎤' },
    ensemble: { name: 'נגן אנסמבל', icon: '🎼' },
    composer: { name: 'מלחין', icon: '✍️' }
  }
}

// Bagrut requirements
const BAGRUT_REQUIREMENTS = {
  practical: {
    name: 'בחינה מעשית',
    stages: [5, 6], // Must reach stage ה' or ו'
    description: 'ביצוע יצירות ברמה נדרשת'
  },
  theory: {
    name: 'תיאוריית המוזיקה',
    minScore: 70,
    description: 'ציון מינימלי 70 בתיאוריה'
  },
  solfege: {
    name: 'סולפז\'',
    minScore: 70,
    description: 'ציון מינימלי 70 בסולפז\''
  },
  listening: {
    name: 'האזנה מנותחת',
    minScore: 65,
    description: 'ציון מינימלי 65 בהאזנה'
  }
}

const AcademicInfoTab: React.FC<AcademicInfoTabProps> = ({ student, studentId }) => {
  const { academicInfo, teacherAssignments } = student

  const InfoSection: React.FC<{ 
    title: string; 
    icon: React.ComponentType<any>; 
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0 ml-4">{label}</span>
      <span className="text-sm text-gray-900 text-right min-w-0 flex-1">
        {value || 'לא צוין'}
      </span>
    </div>
  )

  // Progress bar component with enhanced styling
  const ProgressBar: React.FC<{ current: number; target: number; label: string; color?: string }> = ({ 
    current, 
    target, 
    label,
    color = 'primary'
  }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
    const colorClasses = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
      success: 'bg-gradient-to-r from-success-500 to-success-600',
      warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
      info: 'bg-gradient-to-r from-blue-500 to-blue-600'
    }
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{current}</span>
            <span className="text-xs text-gray-500">/ {target}</span>
            <span className="text-xs font-medium text-primary-600">{Math.round(percentage)}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Skills overview chart data
  const skillsChartData = useMemo(() => {
    if (!academicInfo.instrumentProgress?.[0]?.skillAssessments) return null
    
    const primaryInstrument = academicInfo.instrumentProgress.find(i => i.isPrimary) || academicInfo.instrumentProgress[0]
    const skills = primaryInstrument.skillAssessments
    
    return {
      labels: ['טכניקה', 'מוזיקליות', 'קצב', 'צליל', 'ביצוע'],
      datasets: [{
        data: [skills.technique, skills.musicality, skills.rhythm, skills.pitch, skills.performance],
        backgroundColor: [
          '#6366f1', // primary
          '#10b981', // success
          '#f59e0b', // warning
          '#3b82f6', // blue
          '#8b5cf6'  // purple
        ],
        borderWidth: 0,
        cutout: '65%',
      }]
    }
  }, [academicInfo.instrumentProgress])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}/10`
        }
      }
    }
  }

  // Skill assessment component
  const SkillBadge: React.FC<{ skill: string; level: number }> = ({ skill, level }) => {
    const getColor = (level: number) => {
      if (level >= 8) return 'bg-green-100 text-green-800'
      if (level >= 6) return 'bg-yellow-100 text-yellow-800'
      if (level >= 4) return 'bg-orange-100 text-orange-800'
      return 'bg-red-100 text-red-800'
    }

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor(level)}`}>
        {skill}: {level}/10
      </div>
    )
  }

  // Hebrew Stage Component
  const HebrewStageIndicator: React.FC<{ current: number; target: number; instrumentName: string }> = ({ 
    current, 
    target, 
    instrumentName 
  }) => {
    const currentStage = HEBREW_STAGES[current as keyof typeof HEBREW_STAGES]
    const targetStage = HEBREW_STAGES[target as keyof typeof HEBREW_STAGES]
    
    return (
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">{instrumentName}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">יעד:</span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm font-bold">
              {targetStage?.name || target}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-indigo-600">{currentStage?.name || current}</span>
            <span className="text-sm text-gray-600">{currentStage?.description}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-4 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>שלב {current}</span>
            <span>{Math.round((current / target) * 100)}%</span>
            <span>יעד: שלב {target}</span>
          </div>
        </div>
      </div>
    )
  }

  // Practice Hours Component
  const PracticeHoursTracker: React.FC<{ hours: number; instrumentName: string }> = ({ hours, instrumentName }) => {
    const getAchievement = (hours: number) => {
      if (hours >= ACHIEVEMENTS.practiceHours.gold.threshold) return ACHIEVEMENTS.practiceHours.gold
      if (hours >= ACHIEVEMENTS.practiceHours.silver.threshold) return ACHIEVEMENTS.practiceHours.silver
      if (hours >= ACHIEVEMENTS.practiceHours.bronze.threshold) return ACHIEVEMENTS.practiceHours.bronze
      return null
    }
    
    const achievement = getAchievement(hours)
    const nextThreshold = achievement === ACHIEVEMENTS.practiceHours.gold ? null : 
      achievement === ACHIEVEMENTS.practiceHours.silver ? ACHIEVEMENTS.practiceHours.gold.threshold :
      achievement === ACHIEVEMENTS.practiceHours.bronze ? ACHIEVEMENTS.practiceHours.silver.threshold :
      ACHIEVEMENTS.practiceHours.bronze.threshold
    
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">שעות תרגול - {instrumentName}</h4>
          </div>
          {achievement && (
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-green-200">
              <span className="text-lg">{achievement.icon}</span>
              <span className="text-sm font-medium text-green-800">{achievement.name}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-green-600">{hours}</span>
            <span className="text-sm text-gray-600">שעות השבוע</span>
          </div>
          
          {nextThreshold && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">עד לדרגה הבאה</span>
                <span className="font-medium">{nextThreshold - hours} שעות</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((hours / nextThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Achievement Badge Component
  const AchievementBadge: React.FC<{ achievement: any; earned: boolean }> = ({ achievement, earned }) => (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
      earned 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm' 
        : 'bg-gray-100 text-gray-500 border border-gray-300'
    }`}>
      <span className={`text-lg ${earned ? '' : 'grayscale opacity-50'}`}>{achievement.icon}</span>
      <span>{achievement.name}</span>
    </div>
  )

  // Bagrut Requirements Tracker
  const BagrutRequirementsTracker: React.FC = () => {
    const theoreticalKnowledge = academicInfo.theoreticalKnowledge
    const primaryInstrument = academicInfo.instrumentProgress?.find(i => i.isPrimary)
    
    const requirements = [
      {
        ...BAGRUT_REQUIREMENTS.practical,
        status: primaryInstrument && BAGRUT_REQUIREMENTS.practical.stages.includes(primaryInstrument.currentStage) ? 'completed' : 'pending',
        currentValue: primaryInstrument?.currentStage || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.theory,
        status: theoreticalKnowledge?.musicTheory >= BAGRUT_REQUIREMENTS.theory.minScore ? 'completed' : 'pending',
        currentValue: theoreticalKnowledge?.musicTheory || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.solfege,
        status: theoreticalKnowledge?.solfege >= BAGRUT_REQUIREMENTS.solfege.minScore ? 'completed' : 'pending',
        currentValue: theoreticalKnowledge?.solfege || 0
      },
      {
        ...BAGRUT_REQUIREMENTS.listening,
        status: 'pending', // This would come from a listening test score
        currentValue: 0
      }
    ]
    
    const completedCount = requirements.filter(r => r.status === 'completed').length
    const progressPercentage = (completedCount / requirements.length) * 100
    
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">מעקב דרישות בגרות</h3>
              <p className="text-sm text-gray-600">התקדמות לעמידה בדרישות הבגרות במוזיקה</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completedCount}/4</div>
            <div className="text-xs text-gray-500">דרישות הושלמו</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((req, index) => (
              <div key={index} className="bg-white/60 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{req.name}</h4>
                  {req.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                {req.currentValue > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">ציון נוכחי: </span>
                    <span className={req.status === 'completed' ? 'text-green-600' : 'text-orange-600'}>
                      {req.currentValue}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">מידע אקדמי</h2>
        <p className="text-gray-600 mt-1">התקדמות, כישורים והישגים אקדמיים</p>
      </div>

      {/* Hebrew Stage Progress Cards */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {academicInfo.instrumentProgress.map((instrument, index) => (
            <HebrewStageIndicator
              key={index}
              current={instrument.currentStage}
              target={instrument.targetStage}
              instrumentName={instrument.instrumentName}
            />
          ))}
        </div>
      )}

      {/* Practice Hours Tracking */}
      {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {academicInfo.instrumentProgress.map((instrument, index) => (
            <PracticeHoursTracker
              key={index}
              hours={Math.floor(Math.random() * 250) + 50} // Mock data - would come from API
              instrumentName={instrument.instrumentName}
            />
          ))}
        </div>
      )}

      {/* Achievement Badges Display */}
      <InfoSection title="הישגים ואותות הכרה" icon={Award}>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">תרגול והתמדה</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.bronze} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.silver} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.practiceHours.gold} earned={false} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">התקדמות אקדמית</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.fastLearner} earned={false} />
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.consistent} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.stageProgress.dedicated} earned={true} />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">ביצוע ויצירה</h4>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge achievement={ACHIEVEMENTS.performance.soloist} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.performance.ensemble} earned={true} />
              <AchievementBadge achievement={ACHIEVEMENTS.performance.composer} earned={false} />
            </div>
          </div>
        </div>
      </InfoSection>

      {/* Bagrut Requirements Tracker */}
      <BagrutRequirementsTracker />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Skills Overview Chart */}
        {skillsChartData && (
          <InfoSection title="סקירת כישורים" icon={TrendingUp}>
            <div className="h-64">
              <Doughnut data={skillsChartData} options={chartOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                הערכת כישורים עבור {academicInfo.instrumentProgress?.find(i => i.isPrimary)?.instrumentName || 'הכלי הראשי'}
              </p>
            </div>
          </InfoSection>
        )}

        {/* Academic Stats Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 gap-6">
          {/* General Academic Info */}
          <InfoSection title="מידע כללי" icon={School}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="כיתה" value={academicInfo.class} />
              <InfoRow label="בית ספר" value={academicInfo.schoolName} />
              <InfoRow 
                label="סגנון למידה" 
                value={academicInfo.learningStyle ? {
                  'visual': 'ויזואלי',
                  'auditory': 'אודיטורי',
                  'kinesthetic': 'קינסתטי',
                  'mixed': 'מעורב'
                }[academicInfo.learningStyle] : 'לא צוין'} 
              />
              {academicInfo.specialNeeds && (
                <InfoRow label="צרכים מיוחדים" value={academicInfo.specialNeeds} />
              )}
            </div>
          </InfoSection>
        </div>
      </div>

      {/* Theoretical Knowledge Section */}
      {academicInfo.theoreticalKnowledge && (
        <InfoSection title="ידע תיאורטי" icon={BookOpen}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.solfege}
              target={10}
              label="סולפז'"
              color="success"
            />
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.musicTheory}
              target={10}
              label="תיאוריית המוזיקה"
              color="primary"
            />
            <ProgressBar
              current={academicInfo.theoreticalKnowledge.musicHistory}
              target={10}
              label="היסטוריה של המוזיקה"
              color="info"
            />
          </div>
        </InfoSection>
      )}

      {/* Instrument Progress */}
      <InfoSection title="התקדמות בכלי נגינה" icon={Music}>
        {academicInfo.instrumentProgress && academicInfo.instrumentProgress.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {academicInfo.instrumentProgress.map((instrument, index) => (
              <div key={index} className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500 rounded-lg">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {instrument.instrumentName}
                        {instrument.isPrimary && (
                          <span className="bg-primary-200 text-primary-800 text-xs px-2 py-1 rounded-full font-medium">
                            כלי ראשי
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        החל ב-{new Date(instrument.startDate).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/80 rounded-lg p-4 border border-primary-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">שלב נוכחי</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary-600">
                          {HEBREW_STAGES[instrument.currentStage as keyof typeof HEBREW_STAGES]?.name || instrument.currentStage}
                        </span>
                        <span className="text-xs text-gray-500">יעד:</span>
                        <span className="text-lg font-semibold text-gray-700">
                          {HEBREW_STAGES[instrument.targetStage as keyof typeof HEBREW_STAGES]?.name || instrument.targetStage}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 text-center">
                      {HEBREW_STAGES[instrument.currentStage as keyof typeof HEBREW_STAGES]?.description || 'שלב ' + instrument.currentStage}
                    </div>
                  </div>
                  
                  <ProgressBar 
                    current={instrument.currentStage} 
                    target={instrument.targetStage} 
                    label="התקדמות ליעד"
                    color="primary"
                  />

                  {instrument.progressNotes && (
                    <div className="bg-white/60 rounded-lg p-3 border border-primary-200">
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 mb-1">הערות התקדמות</p>
                          <p className="text-sm text-gray-700">{instrument.progressNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {instrument.skillAssessments && (
                    <div className="bg-white/60 rounded-lg p-3 border border-primary-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-primary-600" />
                        <h5 className="text-sm font-semibold text-gray-800">הערכת כישורים</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SkillBadge skill="טכניקה" level={instrument.skillAssessments.technique} />
                        <SkillBadge skill="מוזיקליות" level={instrument.skillAssessments.musicality} />
                        <SkillBadge skill="קצב" level={instrument.skillAssessments.rhythm} />
                        <SkillBadge skill="צליל" level={instrument.skillAssessments.pitch} />
                        <SkillBadge skill="ביצוע" level={instrument.skillAssessments.performance} />
                      </div>
                      
                      {/* Practice Hours for this instrument */}
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-gray-700">שעות תרגול השבוע</span>
                          </div>
                          <span className="text-lg font-bold text-primary-600">
                            {Math.floor(Math.random() * 10) + 5} שעות
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">לא הוגדרו כלי נגינה</p>
            <p className="text-sm text-gray-500 mt-1">כלי הנגינה יוצגו כאן לאחר השיבוץ</p>
          </div>
        )}
      </InfoSection>

      {/* Teacher Assignments */}
      <InfoSection title="מורים ושיעורים" icon={User}>
        {teacherAssignments && teacherAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teacherAssignments.map((assignment, index) => (
              <div 
                key={index} 
                className={`rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-lg ${
                  assignment.isActive 
                    ? 'border-success-200 bg-gradient-to-br from-success-50 to-success-100' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      assignment.isActive ? 'bg-success-500' : 'bg-gray-400'
                    }`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{assignment.teacherName}</h4>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    assignment.isActive 
                      ? 'bg-success-200 text-success-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {assignment.isActive ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <InfoRow label="כלי" value={assignment.instrumentName} />
                    <InfoRow 
                      label="סוג שיעור" 
                      value={{
                        'individual': 'אישי',
                        'group': 'קבוצתי',
                        'masterclass': 'מאסטרקלאס'
                      }[assignment.lessonType] || assignment.lessonType} 
                    />
                    <InfoRow label="שעות שבועיות" value={`${assignment.weeklyHours} שעות`} />
                    <InfoRow 
                      label="תאריך השיבוץ" 
                      value={new Date(assignment.assignmentDate).toLocaleDateString('he-IL')} 
                    />
                  </div>
                  
                  {assignment.notes && (
                    <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm font-medium text-gray-800 mb-1">הערות</p>
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-600">לא הוגדרו מורים</p>
            <p className="text-sm text-gray-500 mt-1">מורים ושיעורים יוצגו כאן לאחר השיבוץ</p>
          </div>
        )}
      </InfoSection>
    </div>
  )
}

export default AcademicInfoTab
export type OrchestraTabType = 'personal' | 'members' | 'schedule'

export interface OrchestraTab {
  id: OrchestraTabType
  label: string
  component: React.ComponentType
}

export interface Orchestra {
  _id: string
  name: string
  type: string
  conductorId: string
  memberIds: string[]
  rehearsalIds: string[]
  schoolYearId: string
  location: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface OrchestraMember {
  _id: string
  personalInfo: {
    fullName: string
    phone?: string
    studentEmail?: string
  }
  academicInfo: {
    class?: string
    instrumentProgress?: {
      instrumentName: string
      currentStage: string
      isPrimary: boolean
    }[]
  }
  primaryInstrument?: string
  isActive: boolean
}

export interface OrchestraConductor {
  _id: string
  personalInfo: {
    fullName: string
    email?: string
    phone?: string
  }
  professionalInfo?: {
    instrument?: string
  }
  roles?: string[]
  isActive: boolean
}

export interface OrchestraRehearsal {
  _id: string
  groupId: string
  date: string
  startTime: string
  endTime: string
  location: string
  attendance?: {
    present: string[]
    absent: string[]
  }
  notes?: string
}

export interface OrchestraDetailsProps {
  orchestraId: string
  orchestra: Orchestra | null
  isLoading: boolean
  onUpdate?: () => void
}

export interface OrchestraTabProps extends OrchestraDetailsProps {
  activeTab: OrchestraTabType
}
/**
 * Teacher Profile Type Definitions
 * Matches the exact backend schema for teacher data
 */

export interface TeacherPersonalInfo {
  fullName: string
  email: string
  phone: string
  address: string
  birthDate?: string
}

export interface TeacherProfessionalInfo {
  instrument?: string
  isActive?: boolean
}

export interface TeacherTeaching {
  studentIds?: string[]
  schedule?: any[]
  timeBlocks?: any[]
}

export interface TeacherConducting {
  orchestraIds?: string[]
  ensemblesIds?: string[]
}

export interface TeacherProfile {
  _id: string
  personalInfo: TeacherPersonalInfo
  roles: string[]
  professionalInfo?: TeacherProfessionalInfo
  teaching?: TeacherTeaching
  conducting?: TeacherConducting
  ensemblesIds?: string[]
  schoolYears?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TeacherProfileUpdateData {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  birthDate?: string
  personalInfo?: Partial<TeacherPersonalInfo>
}
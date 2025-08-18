/**
 * Form Validation Utilities for Conservatory Management System
 * 
 * Comprehensive validation functions with Hebrew error messages
 * and backend requirements compliance
 */

// Backend constants for validation
export const VALID_CLASSES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'אחר']
export const VALID_INSTRUMENTS = [
  'חלילית', 'חליל צד', 'אבוב', 'בסון', 'סקסופון', 'קלרינט',
  'חצוצרה', 'קרן יער', 'טרומבון', 'טובה/בריטון', 'שירה',
  'כינור', 'ויולה', "צ'לו", 'קונטרבס', 'פסנתר', 'גיטרה', 'גיטרה בס', 'תופים'
]
export const VALID_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
export const VALID_DURATIONS = [30, 45, 60]
export const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8]
export const VALID_ROLES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה', 'מגמה']
export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']

// Validation patterns
export const VALIDATION_PATTERNS = {
  phone: /^05\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  hebrewText: /^[\u0590-\u05FF\s\d\-\(\)\.]+$/,
  bagrutId: /^\d{9}$/,
  age: /^([0-9]|[1-9][0-9])$/
} as const

// Hebrew error messages
export const ERROR_MESSAGES = {
  required: 'שדה חובה',
  invalidPhone: 'מספר טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות',
  invalidEmail: 'כתובת אימייל לא תקינה',
  invalidTime: 'זמן חייב להיות בפורמט HH:MM',
  invalidAge: 'גיל חייב להיות בין 0 ל-99',
  invalidBagrutId: 'מספר זהות בגרות חייב להכיל 9 ספרות',
  minLength: (min: number) => `חייב להכיל לפחות ${min} תווים`,
  maxLength: (max: number) => `לא יכול להכיל יותר מ-${max} תווים`,
  invalidSelection: 'בחירה לא תקינה',
  passwordMismatch: 'סיסמאות לא תואמות',
  weakPassword: 'סיסמה חייבת להכיל לפחות 6 תווים',
  duplicateEntry: 'ערך כבר קיים במערכת',
  futureDate: 'תאריך חייב להיות בעתיד',
  pastDate: 'תאריך חייב להיות בעבר',
  invalidRange: 'טווח לא תקין'
} as const

// Field name mapping to Hebrew
export const FIELD_LABELS = {
  fullName: 'שם מלא',
  phone: 'מספר טלפון',
  email: 'כתובת אימייל',
  age: 'גיל',
  address: 'כתובת',
  parentName: 'שם הורה',
  parentPhone: 'טלפון הורה',
  parentEmail: 'אימייל הורה',
  studentEmail: 'אימייל תלמיד',
  class: 'כיתה',
  instrument: 'כלי נגינה',
  stage: 'שלב',
  day: 'יום',
  time: 'שעה',
  duration: 'משך זמן',
  location: 'מיקום',
  bagrutId: 'מספר זהות בגרות',
  password: 'סיסמה',
  confirmPassword: 'אישור סיסמה',
  role: 'תפקיד',
  testStatus: 'סטטוס בחינה',
  notes: 'הערות'
} as const

// Validation rule interface
export interface ValidationRule {
  required?: boolean
  pattern?: RegExp
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  custom?: (value: any) => boolean
  message?: string
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  message?: string
  field?: string
}

/**
 * Validate a single field value
 */
export const validateField = (
  value: any,
  rules: ValidationRule,
  fieldName?: string
): ValidationResult => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.required,
      field: fieldName
    }
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return { isValid: true }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return {
      isValid: false,
      message: rules.message || getPatternErrorMessage(rules.pattern),
      field: fieldName
    }
  }

  // Length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.minLength(rules.minLength),
      field: fieldName
    }
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return {
      isValid: false,
      message: rules.message || ERROR_MESSAGES.maxLength(rules.maxLength),
      field: fieldName
    }
  }

  // Numeric range validation
  if (rules.min !== undefined && Number(value) < rules.min) {
    return {
      isValid: false,
      message: rules.message || `ערך חייב להיות לפחות ${rules.min}`,
      field: fieldName
    }
  }

  if (rules.max !== undefined && Number(value) > rules.max) {
    return {
      isValid: false,
      message: rules.message || `ערך לא יכול להיות יותר מ-${rules.max}`,
      field: fieldName
    }
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    return {
      isValid: false,
      message: rules.message || 'ערך לא תקין',
      field: fieldName
    }
  }

  return { isValid: true }
}

/**
 * Get error message for common patterns
 */
const getPatternErrorMessage = (pattern: RegExp): string => {
  switch (pattern) {
    case VALIDATION_PATTERNS.phone:
      return ERROR_MESSAGES.invalidPhone
    case VALIDATION_PATTERNS.email:
      return ERROR_MESSAGES.invalidEmail
    case VALIDATION_PATTERNS.time:
      return ERROR_MESSAGES.invalidTime
    case VALIDATION_PATTERNS.age:
      return ERROR_MESSAGES.invalidAge
    case VALIDATION_PATTERNS.bagrutId:
      return ERROR_MESSAGES.invalidBagrutId
    default:
      return 'פורמט לא תקין'
  }
}

/**
 * Validate multiple fields
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  let isValid = true

  Object.keys(rules).forEach(fieldName => {
    const result = validateField(data[fieldName], rules[fieldName], fieldName)
    if (!result.isValid) {
      errors[fieldName] = result.message || 'שגיאה בשדה'
      isValid = false
    }
  })

  return { isValid, errors }
}

/**
 * Validate phone number specifically
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  return validateField(phone, {
    required: true,
    pattern: VALIDATION_PATTERNS.phone,
    message: ERROR_MESSAGES.invalidPhone
  })
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  return validateField(email, {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
    message: ERROR_MESSAGES.invalidEmail
  })
}

/**
 * Validate time format
 */
export const validateTime = (time: string): ValidationResult => {
  return validateField(time, {
    required: true,
    pattern: VALIDATION_PATTERNS.time,
    message: ERROR_MESSAGES.invalidTime
  })
}

/**
 * Validate age
 */
export const validateAge = (age: string | number): ValidationResult => {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  return validateField(ageNum, {
    required: true,
    min: 0,
    max: 99,
    message: ERROR_MESSAGES.invalidAge
  })
}

/**
 * Validate selection from predefined options
 */
export const validateSelection = (
  value: string,
  options: readonly string[],
  fieldName?: string
): ValidationResult => {
  if (!options.includes(value)) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.invalidSelection,
      field: fieldName
    }
  }
  return { isValid: true }
}

/**
 * Real-time validation hook helper
 */
export const useValidation = () => {
  const validateFieldRealTime = (
    value: any,
    rules: ValidationRule,
    fieldName?: string
  ): ValidationResult => {
    // For real-time validation, we might want to be less strict
    // For example, don't show "required" error until blur or submit
    const modifiedRules = { ...rules }
    
    // Don't show required error during typing
    if (value === '' || value === undefined || value === null) {
      delete modifiedRules.required
    }

    return validateField(value, modifiedRules, fieldName)
  }

  return { validateFieldRealTime }
}

/**
 * Format error message with field name
 */
export const formatErrorMessage = (fieldName: string, message: string): string => {
  const hebrewFieldName = FIELD_LABELS[fieldName as keyof typeof FIELD_LABELS] || fieldName
  return `${hebrewFieldName}: ${message}`
}

/**
 * Backend error mapping utility
 */
export const mapBackendErrors = (
  backendErrors: Record<string, string>
): Record<string, string> => {
  const mappedErrors: Record<string, string> = {}
  
  Object.entries(backendErrors).forEach(([field, message]) => {
    // Map backend field names to frontend field names if needed
    const frontendField = mapBackendFieldName(field)
    const hebrewMessage = translateErrorMessage(message)
    mappedErrors[frontendField] = hebrewMessage
  })
  
  return mappedErrors
}

/**
 * Map backend field names to frontend field names
 */
const mapBackendFieldName = (backendField: string): string => {
  const fieldMapping: Record<string, string> = {
    'personalInfo.fullName': 'fullName',
    'personalInfo.phone': 'phone',
    'personalInfo.email': 'email',
    'academicInfo.class': 'class',
    'professionalInfo.instrument': 'instrument'
  }
  
  return fieldMapping[backendField] || backendField
}

/**
 * Translate backend error messages to Hebrew
 */
const translateErrorMessage = (message: string): string => {
  // Common backend error patterns to Hebrew translations
  const translations: Record<string, string> = {
    'required': ERROR_MESSAGES.required,
    'invalid email': ERROR_MESSAGES.invalidEmail,
    'invalid phone': ERROR_MESSAGES.invalidPhone,
    'invalid format': 'פורמט לא תקין',
    'already exists': ERROR_MESSAGES.duplicateEntry,
    'not found': 'לא נמצא במערכת',
    'unauthorized': 'אין הרשאה',
    'forbidden': 'פעולה אסורה'
  }
  
  const lowerMessage = message.toLowerCase()
  for (const [pattern, translation] of Object.entries(translations)) {
    if (lowerMessage.includes(pattern)) {
      return translation
    }
  }
  
  return message // Return original if no translation found
}
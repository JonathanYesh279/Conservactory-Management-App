/**
 * Theory Lesson Enrollment Service
 * 
 * Handles bidirectional enrollment operations between students and theory lessons
 * with proper validation, error handling, and data consistency
 */

import apiClient from './apiClient'

class TheoryEnrollmentService {
  /**
   * Enroll student in theory lesson with comprehensive validation
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} options - Enrollment options
   * @returns {Promise<Object>} Enrollment result
   */
  async enrollStudent(lessonId, studentId, options = {}) {
    const transaction = options.transaction || null
    
    try {
      console.log(`🎓 Starting enrollment: Student ${studentId} → Theory Lesson ${lessonId}`)
      
      // Step 1: Pre-enrollment validation
      const validationResult = await this.validateEnrollment(lessonId, studentId)
      
      if (!validationResult.isValid) {
        throw new Error(`Enrollment validation failed: ${validationResult.errors.join(', ')}`)
      }
      
      // Step 2: Handle waitlist if lesson is full
      if (validationResult.enrollmentStatus === 'waitlist') {
        return await this.addToWaitlist(lessonId, studentId, transaction)
      }
      
      // Step 3: Execute bidirectional enrollment
      const enrollmentData = {
        studentId,
        enrolledAt: new Date().toISOString(),
        status: 'active',
        enrollmentMethod: options.method || 'manual',
        performedBy: options.performedBy || 'system'
      }
      
      // Update theory lesson (canonical source)
      const updatedLesson = await this.addStudentToLesson(lessonId, enrollmentData, transaction)
      
      // Update student document (metadata tracking)  
      const studentEnrollmentData = {
        lessonId,
        enrolledAt: enrollmentData.enrolledAt,
        status: 'active',
        performance: {
          attendanceRate: 0,
          lastAttended: null,
          grade: null,
          notes: ''
        },
        auditTrail: [{
          action: 'enrolled',
          performedAt: enrollmentData.enrolledAt,
          performedBy: enrollmentData.performedBy,
          reason: options.reason || 'Manual enrollment'
        }]
      }
      
      await this.addLessonToStudent(studentId, studentEnrollmentData, transaction)
      
      console.log(`✅ Successfully enrolled student ${studentId} in theory lesson ${lessonId}`)
      
      return {
        success: true,
        status: 'enrolled',
        lesson: updatedLesson,
        enrollmentData: studentEnrollmentData
      }
      
    } catch (error) {
      console.error('❌ Enrollment failed:', error)
      
      // Attempt rollback if partial updates occurred
      await this.rollbackEnrollment(lessonId, studentId, transaction)
      
      throw new Error(`Failed to enroll student: ${error.message}`)
    }
  }

  /**
   * Remove student from theory lesson
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} options - Unenrollment options
   * @returns {Promise<Object>} Unenrollment result
   */
  async unenrollStudent(lessonId, studentId, options = {}) {
    const transaction = options.transaction || null
    
    try {
      console.log(`🎓 Starting unenrollment: Student ${studentId} ← Theory Lesson ${lessonId}`)
      
      // Validate current enrollment
      const currentEnrollment = await this.getStudentEnrollment(lessonId, studentId)
      
      if (!currentEnrollment) {
        throw new Error('Student is not enrolled in this theory lesson')
      }
      
      // Remove from theory lesson
      await this.removeStudentFromLesson(lessonId, studentId, transaction)
      
      // Update student document
      await this.removeLessonFromStudent(studentId, lessonId, options.reason || 'Manual unenrollment', transaction)
      
      // Process waitlist if applicable
      await this.processWaitlist(lessonId, transaction)
      
      console.log(`✅ Successfully unenrolled student ${studentId} from theory lesson ${lessonId}`)
      
      return {
        success: true,
        status: 'unenrolled',
        processedWaitlist: true
      }
      
    } catch (error) {
      console.error('❌ Unenrollment failed:', error)
      throw new Error(`Failed to unenroll student: ${error.message}`)
    }
  }

  /**
   * Validate enrollment eligibility
   * @param {string} lessonId - Theory lesson ID  
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Validation result
   */
  async validateEnrollment(lessonId, studentId) {
    try {
      // Get lesson and student data
      const [lesson, student] = await Promise.all([
        apiClient.get(`/theory/${lessonId}`),
        apiClient.get(`/student/${studentId}`)
      ])
      
      const errors = []
      let enrollmentStatus = 'enrolled'
      
      // Check if lesson exists and is active
      if (!lesson || !lesson.isActive) {
        errors.push('Theory lesson not found or inactive')
      }
      
      // Check if student exists and is active
      if (!student || !student.isActive) {
        errors.push('Student not found or inactive')
      }
      
      if (errors.length > 0) {
        return { isValid: false, errors, enrollmentStatus: null }
      }
      
      // Check duplicate enrollment
      const existingEnrollment = lesson.enrollment?.enrolledStudents?.find(
        enrollment => enrollment.studentId === studentId && 
        ['active', 'waitlist'].includes(enrollment.status)
      )
      
      if (existingEnrollment) {
        errors.push(`Student already ${existingEnrollment.status} in this lesson`)
      }
      
      // Check capacity
      const currentEnrollment = lesson.capacity?.currentEnrollment || 0
      const maxStudents = lesson.capacity?.maxStudents || Infinity
      
      if (currentEnrollment >= maxStudents) {
        if (lesson.capacity?.waitlistEnabled) {
          enrollmentStatus = 'waitlist'
        } else {
          errors.push('Theory lesson is full and waitlist is disabled')
        }
      }
      
      // Check academic requirements
      const academicValidation = this.validateAcademicRequirements(student, lesson)
      if (!academicValidation.isValid) {
        errors.push(...academicValidation.errors)
      }
      
      // Check schedule conflicts
      const scheduleValidation = await this.validateScheduleConflicts(student, lesson)
      if (!scheduleValidation.isValid) {
        errors.push(...scheduleValidation.errors)
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        enrollmentStatus,
        lesson,
        student
      }
      
    } catch (error) {
      console.error('Validation error:', error)
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        enrollmentStatus: null
      }
    }
  }

  /**
   * Validate academic requirements
   * @param {Object} student - Student document
   * @param {Object} lesson - Theory lesson document
   * @returns {Object} Validation result
   */
  validateAcademicRequirements(student, lesson) {
    const errors = []
    const requirements = lesson.academicRequirements || {}
    
    // Check grade eligibility
    const studentGrade = student.academicInfo?.class
    const targetGrades = requirements.targetGrades || []
    
    if (targetGrades.length > 0 && !targetGrades.includes(studentGrade)) {
      errors.push(`Student grade "${studentGrade}" not eligible (requires: ${targetGrades.join(', ')})`)
    }
    
    // Check level compatibility
    const studentLevel = student.academicInfo?.theoryLevel || 'beginner'
    const lessonLevel = requirements.level
    
    if (lessonLevel && lessonLevel !== 'all' && lessonLevel !== studentLevel) {
      errors.push(`Student level "${studentLevel}" not compatible with lesson level "${lessonLevel}"`)
    }
    
    // Check prerequisites
    const prerequisites = requirements.prerequisites || []
    const completedCourses = student.academicInfo?.completedCourses || []
    
    const missingPrereqs = prerequisites.filter(req => !completedCourses.includes(req))
    if (missingPrereqs.length > 0) {
      errors.push(`Missing prerequisites: ${missingPrereqs.join(', ')}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate schedule conflicts
   * @param {Object} student - Student document
   * @param {Object} lesson - Theory lesson document
   * @returns {Promise<Object>} Validation result
   */
  async validateScheduleConflicts(student, lesson) {
    try {
      const errors = []
      const newSchedule = lesson.schedule
      
      // Get student's current theory lesson enrollments
      const studentTheoryLessons = student.enrollments?.theoryLessons || []
      
      for (const enrollment of studentTheoryLessons) {
        if (enrollment.status !== 'active') continue
        
        // Get existing lesson details
        const existingLesson = await apiClient.get(`/theory/${enrollment.lessonId}`)
        
        if (this.hasScheduleConflict(existingLesson.schedule, newSchedule)) {
          errors.push(`Schedule conflicts with "${existingLesson.title || existingLesson.category}"`)
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
      
    } catch (error) {
      return {
        isValid: false,
        errors: [`Schedule validation failed: ${error.message}`]
      }
    }
  }

  /**
   * Check if two schedules conflict
   * @param {Object} schedule1 - First schedule
   * @param {Object} schedule2 - Second schedule
   * @returns {boolean} True if schedules conflict
   */
  hasScheduleConflict(schedule1, schedule2) {
    // Check day of week conflict
    if (schedule1.dayOfWeek !== schedule2.dayOfWeek) {
      return false
    }
    
    // Convert times to minutes for easier comparison
    const getMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }
    
    const start1 = getMinutes(schedule1.startTime)
    const end1 = getMinutes(schedule1.endTime)
    const start2 = getMinutes(schedule2.startTime)
    const end2 = getMinutes(schedule2.endTime)
    
    // Check time overlap
    return (start1 < end2 && start2 < end1)
  }

  /**
   * Add student to theory lesson document
   * @param {string} lessonId - Theory lesson ID
   * @param {Object} enrollmentData - Enrollment data
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Updated lesson
   */
  async addStudentToLesson(lessonId, enrollmentData, transaction = null) {
    const updateData = {
      $push: {
        'enrollment.enrolledStudents': enrollmentData
      },
      $inc: {
        'capacity.currentEnrollment': 1
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
    
    return await apiClient.patch(`/theory/${lessonId}`, updateData, { transaction })
  }

  /**
   * Add lesson to student document
   * @param {string} studentId - Student ID
   * @param {Object} enrollmentData - Enrollment data
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Updated student
   */
  async addLessonToStudent(studentId, enrollmentData, transaction = null) {
    const updateData = {
      $push: {
        'enrollments.theoryLessons': enrollmentData
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
    
    return await apiClient.patch(`/student/${studentId}`, updateData, { transaction })
  }

  /**
   * Remove student from theory lesson document
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Updated lesson
   */
  async removeStudentFromLesson(lessonId, studentId, transaction = null) {
    const updateData = {
      $pull: {
        'enrollment.enrolledStudents': { studentId }
      },
      $inc: {
        'capacity.currentEnrollment': -1
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
    
    return await apiClient.patch(`/theory/${lessonId}`, updateData, { transaction })
  }

  /**
   * Remove lesson from student document  
   * @param {string} studentId - Student ID
   * @param {string} lessonId - Theory lesson ID
   * @param {string} reason - Unenrollment reason
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Updated student
   */
  async removeLessonFromStudent(studentId, lessonId, reason, transaction = null) {
    // First mark as inactive, then add audit trail
    const updateData = {
      $set: {
        'enrollments.theoryLessons.$[elem].status': 'inactive',
        'enrollments.theoryLessons.$[elem].unenrolledAt': new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      $push: {
        'enrollments.theoryLessons.$[elem].auditTrail': {
          action: 'unenrolled',
          performedAt: new Date().toISOString(),
          reason
        }
      }
    }
    
    const arrayFilters = [{ 'elem.lessonId': lessonId, 'elem.status': 'active' }]
    
    return await apiClient.patch(`/student/${studentId}`, updateData, { 
      transaction,
      arrayFilters 
    })
  }

  /**
   * Get student's enrollment status in a theory lesson
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object|null>} Enrollment data or null
   */
  async getStudentEnrollment(lessonId, studentId) {
    try {
      const lesson = await apiClient.get(`/theory/${lessonId}`)
      
      return lesson.enrollment?.enrolledStudents?.find(
        enrollment => enrollment.studentId === studentId && 
        ['active', 'waitlist'].includes(enrollment.status)
      ) || null
      
    } catch (error) {
      console.error('Error getting enrollment status:', error)
      return null
    }
  }

  /**
   * Add student to waitlist
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Waitlist result
   */
  async addToWaitlist(lessonId, studentId, transaction = null) {
    const waitlistData = {
      studentId,
      queuedAt: new Date().toISOString(),
      position: await this.getNextWaitlistPosition(lessonId)
    }
    
    const updateData = {
      $push: {
        'enrollment.waitlist': waitlistData
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
    
    await apiClient.patch(`/theory/${lessonId}`, updateData, { transaction })
    
    return {
      success: true,
      status: 'waitlist',
      position: waitlistData.position
    }
  }

  /**
   * Process waitlist when a spot becomes available
   * @param {string} lessonId - Theory lesson ID
   * @param {Object} transaction - Database transaction
   * @returns {Promise<boolean>} True if waitlist was processed
   */
  async processWaitlist(lessonId, transaction = null) {
    try {
      const lesson = await apiClient.get(`/theory/${lessonId}`)
      const waitlist = lesson.enrollment?.waitlist || []
      
      if (waitlist.length === 0) {
        return false
      }
      
      // Get next student from waitlist (first in queue)
      const nextStudent = waitlist.sort((a, b) => 
        new Date(a.queuedAt) - new Date(b.queuedAt)
      )[0]
      
      // Auto-enroll from waitlist
      await this.enrollFromWaitlist(lessonId, nextStudent.studentId, transaction)
      
      return true
      
    } catch (error) {
      console.error('Error processing waitlist:', error)
      return false
    }
  }

  /**
   * Enroll student from waitlist to active enrollment
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Object>} Enrollment result
   */
  async enrollFromWaitlist(lessonId, studentId, transaction = null) {
    // Remove from waitlist and add to enrolled students
    const enrollmentData = {
      studentId,
      enrolledAt: new Date().toISOString(),
      status: 'active',
      enrollmentMethod: 'waitlist_promotion',
      performedBy: 'system'
    }
    
    const updateData = {
      $pull: {
        'enrollment.waitlist': { studentId }
      },
      $push: {
        'enrollment.enrolledStudents': enrollmentData
      },
      $inc: {
        'capacity.currentEnrollment': 1
      },
      $set: {
        updatedAt: new Date().toISOString()
      }
    }
    
    await apiClient.patch(`/theory/${lessonId}`, updateData, { transaction })
    
    // Update student document
    const studentUpdateData = {
      $set: {
        'enrollments.theoryLessons.$[elem].status': 'active',
        'enrollments.theoryLessons.$[elem].enrolledAt': enrollmentData.enrolledAt,
        updatedAt: new Date().toISOString()
      },
      $push: {
        'enrollments.theoryLessons.$[elem].auditTrail': {
          action: 'promoted_from_waitlist',
          performedAt: enrollmentData.enrolledAt,
          performedBy: 'system',
          reason: 'Space became available'
        }
      }
    }
    
    const arrayFilters = [{ 'elem.lessonId': lessonId, 'elem.status': 'waitlist' }]
    
    await apiClient.patch(`/student/${studentId}`, studentUpdateData, { 
      transaction,
      arrayFilters 
    })
    
    console.log(`🎯 Promoted student ${studentId} from waitlist to active enrollment`)
    
    return enrollmentData
  }

  /**
   * Get next waitlist position
   * @param {string} lessonId - Theory lesson ID
   * @returns {Promise<number>} Next position number
   */
  async getNextWaitlistPosition(lessonId) {
    try {
      const lesson = await apiClient.get(`/theory/${lessonId}`)
      const waitlist = lesson.enrollment?.waitlist || []
      
      return waitlist.length + 1
      
    } catch (error) {
      console.error('Error getting waitlist position:', error)
      return 1
    }
  }

  /**
   * Rollback partial enrollment on failure
   * @param {string} lessonId - Theory lesson ID
   * @param {string} studentId - Student ID
   * @param {Object} transaction - Database transaction
   * @returns {Promise<void>}
   */
  async rollbackEnrollment(lessonId, studentId, transaction = null) {
    try {
      console.log(`🔄 Rolling back enrollment for student ${studentId}`)
      
      // Remove from theory lesson if added
      await this.removeStudentFromLesson(lessonId, studentId, transaction)
        .catch(err => console.log('Lesson rollback not needed:', err.message))
      
      // Remove from student if added
      await this.removeLessonFromStudent(studentId, lessonId, 'Rollback due to error', transaction)
        .catch(err => console.log('Student rollback not needed:', err.message))
      
      console.log(`✅ Rollback completed for student ${studentId}`)
      
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      // Log critical error for manual intervention
      await this.logCriticalError('rollback_failed', { lessonId, studentId, error: error.message })
    }
  }

  /**
   * Log critical errors for monitoring
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {Promise<void>}
   */
  async logCriticalError(errorType, context) {
    try {
      await apiClient.post('/system/errors', {
        type: errorType,
        context,
        timestamp: new Date().toISOString(),
        severity: 'critical',
        service: 'theory-enrollment'
      })
    } catch (logError) {
      console.error('Failed to log critical error:', logError)
    }
  }
}

export default new TheoryEnrollmentService()
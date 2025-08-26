/**
 * Real Backend API Service
 * 
 * Connects to the actual backend API with proper authentication
 * and uses exact data structures as specified in the backend schema.
 * 
 * Base URL: http://localhost:3001/api (backend port)
 * Authentication: Bearer token in Authorization header
 */

// Configuration
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000, // 30 seconds
};

/**
 * HTTP Client with authentication and error handling
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.token = this.getStoredToken();
  }

  /**
   * Get stored authentication token
   */
  getStoredToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  /**
   * Remove authentication token
   */
  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }

  /**
   * Get default headers for API requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Build full URL for endpoint
   */
  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle different error types
      if (response.status === 401) {
        this.removeToken();
        throw new Error('Authentication failed. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Insufficient permissions.');
      } else if (response.status === 404) {
        throw new Error('Resource not found.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return data;
  }

  /**
   * Make HTTP request
   */
  async request(method, endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method,
      headers: this.getHeaders(),
      ...options,
    };

    // Add body for POST/PUT/PATCH/DELETE requests
    if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      config.body = JSON.stringify(options.body);
    }

    try {
      console.log(`🌐 API Request: ${method} ${url}`, options.body ? { body: options.body } : '');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      config.signal = controller.signal;
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      const result = await this.handleResponse(response);
      console.log(`✅ API Response: ${method} ${endpoint}`, { status: response.status, data: result });
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      console.error(`❌ API Error: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, params = {}) {
    // Build query string from params
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    });
    
    // Construct the final endpoint with query string
    const queryString = searchParams.toString();
    const finalEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request('GET', finalEndpoint);
  }

  async post(endpoint, body = {}) {
    return this.request('POST', endpoint, { body });
  }

  async put(endpoint, body = {}) {
    return this.request('PUT', endpoint, { body });
  }

  async patch(endpoint, body = {}) {
    return this.request('PATCH', endpoint, { body });
  }

  async delete(endpoint, body = null) {
    return this.request('DELETE', endpoint, body ? { body } : {});
  }
}

// Create singleton instance
const apiClient = new ApiClient();

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      // Handle both old and new response formats from backend
      // Backend sends: { data: { accessToken, teacher }, success: true }
      const token = response.data?.accessToken || response.accessToken;
      const teacher = response.data?.teacher || response.teacher;
      
      if (token) {
        apiClient.setToken(token);
        // Update the token in the apiClient instance immediately
        apiClient.token = token;
      }
      
      return { token, teacher, success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      apiClient.removeToken();
    }
  },

  /**
   * Validate current token
   */
  async validateToken() {
    try {
      const response = await apiClient.get('/auth/validate');
      return response;
    } catch (error) {
      console.error('Token validation failed:', error);
      apiClient.removeToken();
      throw error;
    }
  },

  /**
   * Get current authentication status
   */
  isAuthenticated() {
    return !!apiClient.getStoredToken();
  }
};

/**
 * Student API Service
 * Uses exact backend schema: student.personalInfo.fullName, student.academicInfo.class, student.teacherAssignments
 */
export const studentService = {
  /**
   * Get all students with optional filters
   * @param {Object} filters - Filter options (including schoolYearId)
   * @returns {Promise<Array>} Array of students with corrected schema
   */
  async getStudents(filters = {}) {
    try {
      // Ensure schoolYearId is included if provided
      const params = { ...filters };
      
      const students = await apiClient.get('/student', params);
      
      // Process students to fix schema mismatch and add computed fields
      const processedStudents = Array.isArray(students) ? students.map(student => ({
        ...student,
        // Add computed fields for frontend compatibility
        primaryInstrument: student.academicInfo?.instrumentProgress?.find(
          progress => progress.isPrimary === true
        )?.instrumentName || null,
        
        primaryStage: student.academicInfo?.instrumentProgress?.find(
          progress => progress.isPrimary === true
        )?.currentStage || null,
        
        // Keep original data structure but add alias fields
        academicInfo: {
          ...student.academicInfo,
          instrumentProgress: student.academicInfo?.instrumentProgress?.map(progress => ({
            ...progress,
            // Add alias fields for backward compatibility
            instrument: progress.instrumentName, // Frontend expects 'instrument'
            stage: progress.currentStage        // Frontend expects 'stage'
          })) || []
        }
      })) : [];
      
      console.log(`📚 Retrieved ${processedStudents.length} students with processed schema`);
      
      return processedStudents;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Get single student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Student object with exact backend schema
   */
  async getStudent(studentId) {
    try {
      const student = await apiClient.get(`/student/${studentId}`);
      
      console.log(`👤 Retrieved student: ${student.personalInfo?.fullName}`);
      
      return student;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  /**
   * Create new student
   * @param {Object} studentData - Student data (handles both old and new schema)
   * @param {string} schoolYearId - Current school year ID
   * @returns {Promise<Object>} Created student
   */
  async createStudent(studentData, schoolYearId = null) {
    try {
      // Transform frontend data to match database schema
      const formattedData = {
        personalInfo: {
          fullName: studentData.personalInfo?.fullName || '',
          phone: studentData.personalInfo?.phone || '',
          age: studentData.personalInfo?.age || 0,
          address: studentData.personalInfo?.address || '',
          parentName: studentData.personalInfo?.parentName || '',
          parentPhone: studentData.personalInfo?.parentPhone || '',
          parentEmail: studentData.personalInfo?.parentEmail || '',
          studentEmail: studentData.personalInfo?.studentEmail || 'student@example.com'
        },
        academicInfo: {
          instrumentProgress: studentData.academicInfo?.instrumentProgress?.map(progress => ({
            instrumentName: progress.instrument || progress.instrumentName, // Use correct DB field
            currentStage: progress.stage || progress.currentStage || 1,     // Use correct DB field
            isPrimary: progress.isPrimary || false,
            tests: {
              stageTest: {
                status: "לא נבחן",
                lastTestDate: null,
                nextTestDate: null,
                notes: ""
              },
              technicalTest: {
                status: "לא נבחן", 
                lastTestDate: null,
                nextTestDate: null,
                notes: ""
              }
            }
          })) || [],
          class: studentData.academicInfo?.class || 'א'
        },
        enrollments: {
          orchestraIds: studentData.enrollments?.orchestraIds || [],
          ensembleIds: studentData.enrollments?.ensembleIds || [],
          theoryLessonIds: studentData.enrollments?.theoryLessonIds || [],
          schoolYears: studentData.enrollments?.schoolYears || []
        },
        teacherIds: studentData.teacherIds || [],
        teacherAssignments: studentData.teacherAssignments || [],
        isActive: studentData.isActive !== undefined ? studentData.isActive : true,
        schoolYearId: schoolYearId || studentData.schoolYearId
      };

      const student = await apiClient.post('/student', formattedData);
      
      console.log(`➕ Created student: ${student.personalInfo?.fullName}`);
      
      return student;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  },

  /**
   * Update existing student
   * @param {string} studentId - Student ID
   * @param {Object} studentData - Updated student data
   * @returns {Promise<Object>} Updated student
   */
  async updateStudent(studentId, studentData) {
    try {
      // Clean the data by removing fields that backend doesn't allow in updates
      const cleanedData = this.cleanStudentDataForUpdate(studentData);
      
      const student = await apiClient.put(`/student/${studentId}`, cleanedData);
      
      console.log(`✏️ Updated student: ${student.personalInfo?.fullName}`);
      
      return student;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  /**
   * Clean student data for update by removing fields that backend validation rejects
   * @param {Object} studentData - Raw student data
   * @returns {Object} Cleaned student data
   */
  cleanStudentDataForUpdate(studentData) {
    // Create a deep copy to avoid modifying the original data
    const cleanedData = JSON.parse(JSON.stringify(studentData));
    
    // Remove top-level fields that aren't allowed in updates
    delete cleanedData._id;
    delete cleanedData.createdAt;
    delete cleanedData.updatedAt;
    delete cleanedData.primaryInstrument;
    delete cleanedData.primaryStage;
    
    // Clean instrument progress array
    if (cleanedData.academicInfo?.instrumentProgress) {
      cleanedData.academicInfo.instrumentProgress = cleanedData.academicInfo.instrumentProgress.map(progress => {
        const cleanedProgress = { ...progress };
        
        // Remove computed/auto-generated fields
        delete cleanedProgress.lastStageUpdate;
        delete cleanedProgress.instrument; // This is derived from instrumentName
        delete cleanedProgress.stage; // This is derived from currentStage
        
        return cleanedProgress;
      });
    }
    
    console.log('🧹 Cleaned student data for update:', cleanedData);
    return cleanedData;
  },

  /**
   * Update student stage level quickly
   * @param {string} studentId - Student ID
   * @param {number} newStageLevel - New stage level (1-8)
   * @returns {Promise<Object>} Updated student
   */
  async updateStudentStageLevel(studentId, newStageLevel) {
    try {
      console.log(`🔄 Updating stage level for student ${studentId} to ${newStageLevel}`);
      
      // Use the new dedicated PATCH endpoint
      const result = await apiClient.patch(`/student/${studentId}/stage-level`, {
        stageLevel: newStageLevel
      });
      
      console.log(`🎵 Updated stage level to ${newStageLevel}`);
      return result;
    } catch (error) {
      console.error('Error updating student stage level:', error);
      throw error;
    }
  },

  /**
   * Delete student
   * @param {string} studentId - Student ID
   * @returns {Promise<void>}
   */
  async deleteStudent(studentId) {
    try {
      await apiClient.delete(`/student/${studentId}`);
      
      console.log(`🗑️ Deleted student: ${studentId}`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  /**
   * Get single student by ID (alias for getStudent)
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Student object with processed schema
   */
  async getStudentById(studentId) {
    try {
      const student = await this.getStudent(studentId);
      
      // Process student data similar to getStudents for consistency
      const processedStudent = {
        ...student,
        // Add computed fields for frontend compatibility
        primaryInstrument: student.academicInfo?.instrumentProgress?.find(
          progress => progress.isPrimary === true
        )?.instrumentName || null,
        
        primaryStage: student.academicInfo?.instrumentProgress?.find(
          progress => progress.isPrimary === true
        )?.currentStage || null,
        
        // Keep original data structure but add alias fields
        academicInfo: {
          ...student.academicInfo,
          instrumentProgress: student.academicInfo?.instrumentProgress?.map(progress => ({
            ...progress,
            // Add alias fields for backward compatibility
            instrument: progress.instrumentName, // Frontend expects 'instrument'
            stage: progress.currentStage        // Frontend expects 'stage'
          })) || []
        }
      };
      
      console.log(`👤 Retrieved and processed student by ID: ${processedStudent.personalInfo?.fullName}`);
      
      return processedStudent;
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      throw error;
    }
  }
};

/**
 * Teacher API Service  
 * Uses exact backend schema: teacher.personalInfo.fullName, teacher.teaching.studentIds
 */
export const teacherService = {
  /**
   * Get all teachers with optional filters
   * @param {Object} filters - Filter options (including schoolYearId)
   * @returns {Promise<Array>} Array of teachers with exact backend schema
   */
  async getTeachers(filters = {}) {
    try {
      // Ensure schoolYearId is included if provided
      const params = { ...filters };
      
      const teachers = await apiClient.get('/teacher', params);
      
      // Process teachers to match frontend expectations and add computed fields
      const processedTeachers = Array.isArray(teachers) ? teachers.map(teacher => ({
        ...teacher,
        // Add computed fields for easier frontend use
        primaryRole: teacher.roles?.[0] || 'לא מוגדר',
        allRoles: teacher.roles || [],
        studentCount: teacher.teaching?.studentIds?.length || 0,
        activeStudentIds: teacher.teaching?.studentIds || [],
        hasTimeBlocks: teacher.teaching?.timeBlocks?.length > 0,
        timeBlockCount: teacher.teaching?.timeBlocks?.length || 0,
        
        // Flatten active status (check both levels)
        isTeacherActive: teacher.isActive && teacher.professionalInfo?.isActive,
        
        // Add teaching availability summary
        availabilityDays: teacher.teaching?.timeBlocks?.map(block => block.day) || [],
        totalTeachingHours: teacher.teaching?.timeBlocks?.reduce((total, block) => 
          total + (block.totalDuration || 0), 0) || 0,
        
        // Orchestra/Ensemble assignments
        orchestraCount: teacher.conducting?.orchestraIds?.length || 0,
        ensembleCount: teacher.conducting?.ensemblesIds?.length || 0,
        
        // Legacy compatibility fields
        assignmentCount: teacher.teaching?.studentIds?.length || 0,
        activeStudents: teacher.teaching?.studentIds?.length || 0,
        isActive: teacher.isActive && teacher.professionalInfo?.isActive,
        primaryInstrument: teacher.professionalInfo?.instrument || 'לא הוגדר'
      })) : [];
      
      console.log(`👨‍🏫 Retrieved ${processedTeachers.length} teachers with processed data`);
      return processedTeachers;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  /**
   * Get single teacher by ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Teacher object with exact backend schema
   */
  async getTeacher(teacherId) {
    try {
      const response = await apiClient.get(`/teacher/${teacherId}`);
      
      console.log('🔍 Raw API Response for teacher:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      
      // Handle different response structures
      let teacher;
      if (response.data) {
        // Backend returns { data: teacher, success: true }
        teacher = response.data;
        console.log('📦 Extracted teacher from response.data:', teacher);
      } else if (response.teacher) {
        // Backend returns { teacher: teacher, success: true }
        teacher = response.teacher;
        console.log('📦 Extracted teacher from response.teacher:', teacher);
      } else {
        // Direct teacher object
        teacher = response;
        console.log('📦 Using direct response as teacher:', teacher);
      }
      
      console.log('📋 Teacher structure check:', {
        hasPersonalInfo: !!teacher.personalInfo,
        fullName: teacher.personalInfo?.fullName,
        hasRoles: !!teacher.roles,
        roles: teacher.roles,
        hasProfessionalInfo: !!teacher.professionalInfo,
        instrument: teacher.professionalInfo?.instrument,
        isActive: teacher.isActive
      });
      
      console.log(`👤 Retrieved teacher: ${teacher.personalInfo?.fullName}`);
      
      // Add the same computed fields for single teacher
      return {
        ...teacher,
        primaryRole: teacher.roles?.[0] || 'לא מוגדר',
        allRoles: teacher.roles || [],
        studentCount: teacher.teaching?.studentIds?.length || 0,
        activeStudentIds: teacher.teaching?.studentIds || [],
        hasTimeBlocks: teacher.teaching?.timeBlocks?.length > 0,
        timeBlockCount: teacher.teaching?.timeBlocks?.length || 0,
        isTeacherActive: teacher.isActive && teacher.professionalInfo?.isActive,
        availabilityDays: teacher.teaching?.timeBlocks?.map(block => block.day) || [],
        totalTeachingHours: teacher.teaching?.timeBlocks?.reduce((total, block) => 
          total + (block.totalDuration || 0), 0) || 0,
        orchestraCount: teacher.conducting?.orchestraIds?.length || 0,
        ensembleCount: teacher.conducting?.ensemblesIds?.length || 0
      };
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw error;
    }
  },

  /**
   * Get teacher lessons using new endpoint
   * @param {string} teacherId - Teacher ID
   * @param {Object} options - Query options (day, studentId)
   * @returns {Promise<Object>} Teacher lessons with metadata
   */
  async getTeacherLessons(teacherId, options = {}) {
    try {
      const response = await apiClient.get(`/teacher/${teacherId}/lessons`, options);
      
      console.log(`📅 Retrieved lessons for teacher ${teacherId}:`, response.lessons?.length || 0);
      
      // Response format: { success: true, data: { teacherId, lessons: [...], count, source } }
      return response.data || response;
    } catch (error) {
      console.error('Error fetching teacher lessons:', error);
      throw error;
    }
  },

  /**
   * Get teacher weekly schedule using new endpoint
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Weekly schedule organized by days
   */
  async getTeacherWeeklySchedule(teacherId) {
    try {
      const response = await apiClient.get(`/teacher/${teacherId}/weekly-schedule`);
      
      console.log(`📊 Retrieved weekly schedule for teacher ${teacherId}`);
      
      // Response format: { teacherId, schedule: { ראשון: [...], שני: [...], ... }, summary }
      return response.data || response;
    } catch (error) {
      console.error('Error fetching teacher weekly schedule:', error);
      throw error;
    }
  },

  /**
   * Get teacher schedule for specific day
   * @param {string} teacherId - Teacher ID
   * @param {string} day - Hebrew day name (ראשון, שני, etc.)
   * @returns {Promise<Array>} Lessons for the day
   */
  async getTeacherDaySchedule(teacherId, day) {
    try {
      const lessons = await apiClient.get(`/teacher/${teacherId}/day-schedule/${day}`);
      
      console.log(`📅 Retrieved ${day} schedule for teacher ${teacherId}:`, lessons?.length || 0);
      
      return Array.isArray(lessons) ? lessons : [];
    } catch (error) {
      console.error('Error fetching teacher day schedule:', error);
      throw error;
    }
  },

  /**
   * Get teacher lesson statistics
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Lesson statistics
   */
  async getTeacherLessonStats(teacherId) {
    try {
      const stats = await apiClient.get(`/teacher/${teacherId}/lesson-stats`);
      
      console.log(`📊 Retrieved lesson stats for teacher ${teacherId}`);
      
      return stats;
    } catch (error) {
      console.error('Error fetching teacher lesson stats:', error);
      throw error;
    }
  },

  /**
   * Create new teacher
   * @param {Object} teacherData - Teacher data with exact backend schema
   * @returns {Promise<Object>} Created teacher
   */
  async createTeacher(teacherData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        personalInfo: {
          fullName: teacherData.personalInfo?.fullName || '',
          phone: teacherData.personalInfo?.phone || '',
          email: teacherData.personalInfo?.email || '',
          address: teacherData.personalInfo?.address || ''
        },
        roles: teacherData.roles || ['מורה'],
        professionalInfo: {
          instrument: teacherData.professionalInfo?.instrument || '',
          isActive: teacherData.professionalInfo?.isActive !== undefined ? teacherData.professionalInfo.isActive : true
        },
        teaching: {
          studentIds: teacherData.teaching?.studentIds || [],
          schedule: teacherData.teaching?.schedule || [],
          timeBlocks: teacherData.teaching?.timeBlocks || []
        },
        conducting: {
          orchestraIds: teacherData.conducting?.orchestraIds || []
        },
        ensemblesIds: teacherData.ensemblesIds || [],
        schoolYears: teacherData.schoolYears || [],
        isActive: teacherData.isActive !== undefined ? teacherData.isActive : true
      };

      const teacher = await apiClient.post('/teacher', formattedData);
      
      console.log(`➕ Created teacher: ${teacher.personalInfo?.fullName}`);
      
      return teacher;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  /**
   * Alias for createTeacher - for modal compatibility
   * @param {Object} teacherData - Teacher data with exact backend schema
   * @returns {Promise<Object>} Created teacher
   */
  async addTeacher(teacherData) {
    return this.createTeacher(teacherData);
  },

  /**
   * Update existing teacher
   * @param {string} teacherId - Teacher ID
   * @param {Object} teacherData - Updated teacher data
   * @returns {Promise<Object>} Updated teacher
   */
  async updateTeacher(teacherId, teacherData) {
    try {
      const teacher = await apiClient.put(`/teacher/${teacherId}`, teacherData);
      
      console.log(`✏️ Updated teacher: ${teacher.personalInfo?.fullName}`);
      
      return teacher;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  /**
   * Delete teacher
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<void>}
   */
  async deleteTeacher(teacherId) {
    try {
      await apiClient.delete(`/teacher/${teacherId}`);
      
      console.log(`🗑️ Deleted teacher: ${teacherId}`);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  /**
   * Get teacher's time blocks (יום לימוד)
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Array>} Array of time blocks
   */
  async getTeacherTimeBlocks(teacherId) {
    try {
      const teacher = await this.getTeacher(teacherId);
      return teacher.teaching?.timeBlocks || [];
    } catch (error) {
      console.error('Error fetching teacher time blocks:', error);
      throw error;
    }
  },

  /**
   * Get teacher's students
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Array>} Array of students assigned to teacher
   */
  async getTeacherStudents(teacherId) {
    try {
      const teacher = await this.getTeacher(teacherId);
      const studentIds = teacher.teaching?.studentIds || [];
      
      if (studentIds.length === 0) {
        return [];
      }

      // Get full student data
      const students = await apiClient.get('/student', {
        ids: studentIds.join(',')
      });
      
      console.log(`👥 Retrieved ${students.length} students for teacher ${teacherId}`);
      return Array.isArray(students) ? students : [];
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      throw error;
    }
  },

  /**
   * Alias for getTeacher - for component compatibility
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Teacher object with exact backend schema
   */
  async getTeacherById(teacherId) {
    return this.getTeacher(teacherId);
  },

  /**
   * Add student to teacher
   * @param {string} teacherId - Teacher ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Updated teacher
   */
  async addStudentToTeacher(teacherId, studentId) {
    try {
      const result = await apiClient.post(`/teacher/${teacherId}/student/${studentId}`);
      console.log(`➕ Added student ${studentId} to teacher ${teacherId}`);
      return result;
    } catch (error) {
      console.error('Error adding student to teacher:', error);
      throw error;
    }
  },

  /**
   * Remove student from teacher
   * @param {string} teacherId - Teacher ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Updated teacher
   */
  async removeStudentFromTeacher(teacherId, studentId) {
    try {
      const result = await apiClient.delete(`/teacher/${teacherId}/student/${studentId}`);
      console.log(`➖ Removed student ${studentId} from teacher ${teacherId}`);
      return result;
    } catch (error) {
      console.error('Error removing student from teacher:', error);
      throw error;
    }
  }
};

/**
 * Theory Lessons API Service
 * Uses exact backend schema with Hebrew field names and proper data structure
 */
export const theoryService = {
  /**
   * Get all theory lessons with optional filters
   * @param {Object} filters - Filter options (including schoolYearId)
   * @returns {Promise<Array>} Array of theory lessons with exact backend schema
   */
  async getTheoryLessons(filters = {}) {
    try {
      // Ensure schoolYearId is included if provided
      const params = { ...filters };
      
      const lessons = await apiClient.get('/theory', params);
      
      console.log(`📖 Retrieved ${Array.isArray(lessons) ? lessons.length : 0} theory lessons`);
      
      return Array.isArray(lessons) ? lessons : [];
    } catch (error) {
      console.error('Error fetching theory lessons:', error);
      throw error;
    }
  },

  /**
   * Create new theory lesson
   * @param {Object} lessonData - Theory lesson data with exact backend schema
   * @returns {Promise<Object>} Created theory lesson
   */
  async createTheoryLesson(lessonData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        category: lessonData.category || 'תיאוריה כללית',
        title: lessonData.title || '',
        description: lessonData.description || '',
        teacherId: lessonData.teacherId || '',
        teacherName: lessonData.teacherName || '',
        date: lessonData.date || new Date().toISOString(),
        startTime: lessonData.startTime || '19:00',
        endTime: lessonData.endTime || '20:30',
        duration: lessonData.duration || 90,
        location: lessonData.location || 'חדר תיאוריה 1',
        maxStudents: lessonData.maxStudents || 15,
        studentIds: lessonData.studentIds || [],
        attendanceList: lessonData.attendanceList || [],
        schoolYearId: lessonData.schoolYearId || '',
        isActive: lessonData.isActive !== undefined ? lessonData.isActive : true
      };

      const lesson = await apiClient.post('/theory', formattedData);
      
      console.log(`➕ Created theory lesson: ${lesson.title}`);
      
      return lesson;
    } catch (error) {
      console.error('Error creating theory lesson:', error);
      throw error;
    }
  },

  /**
   * Update existing theory lesson
   * @param {string} lessonId - Theory lesson ID
   * @param {Object} lessonData - Updated theory lesson data
   * @returns {Promise<Object>} Updated theory lesson
   */
  async updateTheoryLesson(lessonId, lessonData) {
    try {
      const lesson = await apiClient.put(`/theory/${lessonId}`, lessonData);
      
      console.log(`✏️ Updated theory lesson: ${lesson.title}`);
      
      return lesson;
    } catch (error) {
      console.error('Error updating theory lesson:', error);
      throw error;
    }
  },

  /**
   * Delete theory lesson
   * @param {string} lessonId - Theory lesson ID
   * @returns {Promise<void>}
   */
  async deleteTheoryLesson(lessonId) {
    try {
      await apiClient.delete(`/theory/${lessonId}`);
      
      console.log(`🗑️ Deleted theory lesson: ${lessonId}`);
    } catch (error) {
      console.error('Error deleting theory lesson:', error);
      throw error;
    }
  }
};

/**
 * Orchestra API Service
 */
export const orchestraService = {
  /**
   * Get all orchestras
   * @param {Object} filters - Filter options (including schoolYearId)
   * @returns {Promise<Array>} Array of orchestras
   */
  async getOrchestras(filters = {}) {
    try {
      // Ensure schoolYearId is included if provided
      const params = { ...filters };
      
      const orchestras = await apiClient.get('/orchestra', params);
      
      // Process orchestras to add computed fields
      const processedOrchestras = Array.isArray(orchestras) ? orchestras.map(orchestra => ({
        ...orchestra,
        // Add computed fields for easier frontend use
        memberCount: orchestra.memberIds?.length || 0,
        rehearsalCount: orchestra.rehearsalIds?.length || 0,
        hasConductor: !!orchestra.conductorId,
        hasMembers: orchestra.memberIds?.length > 0,
        
        // Type validation
        orchestraType: orchestra.type, // "תזמורת" or "הרכב"
        
        // Status information
        statusInfo: {
          isActive: orchestra.isActive,
          hasRehearsals: orchestra.rehearsalIds?.length > 0,
          lastModified: orchestra.lastModified || orchestra.updatedAt
        }
      })) : [];
      
      console.log(`🎼 Retrieved ${processedOrchestras.length} orchestras with processed data`);
      return processedOrchestras;
    } catch (error) {
      console.error('Error fetching orchestras:', error);
      throw error;
    }
  },

  /**
   * Get single orchestra by ID
   * @param {string} orchestraId - Orchestra ID
   * @returns {Promise<Object>} Orchestra object
   */
  async getOrchestra(orchestraId) {
    try {
      const orchestra = await apiClient.get(`/orchestra/${orchestraId}`);
      
      // Get conductor and member details
      const [conductor, members] = await Promise.all([
        orchestra.conductorId ? 
          apiClient.get(`/teacher/${orchestra.conductorId}`).catch(() => null) : 
          null,
        orchestra.memberIds?.length > 0 ?
          apiClient.get('/student', { ids: orchestra.memberIds.join(',') }).catch(() => []) :
          []
      ]);

      const processedOrchestra = {
        ...orchestra,
        conductorInfo: conductor ? {
          id: conductor._id,
          name: conductor.personalInfo?.fullName,
          instrument: conductor.professionalInfo?.instrument
        } : null,
        memberDetails: Array.isArray(members) ? members.map(member => ({
          id: member._id,
          name: member.personalInfo?.fullName,
          instrument: member.academicInfo?.instrumentProgress?.find(p => p.isPrimary)?.instrumentName
        })) : [],
        memberCount: orchestra.memberIds?.length || 0,
        rehearsalCount: orchestra.rehearsalIds?.length || 0,
        statusInfo: {
          isActive: orchestra.isActive,
          hasRehearsals: orchestra.rehearsalIds?.length > 0,
          lastModified: orchestra.lastModified || orchestra.updatedAt
        }
      };
      
      console.log(`🎼 Retrieved orchestra: ${orchestra.name} with ${processedOrchestra.memberCount} members`);
      
      return processedOrchestra;
    } catch (error) {
      console.error('Error fetching orchestra:', error);
      throw error;
    }
  },

  /**
   * Create new orchestra
   * @param {Object} orchestraData - Orchestra data matching backend schema
   * @returns {Promise<Object>} Created orchestra
   */
  async createOrchestra(orchestraData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        name: orchestraData.name || '',
        type: orchestraData.type || 'תזמורת',
        conductorId: orchestraData.conductorId || '',
        memberIds: orchestraData.memberIds || [],
        rehearsalIds: orchestraData.rehearsalIds || [],
        schoolYearId: orchestraData.schoolYearId || '',
        location: orchestraData.location || 'חדר 1',
        isActive: orchestraData.isActive !== undefined ? orchestraData.isActive : true
      };

      const orchestra = await apiClient.post('/orchestra', formattedData);
      
      console.log(`➕ Created orchestra: ${orchestra.name}`);
      
      return orchestra;
    } catch (error) {
      console.error('Error creating orchestra:', error);
      throw error;
    }
  },

  /**
   * Update existing orchestra
   * @param {string} orchestraId - Orchestra ID
   * @param {Object} orchestraData - Updated orchestra data
   * @returns {Promise<Object>} Updated orchestra
   */
  async updateOrchestra(orchestraId, orchestraData) {
    try {
      const orchestra = await apiClient.put(`/orchestra/${orchestraId}`, orchestraData);
      
      console.log(`✏️ Updated orchestra: ${orchestra.name}`);
      
      return orchestra;
    } catch (error) {
      console.error('Error updating orchestra:', error);
      throw error;
    }
  },

  /**
   * Add member to orchestra
   * @param {string} orchestraId - Orchestra ID
   * @param {string} studentId - Student ID to add
   * @returns {Promise<Object>} Updated orchestra
   */
  async addMember(orchestraId, studentId) {
    try {
      console.log('🔄 Attempting to add member:', { orchestraId, studentId });
      console.log('🔑 Current auth token exists:', !!apiClient.getStoredToken());
      
      const requestBody = { 
        studentId,
      };
      
      console.log('📤 Request body:', requestBody);
      
      const orchestra = await apiClient.post(`/orchestra/${orchestraId}/members`, requestBody);
      
      console.log(`✅ Successfully added member ${studentId} to orchestra ${orchestraId}`);
      
      return orchestra;
    } catch (error) {
      console.error('❌ Detailed error adding member to orchestra:', {
        orchestraId,
        studentId,
        errorMessage: error.message,
        errorStack: error.stack,
        hasToken: !!apiClient.getStoredToken()
      });
      throw error;
    }
  },

  /**
   * Remove member from orchestra
   * @param {string} orchestraId - Orchestra ID
   * @param {string} studentId - Student ID to remove
   * @returns {Promise<Object>} Updated orchestra
   */
  async removeMember(orchestraId, studentId) {
    try {
      const orchestra = await apiClient.delete(`/orchestra/${orchestraId}/members/${studentId}`);
      
      console.log(`👤 Removed member ${studentId} from orchestra ${orchestraId}`);
      
      return orchestra;
    } catch (error) {
      console.error('Error removing member from orchestra:', error);
      throw error;
    }
  },

  /**
   * Get student attendance stats for orchestra
   * @param {string} orchestraId - Orchestra ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Attendance statistics
   */
  async getStudentAttendanceStats(orchestraId, studentId) {
    try {
      const stats = await apiClient.get(`/orchestra/${orchestraId}/student/${studentId}/attendance`);
      
      console.log(`📊 Retrieved attendance stats for student ${studentId} in orchestra ${orchestraId}`);
      
      return stats;
    } catch (error) {
      console.error('Error fetching student attendance stats:', error);
      throw error;
    }
  },

  /**
   * Delete orchestra
   * @param {string} orchestraId - Orchestra ID
   * @returns {Promise<void>}
   */
  async deleteOrchestra(orchestraId) {
    try {
      await apiClient.delete(`/orchestra/${orchestraId}`);
      
      console.log(`🗑️ Deleted orchestra: ${orchestraId}`);
    } catch (error) {
      console.error('Error deleting orchestra:', error);
      throw error;
    }
  }
};

/**
 * Rehearsal API Service
 */
export const rehearsalService = {
  /**
   * Get all rehearsals
   * @param {Object} filters - Filter options (including schoolYearId)
   * @returns {Promise<Array>} Array of rehearsals
   */
  async getRehearsals(filters = {}) {
    try {
      // Ensure schoolYearId is included if provided
      const params = { ...filters };
      
      const rehearsals = await apiClient.get('/rehearsal', params);
      
      // Process rehearsals to add computed fields
      const processedRehearsals = Array.isArray(rehearsals) ? rehearsals.map(rehearsal => ({
        ...rehearsal,
        // Add computed fields
        duration: this.calculateDuration(rehearsal.startTime, rehearsal.endTime),
        attendanceCount: {
          present: rehearsal.attendance?.present?.length || 0,
          absent: rehearsal.attendance?.absent?.length || 0,
          total: (rehearsal.attendance?.present?.length || 0) + (rehearsal.attendance?.absent?.length || 0)
        },
        
        // Date formatting helpers
        dateInfo: {
          date: rehearsal.date,
          dayOfWeek: rehearsal.dayOfWeek,
          dayName: this.getDayName(rehearsal.dayOfWeek),
          timeRange: `${rehearsal.startTime} - ${rehearsal.endTime}`
        },
        
        // Group information
        groupInfo: {
          groupId: rehearsal.groupId,
          type: rehearsal.type
        }
      })) : [];
      
      console.log(`🎵 Retrieved ${processedRehearsals.length} rehearsals with processed data`);
      return processedRehearsals;
    } catch (error) {
      console.error('Error fetching rehearsals:', error);
      throw error;
    }
  },

  /**
   * Get single rehearsal by ID
   * @param {string} rehearsalId - Rehearsal ID
   * @returns {Promise<Object>} Rehearsal object
   */
  async getRehearsal(rehearsalId) {
    try {
      const rehearsal = await apiClient.get(`/rehearsal/${rehearsalId}`);
      
      console.log(`🎭 Retrieved rehearsal for ${rehearsal.groupId}`);
      
      return rehearsal;
    } catch (error) {
      console.error('Error fetching rehearsal:', error);
      throw error;
    }
  },

  /**
   * Get rehearsals for specific orchestra
   * @param {string} orchestraId - Orchestra ID
   * @returns {Promise<Array>} Array of rehearsals for the orchestra
   */
  async getOrchestraRehearsals(orchestraId) {
    try {
      const rehearsals = await apiClient.get(`/rehearsal/orchestra/${orchestraId}`);
      
      console.log(`🎭 Retrieved ${Array.isArray(rehearsals) ? rehearsals.length : 0} rehearsals for orchestra ${orchestraId}`);
      
      return Array.isArray(rehearsals) ? rehearsals : [];
    } catch (error) {
      console.error('Error fetching orchestra rehearsals:', error);
      throw error;
    }
  },

  /**
   * Create new rehearsal
   * @param {Object} rehearsalData - Rehearsal data matching backend schema
   * @returns {Promise<Object>} Created rehearsal
   */
  async createRehearsal(rehearsalData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        groupId: rehearsalData.groupId || '',
        type: rehearsalData.type || 'תזמורת',
        date: rehearsalData.date || new Date().toISOString(),
        dayOfWeek: rehearsalData.dayOfWeek || 0,
        startTime: rehearsalData.startTime || '19:00',
        endTime: rehearsalData.endTime || '21:00',
        location: rehearsalData.location || 'אולם קונצרטים',
        attendance: rehearsalData.attendance || { present: [], absent: [] },
        notes: rehearsalData.notes || '',
        schoolYearId: rehearsalData.schoolYearId || '',
        isActive: rehearsalData.isActive !== undefined ? rehearsalData.isActive : true
      };

      const rehearsal = await apiClient.post('/rehearsal', formattedData);
      
      console.log(`➕ Created rehearsal for ${rehearsal.groupId}`);
      
      return rehearsal;
    } catch (error) {
      console.error('Error creating rehearsal:', error);
      throw error;
    }
  },

  /**
   * Update existing rehearsal
   * @param {string} rehearsalId - Rehearsal ID
   * @param {Object} rehearsalData - Updated rehearsal data
   * @returns {Promise<Object>} Updated rehearsal
   */
  async updateRehearsal(rehearsalId, rehearsalData) {
    try {
      const rehearsal = await apiClient.put(`/rehearsal/${rehearsalId}`, rehearsalData);
      
      console.log(`✏️ Updated rehearsal: ${rehearsalId}`);
      
      return rehearsal;
    } catch (error) {
      console.error('Error updating rehearsal:', error);
      throw error;
    }
  },

  /**
   * Update rehearsal attendance
   * @param {string} rehearsalId - Rehearsal ID
   * @param {Object} attendance - Attendance data { present: [], absent: [] }
   * @returns {Promise<Object>} Updated rehearsal
   */
  async updateAttendance(rehearsalId, attendance) {
    try {
      const rehearsal = await apiClient.put(`/rehearsal/${rehearsalId}/attendance`, attendance);
      
      console.log(`✅ Updated attendance for rehearsal: ${rehearsalId}`);
      
      return rehearsal;
    } catch (error) {
      console.error('Error updating rehearsal attendance:', error);
      throw error;
    }
  },

  /**
   * Create bulk rehearsals from template data
   * @param {Object} bulkData - Bulk rehearsal template data
   * @returns {Promise<Object>} Bulk creation result
   */
  async createBulkRehearsals(bulkData) {
    try {
      const result = await apiClient.post('/rehearsal/bulk', bulkData);
      
      console.log(`➕ Created bulk rehearsals for orchestra ${bulkData.orchestraId}`);
      
      return result;
    } catch (error) {
      console.error('Error creating bulk rehearsals:', error);
      throw error;
    }
  },

  /**
   * Bulk create rehearsals (legacy method)
   * @param {Array} bulkData - Array of rehearsal data objects
   * @returns {Promise<Object>} Bulk creation result
   */
  async bulkCreateRehearsals(bulkData) {
    try {
      const result = await apiClient.post('/rehearsal/bulk-create', { rehearsals: bulkData });
      
      console.log(`➕ Bulk created ${bulkData.length} rehearsals`);
      
      return result;
    } catch (error) {
      console.error('Error bulk creating rehearsals:', error);
      throw error;
    }
  },

  /**
   * Delete rehearsal
   * @param {string} rehearsalId - Rehearsal ID
   * @returns {Promise<void>}
   */
  async deleteRehearsal(rehearsalId) {
    try {
      await apiClient.delete(`/rehearsal/${rehearsalId}`);
      
      console.log(`🗑️ Deleted rehearsal: ${rehearsalId}`);
    } catch (error) {
      console.error('Error deleting rehearsal:', error);
      throw error;
    }
  },

  /**
   * Delete rehearsals in a date range for a specific orchestra
   * @param {string} orchestraId - Orchestra ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Delete operation result
   */
  async deleteRehearsalsByDateRange(orchestraId, startDate, endDate) {
    try {
      const result = await apiClient.delete(`/rehearsal/orchestra/${orchestraId}/date-range`, {
        startDate,
        endDate
      });
      
      console.log(`🗑️ Deleted rehearsals in date range ${startDate} to ${endDate} for orchestra ${orchestraId}: ${result.deletedCount} rehearsals deleted`);
      
      return result;
    } catch (error) {
      console.error('Error deleting rehearsals by date range:', error);
      throw error;
    }
  },

  /**
   * Get rehearsal with full details including orchestra and member info
   * @param {string} rehearsalId - Rehearsal ID
   * @returns {Promise<Object>} Rehearsal with detailed information
   */
  async getRehearsalWithDetails(rehearsalId) {
    try {
      const rehearsal = await apiClient.get(`/rehearsal/${rehearsalId}`);
      
      // Get orchestra details
      const orchestra = await apiClient.get(`/orchestra/${rehearsal.groupId}`).catch(() => null);
      
      // Get member details for attendance
      const allMembers = orchestra?.memberIds?.length > 0 ?
        await apiClient.get('/student', { ids: orchestra.memberIds.join(',') }).catch(() => []) :
        [];

      const detailedRehearsal = {
        ...rehearsal,
        orchestraInfo: orchestra ? {
          id: orchestra._id,
          name: orchestra.name,
          type: orchestra.type,
          memberIds: orchestra.memberIds || []
        } : null,
        memberDetails: Array.isArray(allMembers) ? allMembers.map(member => ({
          id: member._id,
          name: member.personalInfo?.fullName,
          isPresent: rehearsal.attendance?.present?.includes(member._id),
          isAbsent: rehearsal.attendance?.absent?.includes(member._id)
        })) : [],
        duration: this.calculateDuration(rehearsal.startTime, rehearsal.endTime),
        dayName: this.getDayName(rehearsal.dayOfWeek),
        attendanceCount: {
          present: rehearsal.attendance?.present?.length || 0,
          absent: rehearsal.attendance?.absent?.length || 0,
          total: (rehearsal.attendance?.present?.length || 0) + (rehearsal.attendance?.absent?.length || 0)
        }
      };
      
      console.log(`🎵 Retrieved detailed rehearsal: ${rehearsal.groupId} on ${detailedRehearsal.dayName}`);
      return detailedRehearsal;
    } catch (error) {
      console.error('Error fetching rehearsal details:', error);
      throw error;
    }
  },

  /**
   * Update rehearsal attendance
   * @param {string} rehearsalId - Rehearsal ID
   * @param {Object} attendanceData - Attendance data with present/absent arrays
   * @returns {Promise<Object>} Updated rehearsal
   */
  async updateAttendance(rehearsalId, attendanceData) {
    try {
      const updatedRehearsal = await apiClient.patch(`/rehearsal/${rehearsalId}/attendance`, {
        attendance: {
          present: attendanceData.present || [],
          absent: attendanceData.absent || []
        }
      });
      
      console.log(`📝 Updated attendance for rehearsal: ${rehearsalId}`);
      return updatedRehearsal;
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  // Utility methods
  calculateDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes; // Duration in minutes
  },

  getDayName(dayOfWeek) {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayOfWeek] || 'לא ידוע';
  }
};

/**
 * School Year API Service
 * Manages school year data and provides global context for all other entities
 */
export const schoolYearService = {
  /**
   * Get all school years
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of school years
   */
  async getSchoolYears(filters = {}) {
    try {
      const schoolYears = await apiClient.get('/school-year', filters);
      
      console.log(`🗓️ Retrieved ${Array.isArray(schoolYears) ? schoolYears.length : 0} school years`);
      
      return Array.isArray(schoolYears) ? schoolYears : [];
    } catch (error) {
      console.error('Error fetching school years:', error);
      throw error;
    }
  },

  /**
   * Get single school year by ID
   * @param {string} schoolYearId - School Year ID
   * @returns {Promise<Object>} School year object
   */
  async getSchoolYear(schoolYearId) {
    try {
      const schoolYear = await apiClient.get(`/school-year/${schoolYearId}`);
      
      console.log(`📅 Retrieved school year: ${schoolYear.name}`);
      
      return schoolYear;
    } catch (error) {
      console.error('Error fetching school year:', error);
      throw error;
    }
  },

  /**
   * Get current active school year
   * @returns {Promise<Object>} Current school year object
   */
  async getCurrentSchoolYear() {
    try {
      const schoolYears = await this.getSchoolYears({ isCurrent: true, isActive: true });
      const currentSchoolYear = schoolYears.find(sy => sy.isCurrent && sy.isActive);
      
      if (!currentSchoolYear && schoolYears.length > 0) {
        // Fallback to most recent active school year if no current one is set
        return schoolYears.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
      }
      
      console.log(`🎯 Current school year: ${currentSchoolYear?.name || 'None'}`);
      
      return currentSchoolYear || null;
    } catch (error) {
      console.error('Error fetching current school year:', error);
      throw error;
    }
  },

  /**
   * Create new school year
   * @param {Object} schoolYearData - School year data matching backend schema
   * @returns {Promise<Object>} Created school year
   */
  async createSchoolYear(schoolYearData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        name: schoolYearData.name || '',
        startDate: schoolYearData.startDate || new Date().toISOString(),
        endDate: schoolYearData.endDate || new Date().toISOString(),
        isCurrent: schoolYearData.isCurrent || false,
        isActive: schoolYearData.isActive !== undefined ? schoolYearData.isActive : true
      };

      const schoolYear = await apiClient.post('/school-year', formattedData);
      
      console.log(`➕ Created school year: ${schoolYear.name}`);
      
      return schoolYear;
    } catch (error) {
      console.error('Error creating school year:', error);
      throw error;
    }
  },

  /**
   * Update existing school year
   * @param {string} schoolYearId - School Year ID
   * @param {Object} schoolYearData - Updated school year data
   * @returns {Promise<Object>} Updated school year
   */
  async updateSchoolYear(schoolYearId, schoolYearData) {
    try {
      const schoolYear = await apiClient.put(`/school-year/${schoolYearId}`, schoolYearData);
      
      console.log(`✏️ Updated school year: ${schoolYear.name}`);
      
      return schoolYear;
    } catch (error) {
      console.error('Error updating school year:', error);
      throw error;
    }
  },

  /**
   * Delete school year
   * @param {string} schoolYearId - School Year ID
   * @returns {Promise<void>}
   */
  async deleteSchoolYear(schoolYearId) {
    try {
      await apiClient.delete(`/school-year/${schoolYearId}`);
      
      console.log(`🗑️ Deleted school year: ${schoolYearId}`);
    } catch (error) {
      console.error('Error deleting school year:', error);
      throw error;
    }
  },

  /**
   * Set current school year
   * @param {string} schoolYearId - School Year ID to set as current
   * @returns {Promise<Object>} Updated school year
   */
  async setCurrentSchoolYear(schoolYearId) {
    try {
      const schoolYear = await apiClient.put(`/school-year/${schoolYearId}/set-current`);
      
      console.log(`🎯 Set current school year: ${schoolYear.name}`);
      
      return schoolYear;
    } catch (error) {
      console.error('Error setting current school year:', error);
      throw error;
    }
  }
};

/**
 * Bagrut API Service
 * Manages student graduation requirements and presentations
 */
export const bagrutService = {
  /**
   * Get all bagrut records with normalized data
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of bagrut records with normalized presentations
   */
  async getBagruts(filters = {}) {
    try {
      const bagruts = await apiClient.get('/bagrut', filters);
      
      // Normalize complex Bagrut structure
      const normalizedBagruts = Array.isArray(bagruts) ? 
        bagruts.map(bagrut => this.normalizeBagrutData(bagrut)) : [];
      
      console.log(`🎓 Retrieved ${normalizedBagruts.length} bagrut records with normalized data`);
      
      return normalizedBagruts;
    } catch (error) {
      console.error('Error fetching bagruts:', error);
      throw error;
    }
  },

  /**
   * Get bagrut record by ID with normalized data
   * @param {string} bagrutId - Bagrut ID
   * @returns {Promise<Object>} Bagrut record with normalized presentations
   */
  async getBagrut(bagrutId) {
    try {
      const bagrut = await apiClient.get(`/bagrut/${bagrutId}`);
      
      // Normalize complex Bagrut structure
      const normalizedBagrut = this.normalizeBagrutData(bagrut);
      
      console.log(`🎓 Retrieved normalized bagrut for student ${normalizedBagrut.studentId}`);
      
      return normalizedBagrut;
    } catch (error) {
      console.error('Error fetching bagrut:', error);
      throw error;
    }
  },

  /**
   * Get bagrut record by student ID with normalized data
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Bagrut record with normalized presentations
   */
  async getBagrutByStudent(studentId) {
    try {
      const bagrut = await apiClient.get(`/bagrut/student/${studentId}`);
      
      // Normalize complex Bagrut structure
      const normalizedBagrut = this.normalizeBagrutData(bagrut);
      
      console.log(`🎓 Retrieved normalized bagrut for student ${studentId}`);
      
      return normalizedBagrut;
    } catch (error) {
      console.error('Error fetching student bagrut:', error);
      throw error;
    }
  },

  /**
   * Create new bagrut record
   * @param {Object} bagrutData - Bagrut data matching backend schema
   * @returns {Promise<Object>} Created bagrut record
   */
  async createBagrut(bagrutData) {
    try {
      // Ensure data matches exact backend schema
      const formattedData = {
        studentId: bagrutData.studentId || '',
        teacherId: bagrutData.teacherId || '',
        program: bagrutData.program || [],
        presentations: bagrutData.presentations || [],
        magenBagrut: bagrutData.magenBagrut || null,
        documents: bagrutData.documents || [],
        finalGrade: bagrutData.finalGrade || null,
        isCompleted: bagrutData.isCompleted || false,
        testDate: bagrutData.testDate || null
      };

      const bagrut = await apiClient.post('/bagrut', formattedData);
      
      console.log(`➕ Created bagrut for student ${bagrut.studentId}`);
      
      return bagrut;
    } catch (error) {
      console.error('Error creating bagrut:', error);
      throw error;
    }
  },

  /**
   * Update existing bagrut record
   * @param {string} bagrutId - Bagrut ID
   * @param {Object} bagrutData - Updated bagrut data
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updateBagrut(bagrutId, bagrutData) {
    try {
      const bagrut = await apiClient.put(`/bagrut/${bagrutId}`, bagrutData);
      
      console.log(`✏️ Updated bagrut: ${bagrutId}`);
      
      return bagrut;
    } catch (error) {
      console.error('Error updating bagrut:', error);
      throw error;
    }
  },

  /**
   * Update specific presentation in bagrut record
   * @param {string} bagrutId - Bagrut ID
   * @param {number} presentationIndex - Index of presentation (0-3)
   * @param {Object} presentationData - Presentation data
   * @returns {Promise<Object>} Updated bagrut record
   */
  async updatePresentation(bagrutId, presentationIndex, presentationData) {
    try {
      const bagrut = await apiClient.put(`/bagrut/${bagrutId}/presentation/${presentationIndex}`, presentationData);
      
      console.log(`✏️ Updated presentation ${presentationIndex} for bagrut: ${bagrutId}`);
      
      return bagrut;
    } catch (error) {
      console.error('Error updating bagrut presentation:', error);
      throw error;
    }
  },

  /**
   * Normalize complex Bagrut data structure
   * Handles duplicate data between presentations[3] and magenBagrut object
   * @param {Object} rawBagrut - Raw bagrut data from API
   * @returns {Object} Normalized bagrut with clean presentation data
   */
  normalizeBagrutData(rawBagrut) {
    if (!rawBagrut) return null;

    try {
      // Create base structure
      const normalized = {
        ...rawBagrut,
        presentations: this.normalizePresentations(rawBagrut.presentations || []),
        magenBagrut: this.extractMagenBagrutInfo(rawBagrut)
      };

      // Calculate overall completion status
      normalized.completionStatus = this.calculateBagrutCompletion(normalized);
      
      return normalized;
    } catch (error) {
      console.error('Error normalizing bagrut data:', error);
      return rawBagrut; // Return original data if normalization fails
    }
  },

  /**
   * Normalize presentations array (0-3 index)
   * Handle conflicts between different grading systems
   * @param {Array} presentations - Raw presentations array
   * @returns {Array} Normalized presentations
   */
  normalizePresentations(presentations) {
    if (!Array.isArray(presentations)) return [];

    return presentations.map((presentation, index) => {
      if (index === 3) {
        // Special handling for Magen Bagrut (presentation 3)
        return this.normalizeMagenBagrutPresentation(presentation);
      }
      
      // Regular presentations (0-2)
      return {
        ...presentation,
        presentationNumber: index + 1,
        type: index < 3 ? 'regular' : 'magen',
        grading: this.normalizeGrading(presentation.grading),
        isCompleted: this.isPresentationCompleted(presentation),
        normalizedAt: new Date().toISOString()
      };
    });
  },

  /**
   * Normalize Magen Bagrut presentation (index 3)
   * Resolve conflicts between detailedGrading and gradingDetails
   * @param {Object} presentation - Magen Bagrut presentation data
   * @returns {Object} Normalized Magen Bagrut presentation
   */
  normalizeMagenBagrutPresentation(presentation) {
    if (!presentation) return null;

    // Choose most complete grading system
    const detailedGrading = presentation.detailedGrading;
    const gradingDetails = presentation.gradingDetails;
    
    // Prefer detailedGrading if it exists and has content
    let normalizedGrading = null;
    if (detailedGrading && Object.keys(detailedGrading).length > 0) {
      normalizedGrading = {
        source: 'detailedGrading',
        ...detailedGrading
      };
    } else if (gradingDetails && Object.keys(gradingDetails).length > 0) {
      normalizedGrading = {
        source: 'gradingDetails',
        ...gradingDetails
      };
    }

    return {
      ...presentation,
      presentationNumber: 4,
      type: 'magen',
      grading: normalizedGrading,
      isCompleted: this.isPresentationCompleted(presentation),
      conflicts: this.detectGradingConflicts(detailedGrading, gradingDetails),
      normalizedAt: new Date().toISOString()
    };
  },

  /**
   * Extract clean Magen Bagrut info from various sources
   * @param {Object} rawBagrut - Raw bagrut data
   * @returns {Object} Clean Magen Bagrut information
   */
  extractMagenBagrutInfo(rawBagrut) {
    const magenPresentation = rawBagrut.presentations?.[3];
    const magenBagrut = rawBagrut.magenBagrut;

    // Merge information from both sources, preferring magenBagrut object
    return {
      isEnrolled: magenBagrut?.isEnrolled || (magenPresentation ? true : false),
      examDate: magenBagrut?.examDate || magenPresentation?.examDate || null,
      examLocation: magenBagrut?.examLocation || magenPresentation?.examLocation || null,
      finalGrade: magenBagrut?.finalGrade || this.extractFinalGrade(magenPresentation),
      status: magenBagrut?.status || this.determineMagenStatus(magenPresentation),
      accompanist: magenBagrut?.accompanist || magenPresentation?.accompanist || null,
      pieces: magenBagrut?.pieces || magenPresentation?.pieces || [],
      documents: magenBagrut?.documents || [],
      conflicts: this.detectMagenBagrutConflicts(magenPresentation, magenBagrut)
    };
  },

  /**
   * Normalize grading object to consistent structure
   * @param {Object} grading - Raw grading data
   * @returns {Object} Normalized grading
   */
  normalizeGrading(grading) {
    if (!grading) return null;

    return {
      ...grading,
      totalScore: grading.totalScore || grading.total || null,
      percentage: grading.percentage || (grading.totalScore ? Math.round((grading.totalScore / 100) * 100) : null),
      letterGrade: grading.letterGrade || this.calculateLetterGrade(grading.totalScore || grading.total),
      isComplete: grading.isComplete || (grading.totalScore > 0),
      normalizedAt: new Date().toISOString()
    };
  },

  /**
   * Check if presentation is completed
   * @param {Object} presentation - Presentation data
   * @returns {boolean} Is presentation completed
   */
  isPresentationCompleted(presentation) {
    if (!presentation) return false;
    
    return presentation.isCompleted || 
           presentation.status === 'completed' ||
           (presentation.grading && (
             presentation.grading.totalScore > 0 ||
             presentation.grading.isComplete
           ));
  },

  /**
   * Detect conflicts between different grading systems
   * @param {Object} grading1 - First grading system
   * @param {Object} grading2 - Second grading system  
   * @returns {Array} Array of detected conflicts
   */
  detectGradingConflicts(grading1, grading2) {
    const conflicts = [];
    
    if (!grading1 || !grading2) return conflicts;

    // Check for conflicting scores
    if (grading1.totalScore && grading2.totalScore && grading1.totalScore !== grading2.totalScore) {
      conflicts.push({
        type: 'score_mismatch',
        field: 'totalScore',
        values: [grading1.totalScore, grading2.totalScore]
      });
    }

    // Check for conflicting completion status
    if (grading1.isComplete !== grading2.isComplete) {
      conflicts.push({
        type: 'completion_mismatch', 
        field: 'isComplete',
        values: [grading1.isComplete, grading2.isComplete]
      });
    }

    return conflicts;
  },

  /**
   * Detect conflicts between Magen Bagrut sources
   * @param {Object} presentation - Presentation data
   * @param {Object} magenBagrut - Magen Bagrut object
   * @returns {Array} Array of conflicts
   */
  detectMagenBagrutConflicts(presentation, magenBagrut) {
    const conflicts = [];
    
    if (!presentation || !magenBagrut) return conflicts;

    // Check exam date conflicts
    if (presentation.examDate && magenBagrut.examDate && presentation.examDate !== magenBagrut.examDate) {
      conflicts.push({
        type: 'exam_date_mismatch',
        presentationValue: presentation.examDate,
        magenBagrutValue: magenBagrut.examDate
      });
    }

    // Check final grade conflicts
    const presentationGrade = this.extractFinalGrade(presentation);
    if (presentationGrade && magenBagrut.finalGrade && presentationGrade !== magenBagrut.finalGrade) {
      conflicts.push({
        type: 'final_grade_mismatch',
        presentationValue: presentationGrade,
        magenBagrutValue: magenBagrut.finalGrade
      });
    }

    return conflicts;
  },

  /**
   * Extract final grade from presentation data
   * @param {Object} presentation - Presentation data
   * @returns {number|null} Final grade
   */
  extractFinalGrade(presentation) {
    if (!presentation) return null;
    
    return presentation.finalGrade || 
           presentation.grading?.totalScore ||
           presentation.detailedGrading?.totalScore ||
           presentation.gradingDetails?.totalScore ||
           null;
  },

  /**
   * Determine Magen Bagrut status from presentation
   * @param {Object} presentation - Magen presentation data
   * @returns {string} Status
   */
  determineMagenStatus(presentation) {
    if (!presentation) return 'not_enrolled';
    
    if (this.isPresentationCompleted(presentation)) {
      return 'completed';
    }
    
    if (presentation.examDate) {
      const examDate = new Date(presentation.examDate);
      const now = new Date();
      
      if (examDate > now) {
        return 'scheduled';
      } else if (examDate <= now) {
        return 'examined';
      }
    }
    
    return 'enrolled';
  },

  /**
   * Calculate letter grade from numeric score
   * @param {number} score - Numeric score
   * @returns {string} Letter grade
   */
  calculateLetterGrade(score) {
    if (!score || score < 0) return null;
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  /**
   * Calculate overall Bagrut completion status
   * @param {Object} bagrut - Normalized bagrut data
   * @returns {Object} Completion status
   */
  calculateBagrutCompletion(bagrut) {
    const presentations = bagrut.presentations || [];
    const completedPresentations = presentations.filter(p => p && p.isCompleted).length;
    
    return {
      totalPresentations: presentations.length,
      completedPresentations,
      completionRate: presentations.length > 0 ? (completedPresentations / presentations.length) : 0,
      isFullyCompleted: completedPresentations >= 3, // Need at least 3 regular presentations
      hasMagenBagrut: bagrut.magenBagrut?.isEnrolled || false,
      magenCompleted: presentations[3]?.isCompleted || false
    };
  }
};

/**
 * Schedule API Service
 * Manages lesson scheduling, teacher availability, and time blocks
 */
export const scheduleService = {
  /**
   * Get teacher availability for a specific date
   * @param {string} teacherId - Teacher ID
   * @param {string} date - Date in ISO format
   * @returns {Promise<Object>} Availability data
   */
  async getTeacherAvailability(teacherId, date) {
    try {
      const availability = await apiClient.get(`/teacher/${teacherId}/availability`, { date });
      
      console.log(`📅 Retrieved availability for teacher ${teacherId} on ${date}`);
      
      return availability;
    } catch (error) {
      console.error('Error fetching teacher availability:', error);
      throw error;
    }
  },

  /**
   * Get teacher schedule for date range
   * @param {string} teacherId - Teacher ID
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Array>} Schedule data
   */
  async getTeacherSchedule(teacherId, startDate, endDate) {
    try {
      const schedule = await apiClient.get(`/teacher/${teacherId}/schedule`, { startDate, endDate });
      
      console.log(`📅 Retrieved schedule for teacher ${teacherId} from ${startDate} to ${endDate}`);
      
      return schedule;
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
      throw error;
    }
  },

  /**
   * Create study day for teacher
   * @param {string} teacherId - Teacher ID
   * @param {Object} studyDayData - Study day data
   * @returns {Promise<Object>} Created study day
   */
  async createStudyDay(teacherId, studyDayData) {
    try {
      const studyDay = await apiClient.post(`/teacher/${teacherId}/study-day`, studyDayData);
      
      console.log(`➕ Created study day for teacher ${teacherId}`);
      
      return studyDay;
    } catch (error) {
      console.error('Error creating study day:', error);
      throw error;
    }
  },

  /**
   * Book a lesson slot
   * @param {string} teacherId - Teacher ID
   * @param {Object} lessonData - Lesson booking data
   * @returns {Promise<Object>} Booked lesson
   */
  async bookLesson(teacherId, lessonData) {
    try {
      const lesson = await apiClient.post(`/teacher/${teacherId}/lesson`, lessonData);
      
      console.log(`📚 Booked lesson for teacher ${teacherId}`);
      
      return lesson;
    } catch (error) {
      console.error('Error booking lesson:', error);
      throw error;
    }
  },

  /**
   * Update existing lesson
   * @param {string} lessonId - Lesson ID
   * @param {Object} lessonData - Updated lesson data
   * @returns {Promise<Object>} Updated lesson
   */
  async updateLesson(lessonId, lessonData) {
    try {
      const lesson = await apiClient.put(`/lesson/${lessonId}`, lessonData);
      
      console.log(`✏️ Updated lesson: ${lessonId}`);
      
      return lesson;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  /**
   * Get lessons with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of lessons
   */
  async getLessons(filters = {}) {
    try {
      const lessons = await apiClient.get('/lessons', filters);
      
      console.log(`📚 Retrieved ${Array.isArray(lessons) ? lessons.length : 0} lessons`);
      
      return Array.isArray(lessons) ? lessons : [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  /**
   * Cancel a lesson
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} Cancelled lesson
   */
  async cancelLesson(lessonId) {
    try {
      const lesson = await apiClient.put(`/lesson/${lessonId}/cancel`);
      
      console.log(`❌ Cancelled lesson: ${lessonId}`);
      
      return lesson;
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      throw error;
    }
  },

  /**
   * Update study day template
   * @param {string} studyDayId - Study day ID
   * @param {Object} studyDayData - Updated study day data
   * @returns {Promise<Object>} Updated study day
   */
  async updateStudyDay(studyDayId, studyDayData) {
    try {
      const studyDay = await apiClient.put(`/study-day/${studyDayId}`, studyDayData);
      
      console.log(`✏️ Updated study day: ${studyDayId}`);
      
      return studyDay;
    } catch (error) {
      console.error('Error updating study day:', error);
      throw error;
    }
  },

  /**
   * Get student conflicts for scheduling
   * @param {string} studentId - Student ID
   * @param {string} date - Date to check
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {Promise<Object>} Conflict information
   */
  async getStudentConflicts(studentId, date, startTime, endTime) {
    try {
      const conflicts = await apiClient.get(`/student/${studentId}/conflicts`, {
        date,
        startTime,
        endTime
      });
      
      console.log(`🔍 Checked conflicts for student ${studentId}`);
      
      return conflicts;
    } catch (error) {
      console.error('Error checking student conflicts:', error);
      throw error;
    }
  }
};

/**
 * Analytics API Service
 * Provides dashboard statistics and analytics data
 */
export const analyticsService = {
  /**
   * Get overall attendance report for dashboard
   * @param {Object} options - Query options (startDate, endDate, etc.)
   * @returns {Promise<Object>} Overall attendance statistics
   */
  async getOverallAttendance(options = {}) {
    try {
      const report = await apiClient.get('/analytics/attendance/overall', options);
      
      console.log(`📊 Retrieved overall attendance report`);
      
      return report;
    } catch (error) {
      console.error('Error fetching overall attendance:', error);
      throw error;
    }
  },

  /**
   * Get attendance trends for dashboard charts
   * @param {Object} options - Query options (period, activityType, etc.)
   * @returns {Promise<Object>} Attendance trends data
   */
  async getAttendanceTrends(options = {}) {
    try {
      const trends = await apiClient.get('/analytics/attendance/trends', options);
      
      console.log(`📈 Retrieved attendance trends`);
      
      return trends;
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
      throw error;
    }
  },

  /**
   * Get student attendance analytics
   * @param {string} studentId - Student ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Student attendance analytics
   */
  async getStudentAttendanceStats(studentId, options = {}) {
    try {
      const stats = await apiClient.get(`/analytics/students/${studentId}/attendance`, options);
      
      console.log(`📊 Retrieved attendance stats for student ${studentId}`);
      
      return stats;
    } catch (error) {
      console.error('Error fetching student attendance stats:', error);
      throw error;
    }
  },

  /**
   * Get teacher attendance analytics
   * @param {string} teacherId - Teacher ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Teacher attendance analytics
   */
  async getTeacherAttendanceStats(teacherId, options = {}) {
    try {
      const stats = await apiClient.get(`/analytics/teachers/${teacherId}/attendance`, options);
      
      console.log(`📊 Retrieved attendance stats for teacher ${teacherId}`);
      
      return stats;
    } catch (error) {
      console.error('Error fetching teacher attendance stats:', error);
      throw error;
    }
  }
};

/**
 * Export API client for direct access if needed
 */
export { apiClient };

/**
 * Default export with all services
 */
/**
 * API Service Testing Utilities
 * Use these functions to test all services with proper error handling and loading states
 */
export const apiTestUtils = {
  /**
   * Test all API services to ensure they're working correctly
   * @returns {Promise<Object>} Test results
   */
  async testAllServices() {
    const results = {
      auth: { tested: false, working: false, error: null },
      students: { tested: false, working: false, error: null },
      teachers: { tested: false, working: false, error: null },
      theory: { tested: false, working: false, error: null },
      orchestras: { tested: false, working: false, error: null },
      rehearsals: { tested: false, working: false, error: null },
      schoolYears: { tested: false, working: false, error: null },
      bagrut: { tested: false, working: false, error: null },
      schedule: { tested: false, working: false, error: null },
      analytics: { tested: false, working: false, error: null }
    };

    console.log('🧪 Starting comprehensive API service tests...');

    // Test Students Service
    try {
      results.students.tested = true;
      const students = await studentService.getStudents();
      results.students.working = Array.isArray(students);
      console.log('✅ Students service working:', students.length, 'students found');
    } catch (error) {
      results.students.error = error.message;
      console.error('❌ Students service failed:', error.message);
    }

    // Test Teachers Service
    try {
      results.teachers.tested = true;
      const teachers = await teacherService.getTeachers();
      results.teachers.working = Array.isArray(teachers);
      console.log('✅ Teachers service working:', teachers.length, 'teachers found');
    } catch (error) {
      results.teachers.error = error.message;
      console.error('❌ Teachers service failed:', error.message);
    }

    // Test Theory Service
    try {
      results.theory.tested = true;
      const theories = await theoryService.getTheoryLessons();
      results.theory.working = Array.isArray(theories);
      console.log('✅ Theory service working:', theories.length, 'theory lessons found');
    } catch (error) {
      results.theory.error = error.message;
      console.error('❌ Theory service failed:', error.message);
    }

    // Test Orchestras Service
    try {
      results.orchestras.tested = true;
      const orchestras = await orchestraService.getOrchestras();
      results.orchestras.working = Array.isArray(orchestras);
      console.log('✅ Orchestras service working:', orchestras.length, 'orchestras found');
    } catch (error) {
      results.orchestras.error = error.message;
      console.error('❌ Orchestras service failed:', error.message);
    }

    // Test Rehearsals Service
    try {
      results.rehearsals.tested = true;
      const rehearsals = await rehearsalService.getRehearsals();
      results.rehearsals.working = Array.isArray(rehearsals);
      console.log('✅ Rehearsals service working:', rehearsals.length, 'rehearsals found');
    } catch (error) {
      results.rehearsals.error = error.message;
      console.error('❌ Rehearsals service failed:', error.message);
    }

    // Test School Years Service
    try {
      results.schoolYears.tested = true;
      const schoolYears = await schoolYearService.getSchoolYears();
      results.schoolYears.working = Array.isArray(schoolYears);
      console.log('✅ School Years service working:', schoolYears.length, 'school years found');
    } catch (error) {
      results.schoolYears.error = error.message;
      console.error('❌ School Years service failed:', error.message);
    }

    // Test Bagrut Service
    try {
      results.bagrut.tested = true;
      const bagruts = await bagrutService.getBagruts();
      results.bagrut.working = Array.isArray(bagruts);
      console.log('✅ Bagrut service working:', bagruts.length, 'bagrut records found');
    } catch (error) {
      results.bagrut.error = error.message;
      console.error('❌ Bagrut service failed:', error.message);
    }

    // Test Schedule Service
    try {
      results.schedule.tested = true;
      const lessons = await scheduleService.getLessons();
      results.schedule.working = Array.isArray(lessons);
      console.log('✅ Schedule service working:', lessons.length, 'lessons found');
    } catch (error) {
      results.schedule.error = error.message;
      console.error('❌ Schedule service failed:', error.message);
    }

    // Test Analytics Service
    try {
      results.analytics.tested = true;
      const trends = await analyticsService.getAttendanceTrends();
      results.analytics.working = trends !== null;
      console.log('✅ Analytics service working');
    } catch (error) {
      results.analytics.error = error.message;
      console.error('❌ Analytics service failed:', error.message);
    }

    const workingServices = Object.values(results).filter(r => r.working).length;
    const testedServices = Object.values(results).filter(r => r.tested).length;
    
    console.log(`🏁 API Test Complete: ${workingServices}/${testedServices} services working`);
    
    return results;
  },

  /**
   * Test dashboard data integration specifically
   * @returns {Promise<Object>} Dashboard data test results
   */
  async testDashboardData() {
    console.log('📊 Testing dashboard data integration...');
    
    const dashboardData = {
      totalStudents: 0,
      totalTeachers: 0,
      totalTheoryLessons: 0,
      totalOrchestras: 0,
      totalRehearsals: 0,
      attendanceRate: 0,
      error: null
    };

    try {
      // Get real counts from all services
      const [students, teachers, theories, orchestras, rehearsals] = await Promise.allSettled([
        studentService.getStudents(),
        teacherService.getTeachers(),
        theoryService.getTheoryLessons(),
        orchestraService.getOrchestras(),
        rehearsalService.getRehearsals()
      ]);

      if (students.status === 'fulfilled') {
        dashboardData.totalStudents = students.value.length;
      }
      if (teachers.status === 'fulfilled') {
        dashboardData.totalTeachers = teachers.value.length;
      }
      if (theories.status === 'fulfilled') {
        dashboardData.totalTheoryLessons = theories.value.length;
      }
      if (orchestras.status === 'fulfilled') {
        dashboardData.totalOrchestras = orchestras.value.length;
      }
      if (rehearsals.status === 'fulfilled') {
        dashboardData.totalRehearsals = rehearsals.value.length;
      }

      // Try to get attendance rate from analytics
      try {
        const attendanceReport = await analyticsService.getOverallAttendance();
        dashboardData.attendanceRate = attendanceReport.overallAttendanceRate || 0;
      } catch (error) {
        console.warn('⚠️ Analytics not available, using default attendance rate');
        dashboardData.attendanceRate = 85; // Default fallback
      }

      console.log('✅ Dashboard data successfully retrieved:', dashboardData);
      
    } catch (error) {
      dashboardData.error = error.message;
      console.error('❌ Dashboard data test failed:', error.message);
    }

    return dashboardData;
  }
};

/**
 * Student Utility Functions
 * Helper functions for processing student data with correct schema mapping
 */
export const studentUtils = {
  // Extract primary instrument info
  getPrimaryInstrument: (student) => {
    const primaryProgress = student.academicInfo?.instrumentProgress?.find(
      progress => progress.isPrimary === true
    );
    return {
      name: primaryProgress?.instrumentName || null,
      stage: primaryProgress?.currentStage || null,
      hasInstrument: !!primaryProgress
    };
  },

  // Get all instruments for a student
  getAllInstruments: (student) => {
    return student.academicInfo?.instrumentProgress?.map(progress => ({
      name: progress.instrumentName,
      stage: progress.currentStage,
      isPrimary: progress.isPrimary
    })) || [];
  },

  // Check if student has teacher assignments
  hasTeacherAssignments: (student) => {
    return student.teacherAssignments && student.teacherAssignments.length > 0;
  },

  // Get assigned teacher IDs
  getAssignedTeacherIds: (student) => {
    return student.teacherAssignments?.map(assignment => assignment.teacherId) || [];
  }
};

/**
 * Student-Teacher Relationship Utilities
 * Helper functions for processing teacher assignments with correct schema mapping
 */
export const studentTeacherUtils = {
  // Helper to calculate end time
  calculateEndTime: (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  },

  // Helper to get student's primary instrument
  getStudentPrimaryInstrument: (student) => {
    const primary = student.academicInfo?.instrumentProgress?.find(p => p.isPrimary);
    return primary?.instrumentName || null;
  },

  // Get teacher info for student display
  getStudentTeachers: async (student) => {
    try {
      if (!student.teacherAssignments?.length) {
        return [];
      }

      const teacherIds = student.teacherAssignments.map(assignment => assignment.teacherId);
      const teachers = await apiClient.get('/teacher', { 
        ids: teacherIds.join(',') 
      });

      return student.teacherAssignments.map(assignment => {
        const teacher = Array.isArray(teachers) ? teachers.find(t => t._id === assignment.teacherId) : null;
        return {
          teacherId: assignment.teacherId,
          teacherName: teacher?.personalInfo?.fullName || 'לא ידוע',
          day: assignment.day,
          time: assignment.time,
          duration: assignment.duration,
          endTime: assignment.scheduleInfo?.endTime || 
                   studentTeacherUtils.calculateEndTime(assignment.time, assignment.duration),
          scheduleInfo: assignment.scheduleInfo,
          notes: assignment.notes,
          // Try to infer instrument from student's primary instrument
          instrument: studentTeacherUtils.getStudentPrimaryInstrument(student),
          // Map database structure to frontend expectations
          lessonDuration: assignment.duration,
          frequency: 'weekly', // Default assumption
          isActive: assignment.scheduleInfo?.isActive !== false
        };
      });
    } catch (error) {
      console.error('Error getting student teachers:', error);
      return [];
    }
  },

  // Create teacher assignment
  createTeacherAssignment: async (studentId, teacherId, assignmentData) => {
    try {
      const assignment = {
        teacherId,
        day: assignmentData.day,
        time: assignmentData.time,
        duration: assignmentData.duration || 30,
        notes: assignmentData.notes || '',
        scheduleInfo: {
          day: assignmentData.day,
          startTime: assignmentData.time,
          endTime: studentTeacherUtils.calculateEndTime(assignmentData.time, assignmentData.duration || 30),
          duration: assignmentData.duration || 30,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      };

      return await apiClient.post(`/student/${studentId}/teacher-assignment`, assignment);
    } catch (error) {
      console.error('Error creating teacher assignment:', error);
      throw error;
    }
  },

  // Update teacher assignment 
  updateTeacherAssignment: async (studentId, assignmentId, assignmentData) => {
    try {
      const updatedAssignment = {
        ...assignmentData,
        scheduleInfo: {
          ...assignmentData.scheduleInfo,
          endTime: studentTeacherUtils.calculateEndTime(assignmentData.time, assignmentData.duration),
          updatedAt: new Date().toISOString()
        }
      };

      return await apiClient.put(`/student/${studentId}/assignment/${assignmentId}`, updatedAssignment);
    } catch (error) {
      console.error('Error updating teacher assignment:', error);
      throw error;
    }
  },

  // Delete teacher assignment
  deleteTeacherAssignment: async (studentId, assignmentId) => {
    try {
      return await apiClient.delete(`/student/${studentId}/assignment/${assignmentId}`);
    } catch (error) {
      console.error('Error deleting teacher assignment:', error);
      throw error;
    }
  }
};

/**
 * Teacher Utility Functions
 * Helper functions for processing teacher data with correct schema mapping
 */
export const teacherUtils = {
  // Check if teacher is fully active
  isTeacherActive: (teacher) => {
    return teacher.isActive && teacher.professionalInfo?.isActive;
  },

  // Get teacher's primary role
  getPrimaryRole: (teacher) => {
    return teacher.roles?.[0] || 'לא מוגדר';
  },

  // Check if teacher has specific role
  hasRole: (teacher, role) => {
    return teacher.roles?.includes(role) || false;
  },

  // Get teacher's availability summary
  getAvailabilitySummary: (teacher) => {
    const timeBlocks = teacher.teaching?.timeBlocks || [];
    
    return {
      days: timeBlocks.map(block => block.day),
      totalHours: timeBlocks.reduce((total, block) => 
        total + (block.totalDuration / 60), 0), // Convert minutes to hours
      locations: [...new Set(timeBlocks.map(block => block.location))],
      hasAvailability: timeBlocks.length > 0
    };
  },

  // Get teacher's workload
  getWorkload: (teacher) => {
    return {
      studentCount: teacher.teaching?.studentIds?.length || 0,
      orchestraCount: teacher.conducting?.orchestraIds?.length || 0,
      ensembleCount: teacher.conducting?.ensemblesIds?.length || 0,
      timeBlockCount: teacher.teaching?.timeBlocks?.length || 0
    };
  },

  // Format time blocks for display
  formatTimeBlocks: (timeBlocks) => {
    return timeBlocks.map(block => ({
      ...block,
      timeRange: `${block.startTime} - ${block.endTime}`,
      durationHours: (block.totalDuration / 60).toFixed(1)
    }));
  }
};

/**
 * Teacher Schedule Service
 * Handles teacher time blocks (יום לימוד) and availability management
 */
export const teacherScheduleService = {
  // Get teacher's time blocks (יום לימוד)
  async getTeacherTimeBlocks(teacherId) {
    try {
      const teacher = await teacherService.getTeacher(teacherId);
      return teacherUtils.formatTimeBlocks(teacher.teaching?.timeBlocks || []);
    } catch (error) {
      console.error('Error getting teacher time blocks:', error);
      throw error;
    }
  },

  // Create new time block for teacher
  async createTimeBlock(teacherId, timeBlockData) {
    try {
      const timeBlock = {
        day: timeBlockData.day,
        startTime: timeBlockData.startTime,
        endTime: timeBlockData.endTime,
        totalDuration: this.calculateDuration(timeBlockData.startTime, timeBlockData.endTime),
        location: timeBlockData.location,
        notes: timeBlockData.notes || null,
        isActive: true,
        assignedLessons: [],
        recurring: {
          isRecurring: timeBlockData.isRecurring || true,
          excludeDates: timeBlockData.excludeDates || []
        }
      };

      return await apiClient.post(`/teacher/${teacherId}/time-block`, timeBlock);
    } catch (error) {
      console.error('Error creating time block:', error);
      throw error;
    }
  },

  // Update time block
  async updateTimeBlock(teacherId, timeBlockId, timeBlockData) {
    try {
      return await apiClient.put(`/teacher/${teacherId}/time-block/${timeBlockId}`, timeBlockData);
    } catch (error) {
      console.error('Error updating time block:', error);
      throw error;
    }
  },

  // Delete time block
  async deleteTimeBlock(teacherId, timeBlockId) {
    try {
      return await apiClient.delete(`/teacher/${teacherId}/time-block/${timeBlockId}`);
    } catch (error) {
      console.error('Error deleting time block:', error);
      throw error;
    }
  },

  // Helper to calculate duration in minutes
  calculateDuration: (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }
};

/**
 * Assignment Service for CRUD Operations
 * Handles teacher assignments with proper data structure mapping
 */
export const assignmentService = {
  async getStudentAssignments(studentId) {
    try {
      const assignments = await apiClient.get(`/student/${studentId}/assignments`);
      console.log(`📅 Retrieved assignments for student ${studentId}:`, assignments?.length || 0);
      return Array.isArray(assignments) ? assignments : [];
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      throw error;
    }
  },

  async createAssignment(studentId, teacherId, assignmentData) {
    return await studentTeacherUtils.createTeacherAssignment(studentId, teacherId, assignmentData);
  },

  async updateAssignment(studentId, assignmentId, assignmentData) {
    return await studentTeacherUtils.updateTeacherAssignment(studentId, assignmentId, assignmentData);
  },

  async deleteAssignment(studentId, assignmentId) {
    return await studentTeacherUtils.deleteTeacherAssignment(studentId, assignmentId);
  }
};

/**
 * Test Teacher Assignments
 * Test function to verify teacher assignment data structure works correctly
 */
export const testTeacherAssignments = async () => {
  try {
    console.log('🧪 Starting teacher assignments test...');
    const students = await studentService.getStudents();
    const studentsWithTeachers = students.filter(s => s.teacherAssignments?.length > 0);
    
    console.log('=== TEACHER ASSIGNMENTS TEST ===');
    for (const student of studentsWithTeachers.slice(0, 3)) {
      try {
        const teachers = await studentTeacherUtils.getStudentTeachers(student);
        console.log(`${student.personalInfo?.fullName}:`, {
          assignmentCount: student.teacherAssignments.length,
          teachers: teachers.map(t => ({
            name: t.teacherName,
            day: t.day,
            time: t.time,
            duration: t.duration,
            instrument: t.instrument
          }))
        });
      } catch (error) {
        console.log(`Error processing ${student.personalInfo?.fullName}:`, error.message);
      }
    }
    console.log('================================');
    
    return {
      success: true,
      totalStudents: students.length,
      studentsWithAssignments: studentsWithTeachers.length,
      sampleProcessed: Math.min(3, studentsWithTeachers.length)
    };
  } catch (error) {
    console.error('❌ Teacher assignments test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test Teacher Data Extraction
 * Test function to verify teacher data schema fix works correctly
 */
export const testTeacherDataExtraction = async () => {
  try {
    console.log('🧪 Starting teacher data extraction test...');
    const teachers = await teacherService.getTeachers();
    
    console.log('=== TEACHER DATA EXTRACTION TEST ===');
    teachers.slice(0, 3).forEach((teacher, index) => {
      const availability = teacherUtils.getAvailabilitySummary(teacher);
      const workload = teacherUtils.getWorkload(teacher);
      
      console.log(`Teacher ${index + 1}:`, {
        name: teacher.personalInfo?.fullName,
        instrument: teacher.professionalInfo?.instrument,
        roles: teacher.allRoles,
        primaryRole: teacher.primaryRole,
        isActive: teacher.isTeacherActive,
        studentCount: workload.studentCount,
        orchestraCount: workload.orchestraCount,
        availabilityDays: availability.days,
        totalHours: availability.totalHours,
        locations: availability.locations,
        timeBlocks: teacher.timeBlockCount
      });
    });
    console.log('=====================================');
    
    return {
      success: true,
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter(t => t.isTeacherActive).length,
      teachersWithTimeBlocks: teachers.filter(t => t.hasTimeBlocks).length
    };
  } catch (error) {
    console.error('❌ Teacher data extraction test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test Student Data Extraction
 * Test function to verify the schema fix works correctly
 */
export const testStudentDataExtraction = async () => {
  try {
    console.log('🧪 Starting student data extraction test...');
    const students = await studentService.getStudents();
    
    console.log('=== STUDENT DATA EXTRACTION TEST ===');
    students.slice(0, 5).forEach((student, index) => {
      const primaryInstrument = studentUtils.getPrimaryInstrument(student);
      console.log(`Student ${index + 1}:`, {
        name: student.personalInfo?.fullName,
        primaryInstrument: primaryInstrument.name || 'ללא כלי',
        stage: primaryInstrument.stage || 'לא הוגדר',
        hasInstrument: primaryInstrument.hasInstrument,
        allInstruments: studentUtils.getAllInstruments(student),
        class: student.academicInfo?.class
      });
    });
    console.log('====================================');
    
    return {
      success: true,
      totalStudents: students.length,
      studentsWithInstruments: students.filter(s => studentUtils.getPrimaryInstrument(s).hasInstrument).length
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Orchestra Utility Functions
 * Helper functions for processing orchestra data
 */
export const orchestraUtils = {
  // Get orchestra type display name
  getTypeDisplayName: (type) => {
    return type === 'תזמורת' ? 'תזמורת' : 'הרכב';
  },

  // Check if orchestra is ready for rehearsals
  isReadyForRehearsals: (orchestra) => {
    return orchestra.isActive && 
           orchestra.conductorId && 
           orchestra.memberIds?.length > 0;
  },

  // Get orchestra status
  getOrchestraStatus: (orchestra) => {
    if (!orchestra.isActive) return 'לא פעיל';
    if (!orchestra.conductorId) return 'חסר מנצח';
    if (!orchestra.memberIds?.length) return 'חסרים חברים';
    return 'פעיל';
  },

  // Get orchestra readiness score (0-100)
  getReadinessScore: (orchestra) => {
    let score = 0;
    if (orchestra.isActive) score += 40;
    if (orchestra.conductorId) score += 30;
    if (orchestra.memberIds?.length > 0) score += 30;
    return score;
  }
};

/**
 * Rehearsal Utility Functions
 * Helper functions for processing rehearsal data
 */
export const rehearsalUtils = {
  // Format rehearsal for display
  formatForDisplay: (rehearsal) => ({
    title: `${rehearsal.type} - ${rehearsal.dateInfo?.dayName || rehearsalUtils.getDayName(rehearsal.dayOfWeek)}`,
    time: `${rehearsal.startTime} - ${rehearsal.endTime}`,
    duration: `${Math.floor((rehearsal.duration || 0) / 60)} שעות ${(rehearsal.duration || 0) % 60} דק'`,
    location: rehearsal.location,
    attendanceRate: rehearsal.attendanceCount?.total > 0 ? 
      Math.round((rehearsal.attendanceCount.present / rehearsal.attendanceCount.total) * 100) : 0
  }),

  // Group rehearsals by orchestra
  groupByOrchestra: (rehearsals) => {
    return rehearsals.reduce((groups, rehearsal) => {
      const groupId = rehearsal.groupId;
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(rehearsal);
      return groups;
    }, {});
  },

  // Get day name from dayOfWeek number
  getDayName: (dayOfWeek) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayOfWeek] || 'לא ידוע';
  },

  // Calculate attendance statistics
  calculateAttendanceStats: (rehearsals) => {
    const stats = {
      totalRehearsals: rehearsals.length,
      totalAttendees: 0,
      totalAbsences: 0,
      averageAttendance: 0
    };

    rehearsals.forEach(rehearsal => {
      stats.totalAttendees += rehearsal.attendanceCount?.present || 0;
      stats.totalAbsences += rehearsal.attendanceCount?.absent || 0;
    });

    const totalPossibleAttendances = stats.totalAttendees + stats.totalAbsences;
    stats.averageAttendance = totalPossibleAttendances > 0 ? 
      Math.round((stats.totalAttendees / totalPossibleAttendances) * 100) : 0;

    return stats;
  }
};

/**
 * Test Orchestra and Rehearsal Data Extraction
 * Test function to verify orchestra and rehearsal data processing works correctly
 */
export const testOrchestraRehearsalExtraction = async () => {
  try {
    console.log('🧪 Starting orchestra and rehearsal data extraction test...');
    console.log('=== ORCHESTRA & REHEARSAL DATA TEST ===');
    
    // Test orchestras
    const orchestras = await orchestraService.getOrchestras();
    console.log(`Found ${orchestras.length} orchestras`);
    
    orchestras.slice(0, 3).forEach((orchestra, index) => {
      const status = orchestraUtils.getOrchestraStatus(orchestra);
      const readiness = orchestraUtils.getReadinessScore(orchestra);
      
      console.log(`Orchestra ${index + 1}:`, {
        name: orchestra.name,
        type: orchestra.orchestraType,
        memberCount: orchestra.memberCount,
        rehearsalCount: orchestra.rehearsalCount,
        status: status,
        readinessScore: `${readiness}%`,
        isActive: orchestra.statusInfo?.isActive
      });
    });

    // Test rehearsals
    const rehearsals = await rehearsalService.getRehearsals();
    console.log(`Found ${rehearsals.length} rehearsals`);
    
    rehearsals.slice(0, 3).forEach((rehearsal, index) => {
      const formatted = rehearsalUtils.formatForDisplay(rehearsal);
      console.log(`Rehearsal ${index + 1}:`, {
        title: formatted.title,
        time: formatted.time,
        duration: formatted.duration,
        location: formatted.location,
        attendanceRate: `${formatted.attendanceRate}%`,
        attendanceCount: rehearsal.attendanceCount
      });
    });

    // Calculate overall stats
    const attendanceStats = rehearsalUtils.calculateAttendanceStats(rehearsals);
    console.log('Overall Rehearsal Statistics:', attendanceStats);
    
    console.log('==========================================');
    
    return {
      success: true,
      orchestras: {
        total: orchestras.length,
        active: orchestras.filter(o => o.statusInfo?.isActive).length,
        ready: orchestras.filter(o => orchestraUtils.isReadyForRehearsals(o)).length
      },
      rehearsals: {
        total: rehearsals.length,
        ...attendanceStats
      }
    };
  } catch (error) {
    console.error('❌ Orchestra/Rehearsal test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Default export with all services
 * Complete API service collection matching backend schemas
 */
export default {
  auth: authService,
  students: studentService,
  teachers: teacherService,
  teacherSchedule: teacherScheduleService,
  theory: theoryService,
  orchestras: orchestraService,
  rehearsals: rehearsalService,
  schoolYears: schoolYearService,
  bagrut: bagrutService,
  schedule: scheduleService,
  analytics: analyticsService,
  assignments: assignmentService,
  test: apiTestUtils,
  client: apiClient,
  // Utility functions
  utils: {
    student: studentUtils,
    teacher: teacherUtils,
    studentTeacher: studentTeacherUtils,
    orchestra: orchestraUtils,
    rehearsal: rehearsalUtils
  },
  // Test functions
  testStudentDataExtraction: testStudentDataExtraction,
  testTeacherDataExtraction: testTeacherDataExtraction,
  testTeacherAssignments: testTeacherAssignments,
  testOrchestraRehearsalExtraction: testOrchestraRehearsalExtraction
};
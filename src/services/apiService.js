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

    // Add body for POST/PUT/PATCH requests
    if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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
    const url = new URL(this.buildUrl(endpoint));
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return this.request('GET', url.pathname + url.search);
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

  async delete(endpoint) {
    return this.request('DELETE', endpoint);
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
      
      // Handle both old and new response formats
      const token = response.accessToken || response.data?.accessToken;
      const teacher = response.teacher || response.data?.teacher;
      
      if (token) {
        apiClient.setToken(token);
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
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of students with exact backend schema
   */
  async getStudents(filters = {}) {
    try {
      const students = await apiClient.get('/student', filters);
      
      console.log(`📚 Retrieved ${Array.isArray(students) ? students.length : 0} students`);
      
      // Students already come with exact schema:
      // - personalInfo.fullName
      // - academicInfo.class  
      // - teacherAssignments array
      // - academicInfo.instrumentProgress with isPrimary
      return Array.isArray(students) ? students : [];
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
   * @param {Object} studentData - Student data with exact backend schema
   * @returns {Promise<Object>} Created student
   */
  async createStudent(studentData) {
    try {
      // Ensure data matches exact backend schema
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
          instrumentProgress: studentData.academicInfo?.instrumentProgress || [],
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
        isActive: studentData.isActive !== undefined ? studentData.isActive : true
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
      const student = await apiClient.put(`/student/${studentId}`, studentData);
      
      console.log(`✏️ Updated student: ${student.personalInfo?.fullName}`);
      
      return student;
    } catch (error) {
      console.error('Error updating student:', error);
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
  }
};

/**
 * Teacher API Service  
 * Uses exact backend schema: teacher.personalInfo.fullName, teacher.teaching.studentIds
 */
export const teacherService = {
  /**
   * Get all teachers with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of teachers with exact backend schema
   */
  async getTeachers(filters = {}) {
    try {
      const teachers = await apiClient.get('/teacher', filters);
      
      console.log(`👨‍🏫 Retrieved ${Array.isArray(teachers) ? teachers.length : 0} teachers`);
      
      // Teachers already come with exact schema:
      // - personalInfo.fullName
      // - teaching.studentIds array
      // - professionalInfo.instrument
      // - roles array
      return Array.isArray(teachers) ? teachers : [];
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
      const teacher = await apiClient.get(`/teacher/${teacherId}`);
      
      console.log(`👤 Retrieved teacher: ${teacher.personalInfo?.fullName}`);
      
      return teacher;
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
  }
};

/**
 * Theory Lessons API Service
 * Uses exact backend schema with Hebrew field names and proper data structure
 */
export const theoryService = {
  /**
   * Get all theory lessons with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of theory lessons with exact backend schema
   */
  async getTheoryLessons(filters = {}) {
    try {
      const lessons = await apiClient.get('/theory', filters);
      
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
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of orchestras
   */
  async getOrchestras(filters = {}) {
    try {
      const orchestras = await apiClient.get('/orchestra', filters);
      
      console.log(`🎼 Retrieved ${Array.isArray(orchestras) ? orchestras.length : 0} orchestras`);
      
      return Array.isArray(orchestras) ? orchestras : [];
    } catch (error) {
      console.error('Error fetching orchestras:', error);
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
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of rehearsals
   */
  async getRehearsals(filters = {}) {
    try {
      const rehearsals = await apiClient.get('/rehearsal', filters);
      
      console.log(`🎭 Retrieved ${Array.isArray(rehearsals) ? rehearsals.length : 0} rehearsals`);
      
      return Array.isArray(rehearsals) ? rehearsals : [];
    } catch (error) {
      console.error('Error fetching rehearsals:', error);
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
export default {
  auth: authService,
  students: studentService,
  teachers: teacherService,
  theory: theoryService,
  orchestras: orchestraService,
  rehearsals: rehearsalService,
  client: apiClient
};
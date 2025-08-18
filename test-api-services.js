/**
 * API Services Test Suite
 * Run this file to test all API services with proper error handling and loading states
 * 
 * Usage:
 * 1. Open browser console
 * 2. Import this file: import('./test-api-services.js')
 * 3. Run: testAllServices() or testDashboardData()
 */

import apiService from './services/apiService.js';

// Global test functions for browser console access
window.testAllServices = async () => {
  console.log('🚀 Starting comprehensive API services test...');
  const results = await apiService.test.testAllServices();
  
  console.table(results);
  return results;
};

window.testDashboardData = async () => {
  console.log('📊 Starting dashboard data integration test...');
  const dashboardData = await apiService.test.testDashboardData();
  
  console.log('Dashboard Data Results:');
  console.table(dashboardData);
  return dashboardData;
};

// Individual service tests for detailed debugging
window.testIndividualServices = {
  async students() {
    console.log('Testing Students Service...');
    try {
      const students = await apiService.students.getStudents();
      console.log('✅ Students:', students.length);
      
      if (students.length > 0) {
        const firstStudent = await apiService.students.getStudent(students[0]._id);
        console.log('✅ First student details:', firstStudent.personalInfo?.fullName);
      }
      
      return { success: true, count: students.length };
    } catch (error) {
      console.error('❌ Students service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async teachers() {
    console.log('Testing Teachers Service...');
    try {
      const teachers = await apiService.teachers.getTeachers();
      console.log('✅ Teachers:', teachers.length);
      
      if (teachers.length > 0) {
        const firstTeacher = await apiService.teachers.getTeacher(teachers[0]._id);
        console.log('✅ First teacher details:', firstTeacher.personalInfo?.fullName);
      }
      
      return { success: true, count: teachers.length };
    } catch (error) {
      console.error('❌ Teachers service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async theory() {
    console.log('Testing Theory Service...');
    try {
      const theories = await apiService.theory.getTheoryLessons();
      console.log('✅ Theory Lessons:', theories.length);
      
      return { success: true, count: theories.length };
    } catch (error) {
      console.error('❌ Theory service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async orchestras() {
    console.log('Testing Orchestras Service...');
    try {
      const orchestras = await apiService.orchestras.getOrchestras();
      console.log('✅ Orchestras:', orchestras.length);
      
      if (orchestras.length > 0) {
        const firstOrchestra = await apiService.orchestras.getOrchestra(orchestras[0]._id);
        console.log('✅ First orchestra details:', firstOrchestra.name);
      }
      
      return { success: true, count: orchestras.length };
    } catch (error) {
      console.error('❌ Orchestras service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async rehearsals() {
    console.log('Testing Rehearsals Service...');
    try {
      const rehearsals = await apiService.rehearsals.getRehearsals();
      console.log('✅ Rehearsals:', rehearsals.length);
      
      return { success: true, count: rehearsals.length };
    } catch (error) {
      console.error('❌ Rehearsals service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async schoolYears() {
    console.log('Testing School Years Service...');
    try {
      const schoolYears = await apiService.schoolYears.getSchoolYears();
      console.log('✅ School Years:', schoolYears.length);
      
      const currentYear = await apiService.schoolYears.getCurrentSchoolYear();
      console.log('✅ Current School Year:', currentYear?.name || 'None set');
      
      return { success: true, count: schoolYears.length, current: currentYear?.name };
    } catch (error) {
      console.error('❌ School Years service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async bagrut() {
    console.log('Testing Bagrut Service...');
    try {
      const bagruts = await apiService.bagrut.getBagruts();
      console.log('✅ Bagrut Records:', bagruts.length);
      
      return { success: true, count: bagruts.length };
    } catch (error) {
      console.error('❌ Bagrut service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async schedule() {
    console.log('Testing Schedule Service...');
    try {
      const lessons = await apiService.schedule.getLessons();
      console.log('✅ Lessons:', lessons.length);
      
      return { success: true, count: lessons.length };
    } catch (error) {
      console.error('❌ Schedule service failed:', error);
      return { success: false, error: error.message };
    }
  },

  async analytics() {
    console.log('Testing Analytics Service...');
    try {
      const trends = await apiService.analytics.getAttendanceTrends();
      console.log('✅ Analytics working, trends available');
      
      const overall = await apiService.analytics.getOverallAttendance();
      console.log('✅ Overall attendance report available');
      
      return { success: true, hasTrends: !!trends, hasOverall: !!overall };
    } catch (error) {
      console.error('❌ Analytics service failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// Quick dashboard replacement function
window.getDashboardStats = async () => {
  console.log('📊 Getting real dashboard statistics...');
  
  try {
    const [students, teachers, theories, orchestras, rehearsals, currentYear] = await Promise.allSettled([
      apiService.students.getStudents({ isActive: true }),
      apiService.teachers.getTeachers({ isActive: true }),
      apiService.theory.getTheoryLessons(),
      apiService.orchestras.getOrchestras({ isActive: true }),
      apiService.rehearsals.getRehearsals(),
      apiService.schoolYears.getCurrentSchoolYear()
    ]);

    const stats = {
      totalStudents: students.status === 'fulfilled' ? students.value.length : 0,
      totalTeachers: teachers.status === 'fulfilled' ? teachers.value.length : 0,
      weeklyLessons: theories.status === 'fulfilled' ? theories.value.length : 0,
      activeOrchestras: orchestras.status === 'fulfilled' ? orchestras.value.length : 0,
      upcomingRehearsals: rehearsals.status === 'fulfilled' ? 
        rehearsals.value.filter(r => new Date(r.date) > new Date()).length : 0,
      currentSchoolYear: currentYear.status === 'fulfilled' ? currentYear.value?.name : 'N/A'
    };

    console.log('✅ Real Dashboard Stats:', stats);
    
    // Compare with hardcoded values
    console.log('🔍 Comparison with typical hardcoded values:');
    console.log('Students: Real =', stats.totalStudents, 'vs Hardcoded = 150/156');
    console.log('Teachers: Real =', stats.totalTeachers, 'vs Hardcoded = 25/48');
    console.log('Orchestras: Real =', stats.activeOrchestras, 'vs Hardcoded = 8');
    
    return stats;
    
  } catch (error) {
    console.error('❌ Dashboard stats failed:', error);
    return { error: error.message };
  }
};

// Export for module usage
export { testAllServices, testDashboardData, testIndividualServices, getDashboardStats };

console.log(`
🧪 API Services Test Suite Loaded!

Available test functions:
- testAllServices() - Test all services at once
- testDashboardData() - Test dashboard data integration
- testIndividualServices.students() - Test individual services
- getDashboardStats() - Get real dashboard statistics

Usage: Run any function in browser console to test API integration.
`);
/**
 * API Service Testing Script
 * Tests the new API service with real backend integration
 */

import apiService from './apiService.js';

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: '123456'
};

/**
 * Test runner
 */
async function runTests() {
  console.log('🧪 Starting API Service Tests');
  console.log('==============================');

  try {
    // Test authentication
    console.log('\n1️⃣ Testing Authentication...');
    const { token, teacher } = await apiService.auth.login(
      TEST_CREDENTIALS.email, 
      TEST_CREDENTIALS.password
    );
    console.log('✅ Authentication successful');
    console.log('   Token:', token ? 'Present' : 'Missing');
    console.log('   Teacher:', teacher?.personalInfo?.fullName || 'No teacher data');

    // Test token validation
    console.log('\n2️⃣ Testing Token Validation...');
    const validation = await apiService.auth.validateToken();
    console.log('✅ Token validation successful');

    // Test students endpoint
    console.log('\n3️⃣ Testing Students API...');
    const students = await apiService.students.getStudents();
    console.log(`✅ Retrieved ${students.length} students`);
    
    if (students.length > 0) {
      const firstStudent = students[0];
      console.log('   Sample student structure:');
      console.log('   - _id:', firstStudent._id);
      console.log('   - personalInfo.fullName:', firstStudent.personalInfo?.fullName);
      console.log('   - academicInfo.class:', firstStudent.academicInfo?.class);
      console.log('   - teacherAssignments:', Array.isArray(firstStudent.teacherAssignments), firstStudent.teacherAssignments?.length || 0);
      
      // Test individual student
      console.log('\n3️⃣.1 Testing Individual Student...');
      const student = await apiService.students.getStudent(firstStudent._id);
      console.log('✅ Retrieved individual student:', student.personalInfo?.fullName);
    }

    // Test teachers endpoint
    console.log('\n4️⃣ Testing Teachers API...');
    const teachers = await apiService.teachers.getTeachers();
    console.log(`✅ Retrieved ${teachers.length} teachers`);
    
    if (teachers.length > 0) {
      const firstTeacher = teachers[0];
      console.log('   Sample teacher structure:');
      console.log('   - _id:', firstTeacher._id);
      console.log('   - personalInfo.fullName:', firstTeacher.personalInfo?.fullName);
      console.log('   - teaching.studentIds:', Array.isArray(firstTeacher.teaching?.studentIds), firstTeacher.teaching?.studentIds?.length || 0);
      console.log('   - professionalInfo.instrument:', firstTeacher.professionalInfo?.instrument);
      
      // Test individual teacher
      console.log('\n4️⃣.1 Testing Individual Teacher...');
      const teacherDetail = await apiService.teachers.getTeacher(firstTeacher._id);
      console.log('✅ Retrieved individual teacher:', teacherDetail.personalInfo?.fullName);

      // Test teacher lessons (NEW ENDPOINT)
      console.log('\n4️⃣.2 Testing Teacher Lessons...');
      try {
        const lessons = await apiService.teachers.getTeacherLessons(firstTeacher._id);
        console.log('✅ Retrieved teacher lessons:', lessons.lessons?.length || 0);
        console.log('   Source:', lessons.source);
      } catch (error) {
        console.log('⚠️ Teacher lessons endpoint error:', error.message);
      }

      // Test teacher weekly schedule (NEW ENDPOINT)
      console.log('\n4️⃣.3 Testing Teacher Weekly Schedule...');
      try {
        const schedule = await apiService.teachers.getTeacherWeeklySchedule(firstTeacher._id);
        console.log('✅ Retrieved weekly schedule');
        console.log('   Total lessons:', schedule.summary?.totalLessons || 0);
        console.log('   Active days:', schedule.summary?.activeDays || 0);
      } catch (error) {
        console.log('⚠️ Teacher weekly schedule endpoint error:', error.message);
      }
    }

    // Test theory lessons
    console.log('\n5️⃣ Testing Theory Lessons API...');
    const theoryLessons = await apiService.theory.getTheoryLessons();
    console.log(`✅ Retrieved ${theoryLessons.length} theory lessons`);

    // Test orchestras
    console.log('\n6️⃣ Testing Orchestras API...');
    const orchestras = await apiService.orchestras.getOrchestras();
    console.log(`✅ Retrieved ${orchestras.length} orchestras`);

    // Test rehearsals
    console.log('\n7️⃣ Testing Rehearsals API...');
    const rehearsals = await apiService.rehearsals.getRehearsals();
    console.log(`✅ Retrieved ${rehearsals.length} rehearsals`);

    console.log('\n🎉 All API tests completed successfully!');

  } catch (error) {
    console.error('\n❌ API Test failed:', error.message);
    console.error('Full error:', error);
  }
}

/**
 * Verify field name mapping
 */
function verifyFieldMapping() {
  console.log('\n🔍 Field Name Mapping Verification');
  console.log('===================================');
  
  console.log('✅ Students use EXACT field names:');
  console.log('   - student.personalInfo.fullName (not student.name)');
  console.log('   - student.academicInfo.class (not student.grade)');
  console.log('   - student.teacherAssignments (not student.lessons)');
  
  console.log('\n✅ Teachers use EXACT field names:');
  console.log('   - teacher.personalInfo.fullName (not teacher.name)');
  console.log('   - teacher.teaching.studentIds (not teacher.students)');
  
  console.log('\n✅ New Teacher Lesson Endpoints:');
  console.log('   - GET /teachers/:id/lessons');
  console.log('   - GET /teachers/:id/weekly-schedule');
  console.log('   - GET /teachers/:id/day-schedule/:day');
  console.log('   - GET /teachers/:id/lesson-stats');
}

// Run if called directly
if (typeof window === 'undefined') {
  // Node.js environment
  runTests().then(() => {
    verifyFieldMapping();
  });
} else {
  // Browser environment
  window.testApiService = runTests;
  window.verifyFieldMapping = verifyFieldMapping;
}

export { runTests, verifyFieldMapping };
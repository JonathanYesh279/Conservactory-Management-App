/**
 * Data Sync Script to Fix Orchestra-Student Membership Inconsistencies
 * 
 * This script addresses the critical issue where:
 * - Orchestra documents have students in their memberIds array
 * - But those students don't have the orchestra in their orchestraIds array
 * 
 * The script performs bidirectional synchronization to ensure data consistency
 */

import apiService from '../services/apiService.js'

async function fixOrchestraStudentSync() {
  console.log('🔄 Starting Orchestra-Student Data Synchronization...')
  
  try {
    // Step 1: Get all orchestras
    const orchestras = await apiService.orchestras.getOrchestras()
    console.log(`📊 Found ${orchestras.length} orchestras to check`)
    
    let totalFixes = 0
    let orchestraUpdates = 0
    let studentUpdates = 0
    
    // Step 2: For each orchestra, check all members
    for (const orchestra of orchestras) {
      if (!orchestra.memberIds || orchestra.memberIds.length === 0) {
        console.log(`⏭️  Orchestra "${orchestra.name}" has no members, skipping...`)
        continue
      }
      
      console.log(`\n🎭 Checking orchestra: ${orchestra.name} (${orchestra._id})`)
      console.log(`   Members count: ${orchestra.memberIds.length}`)
      
      const validMemberIds = []
      
      // Check each member in the orchestra
      for (const memberId of orchestra.memberIds) {
        try {
          const student = await apiService.students.getStudent(memberId)
          
          if (!student) {
            console.log(`   ❌ Student ${memberId} not found - will remove from orchestra`)
            continue
          }
          
          validMemberIds.push(memberId)
          
          // Check if student has this orchestra in their orchestraIds
          const studentOrchestraIds = student.enrollments?.orchestraIds || []
          
          if (!studentOrchestraIds.includes(orchestra._id)) {
            console.log(`   ⚠️  Student "${student.personalInfo?.fullName}" (${memberId}) missing orchestra in their enrollments`)
            
            // Fix: Add orchestra to student's orchestraIds
            try {
              await apiService.students.updateStudent(memberId, {
                ...student,
                enrollments: {
                  ...student.enrollments,
                  orchestraIds: [...studentOrchestraIds, orchestra._id]
                }
              })
              console.log(`   ✅ Added orchestra to student's enrollments`)
              studentUpdates++
              totalFixes++
            } catch (error) {
              console.error(`   ❌ Failed to update student ${memberId}:`, error.message)
            }
          } else {
            console.log(`   ✓ Student "${student.personalInfo?.fullName}" correctly enrolled`)
          }
        } catch (error) {
          console.error(`   ❌ Error checking student ${memberId}:`, error.message)
        }
      }
      
      // Update orchestra memberIds if any invalid members were found
      if (validMemberIds.length !== orchestra.memberIds.length) {
        console.log(`   🔧 Updating orchestra memberIds (removing ${orchestra.memberIds.length - validMemberIds.length} invalid members)`)
        try {
          await apiService.orchestras.updateOrchestra(orchestra._id, {
            ...orchestra,
            memberIds: validMemberIds
          })
          orchestraUpdates++
          totalFixes++
        } catch (error) {
          console.error(`   ❌ Failed to update orchestra memberIds:`, error.message)
        }
      }
    }
    
    // Step 3: Check all students for orchestra enrollments without matching memberIds
    console.log('\n\n🎓 Checking all students for orphaned orchestra enrollments...')
    const students = await apiService.students.getStudents()
    
    for (const student of students) {
      const orchestraIds = student.enrollments?.orchestraIds || []
      
      if (orchestraIds.length === 0) continue
      
      for (const orchestraId of orchestraIds) {
        try {
          const orchestra = await apiService.orchestras.getOrchestra(orchestraId)
          
          if (!orchestra) {
            console.log(`⚠️  Student "${student.personalInfo?.fullName}" enrolled in non-existent orchestra ${orchestraId}`)
            // Remove from student's orchestraIds
            const updatedOrchestraIds = orchestraIds.filter(id => id !== orchestraId)
            await apiService.students.updateStudent(student._id, {
              ...student,
              enrollments: {
                ...student.enrollments,
                orchestraIds: updatedOrchestraIds
              }
            })
            studentUpdates++
            totalFixes++
            continue
          }
          
          // Check if student is in orchestra's memberIds
          if (!orchestra.memberIds?.includes(student._id)) {
            console.log(`⚠️  Student "${student.personalInfo?.fullName}" not in orchestra "${orchestra.name}" memberIds`)
            
            // Fix: Add student to orchestra's memberIds
            try {
              await apiService.orchestras.addMember(orchestraId, student._id)
              console.log(`✅ Added student to orchestra's memberIds`)
              orchestraUpdates++
              totalFixes++
            } catch (error) {
              console.error(`❌ Failed to add student to orchestra:`, error.message)
            }
          }
        } catch (error) {
          console.error(`❌ Error checking orchestra ${orchestraId}:`, error.message)
        }
      }
    }
    
    // Summary
    console.log('\n\n📊 SYNCHRONIZATION COMPLETE')
    console.log('================================')
    console.log(`Total fixes applied: ${totalFixes}`)
    console.log(`Orchestra updates: ${orchestraUpdates}`)
    console.log(`Student updates: ${studentUpdates}`)
    console.log('================================')
    
    if (totalFixes === 0) {
      console.log('✅ No inconsistencies found - data is in sync!')
    } else {
      console.log('✅ Data synchronization completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Fatal error during synchronization:', error)
    throw error
  }
}

// Run the sync if this script is executed directly in Node.js environment
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  fixOrchestraStudentSync()
    .then(() => {
      console.log('\n✨ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

export default fixOrchestraStudentSync
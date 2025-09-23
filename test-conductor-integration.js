/**
 * Test conductor data integration across orchestra components
 */

import { orchestraService } from './src/services/apiService.js';
import { getConductorName } from './src/utils/orchestraUtils.ts';

const testConductorIntegration = async () => {
  console.log('🧪 Testing conductor data integration...');

  try {
    // Test 1: Get orchestras and check conductor data population
    console.log('\n1. Testing getOrchestras() conductor population:');
    const orchestras = await orchestraService.getOrchestras();
    console.log(`✅ Retrieved ${orchestras.length} orchestras`);

    // Check each orchestra for conductor data
    orchestras.forEach((orchestra, index) => {
      const conductorName = getConductorName(orchestra);
      console.log(`  Orchestra ${index + 1}: "${orchestra.name}" - Conductor: ${conductorName}`);

      if (orchestra.conductorId) {
        if (orchestra.conductor && orchestra.conductor.personalInfo) {
          console.log(`  ✅ Conductor data properly populated for ${orchestra.name}`);
        } else {
          console.log(`  ❌ Conductor data missing for ${orchestra.name} (ID: ${orchestra.conductorId})`);
        }
      } else {
        console.log(`  ℹ️ No conductor assigned to ${orchestra.name}`);
      }
    });

    // Test 2: Get a specific orchestra and check conductor data
    if (orchestras.length > 0) {
      console.log('\n2. Testing getOrchestra() conductor population:');
      const firstOrchestra = orchestras[0];
      const detailedOrchestra = await orchestraService.getOrchestra(firstOrchestra._id);

      console.log(`✅ Retrieved detailed data for "${detailedOrchestra.name}"`);

      if (detailedOrchestra.conductorId) {
        if (detailedOrchestra.conductor && detailedOrchestra.conductor.personalInfo) {
          console.log(`  ✅ Conductor data populated in detailed view`);
          console.log(`  Conductor: ${detailedOrchestra.conductor.personalInfo.fullName}`);
        } else if (detailedOrchestra.conductorInfo) {
          console.log(`  ✅ ConductorInfo populated in detailed view`);
          console.log(`  Conductor: ${detailedOrchestra.conductorInfo.name}`);
        } else {
          console.log(`  ❌ No conductor data in detailed view despite conductorId: ${detailedOrchestra.conductorId}`);
        }
      }
    }

    // Test 3: Test utility function
    console.log('\n3. Testing getConductorName utility function:');
    const testOrchestra = {
      conductor: {
        personalInfo: {
          fullName: 'Test Conductor'
        }
      }
    };
    const testName = getConductorName(testOrchestra);
    console.log(`✅ Utility function returns: "${testName}"`);

    const testOrchestraNoData = { conductorId: 'test-id' };
    const testNameNoData = getConductorName(testOrchestraNoData);
    console.log(`✅ Utility function with no data returns: "${testNameNoData}"`);

    console.log('\n🎉 Conductor integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Only run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  testConductorIntegration();
}

export { testConductorIntegration };
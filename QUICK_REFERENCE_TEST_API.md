# Test Update API - Quick Reference Card

## Quick Start

```javascript
import { studentService } from './services/apiService.js';
import { TEST_STATUSES } from './utils/testStatusUtils';

// Update stage test (auto-advances stage if passed)
await studentService.updateStudentStageTest(
  studentId,
  'פסנתר',
  TEST_STATUSES.PASSED
);

// Update technical test (does NOT advance stage)
await studentService.updateStudentTechnicalTest(
  studentId,
  'פסנתר',
  TEST_STATUSES.PASSED_WITH_DISTINCTION
);
```

## Valid Test Statuses

```javascript
TEST_STATUSES.NOT_TESTED                   // "לא נבחן"
TEST_STATUSES.PASSED                       // "עבר/ה"
TEST_STATUSES.FAILED                       // "לא עבר/ה"
TEST_STATUSES.PASSED_WITH_DISTINCTION      // "עבר/ה בהצטיינות"
TEST_STATUSES.PASSED_WITH_HIGH_DISTINCTION // "עבר/ה בהצטיינות יתרה"
```

## Common Helpers

```javascript
import {
  isPassingStatus,
  isFailingStatus,
  canAdvanceStage,
  getTestStatusColorClass,
  getTestStatusIcon,
  formatTestDate
} from './utils/testStatusUtils';

// Check status type
isPassingStatus('עבר/ה')  // true
isFailingStatus('לא עבר/ה') // true

// Check if stage will advance
canAdvanceStage(3, 'עבר/ה') // true (if not at max stage)
canAdvanceStage(8, 'עבר/ה') // false (already at max)

// UI helpers
getTestStatusColorClass('עבר/ה')
// Returns: "bg-green-100 text-green-800 border-green-300"

getTestStatusIcon('עבר/ה') // "✓"
formatTestDate(new Date()) // "15 באוקטובר 2025"
```

## Error Handling

```javascript
import { TEST_ERROR_MESSAGES } from './utils/testStatusUtils';

try {
  await studentService.updateStudentStageTest(id, instrument, status);
} catch (error) {
  // Error message is already in Hebrew
  alert(error.message);
}
```

## React Component Pattern

```tsx
function TestUpdater({ student }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status) => {
    setLoading(true);
    try {
      const primary = student.academicInfo.instrumentProgress
        .find(i => i.isPrimary);

      await studentService.updateStudentStageTest(
        student._id,
        primary.instrumentName,
        status
      );

      // Refresh data...
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select onChange={(e) => handleUpdate(e.target.value)}>
      {Object.values(TEST_STATUSES).map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
```

## Stage Advancement Rules

| Current Status | New Status | Stage Advances? |
|----------------|------------|-----------------|
| לא נבחן | עבר/ה | ✅ Yes (if stage < 8) |
| לא עבר/ה | עבר/ה | ✅ Yes (if stage < 8) |
| עבר/ה | עבר/ה בהצטיינות | ❌ No |
| לא נבחן | לא עבר/ה | ❌ No |

**Note:** Technical tests NEVER advance stage

## Key Points

1. ✅ **Stage tests** auto-advance stage when passing
2. ❌ **Technical tests** do NOT advance stage
3. 🔄 Cache is automatically invalidated
4. 📝 All errors are in Hebrew
5. 🎯 Max stage is 8 (won't increment beyond)
6. 🔐 Requires authentication (teacher/admin)

## File Locations

- **API Methods:** `/src/services/apiService.js` (lines 804-946)
- **Utilities:** `/src/utils/testStatusUtils.ts`
- **Types:** `/src/types/testTypes.ts`
- **Full Docs:** `/src/services/TEST_UPDATE_API_DOCUMENTATION.md`

## TypeScript Support

```typescript
import type { TestStatus, TestType } from './types/testTypes';

const status: TestStatus = TEST_STATUSES.PASSED;
const type: TestType = 'stageTest';
```

## Need Help?

- Check `/src/services/TEST_UPDATE_API_DOCUMENTATION.md` for full documentation
- Check backend logs for API errors
- Verify student and instrument exist in database

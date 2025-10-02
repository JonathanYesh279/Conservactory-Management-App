# Stage Test Update Feature - Testing Guide

## Feature Overview
This feature allows administrators to update student stage test and technical test results, with automatic stage level advancement when tests are passed.

## Components Implemented

### 1. **Updated Files**
- `/src/features/students/details/types/index.ts` - Added test fields to InstrumentProgress interface
- `/src/features/students/details/components/tabs/AcademicInfoTab.tsx` - Main UI implementation
- `/src/services/apiService.js` - Added `updateStageTestStatus` method

### 2. **New Files Created**
- `/src/features/students/details/components/modals/StageAdvancementConfirmModal.tsx` - Confirmation modal

## Test Scenarios

### Scenario 1: Admin Updates Stage Test to Passing Status
**Steps:**
1. Login as admin user
2. Navigate to student details → Academic Info tab
3. Click "ערוך תוצאות מבחנים" (Edit Test Results)
4. Change stage test status to "עבר/ה" (Passed)
5. Click "שמור שינויים" (Save Changes)

**Expected Result:**
- Confirmation modal appears showing current stage → new stage
- Modal text: "שים לב: עדכון תוצאת מבחן השלב יעלה את התלמיד משלב X לשלב Y. האם להמשיך?"
- User can confirm or cancel

### Scenario 2: Admin Confirms Stage Advancement
**Steps:**
1. Follow Scenario 1 steps 1-5
2. In the confirmation modal, click "כן, עדכן את השלב" (Yes, Update)

**Expected Result:**
- Stage test status updated to "עבר/ה"
- Student stage advances by 1 (e.g., stage 3 → stage 4)
- Success message displayed: "תוצאות המבחנים עודכנו בהצלחה!"
- Page refreshes after 1.5 seconds

### Scenario 3: Admin Cancels Stage Advancement
**Steps:**
1. Follow Scenario 1 steps 1-5
2. In the confirmation modal, click "ביטול" (Cancel)

**Expected Result:**
- Test status updated WITHOUT stage advancement
- Stage remains the same
- Success message displayed

### Scenario 4: Stage 8 Edge Case (Max Stage)
**Steps:**
1. Login as admin
2. Find student already at stage 8
3. Try to update stage test to passing status

**Expected Result:**
- Test status updated
- NO stage advancement (already at max)
- No confirmation modal shown
- Success message displayed

### Scenario 5: Update Technical Test Only
**Steps:**
1. Login as admin
2. Navigate to student Academic Info tab
3. Click "ערוך תוצאות מבחנים"
4. Change ONLY technical test status (not stage test)
5. Click "שמור שינויים"

**Expected Result:**
- Technical test status updated
- NO stage advancement
- No confirmation modal
- Success message displayed

### Scenario 6: Non-Admin User (Read-Only)
**Steps:**
1. Login as non-admin user (teacher, conductor, etc.)
2. Navigate to student Academic Info tab

**Expected Result:**
- Test results displayed in read-only format
- No "ערוך תוצאות מבחנים" button visible
- Status shown as colored badges (green for passed, red for failed, etc.)

### Scenario 7: API Error Handling
**Steps:**
1. Login as admin
2. Disconnect network or simulate API failure
3. Try to update test status

**Expected Result:**
- Error message displayed in Hebrew
- Changes NOT saved
- Edit mode remains active
- User can retry

### Scenario 8: Multiple Instruments
**Steps:**
1. Login as admin
2. Find student with multiple instruments
3. Update test statuses for different instruments
4. Save changes

**Expected Result:**
- All test statuses updated
- Stage advancement only for instruments with passing stage tests
- Confirmation modal shows if any instrument triggers advancement

### Scenario 9: Test Status Options
**Verify all test status options are available:**
- לא נבחן (Not Tested)
- נכשל/ה (Failed)
- עבר/ה (Passed)
- עבר/ה בהצטיינות (Passed with Distinction)
- עבר/ה בהצטיינות יתרה (Passed with High Distinction)
- ממתין/ה (Waiting)
- פטור/ה (Exempt)

### Scenario 10: Cancel Edit Mode
**Steps:**
1. Login as admin
2. Click "ערוך תוצאות מבחנים"
3. Make changes to test statuses
4. Click "ביטול" (Cancel)

**Expected Result:**
- Edit mode closed
- All changes discarded
- Original test statuses displayed
- No API calls made

## Visual Validation

### Color Coding
- **Green background**: Passing statuses (עבר/ה, עבר/ה בהצטיינות, etc.)
- **Red background**: Failed status (נכשל/ה)
- **Yellow background**: Waiting status (ממתין/ה)
- **Blue background**: Exempt status (פטור/ה)
- **Gray background**: Not tested (לא נבחן)

### RTL (Right-to-Left) Support
- All Hebrew text displays correctly right-to-left
- Buttons and form elements aligned properly
- Modal layout mirrors correctly

### Responsive Design
- Test results section displays properly on mobile (single column)
- Test results section displays in 2 columns on large screens
- Modal is responsive and centered

## Accessibility Checklist
- [ ] Modal has proper ARIA labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus management when modal opens/closes
- [ ] Screen reader announces modal content
- [ ] All interactive elements have focus indicators

## Performance Considerations
- Test data fetched once and cached
- Optimistic updates for better UX
- Rollback on error
- Minimal re-renders

## Data Validation
- Stage cannot exceed 8
- Test status must be from predefined list
- Instrument name must match existing instrument
- Student ID validation

## Known Limitations
- Page refresh required after successful update (by design for data consistency)
- Only admins can edit (feature requirement)
- One test update per instrument at a time

## Troubleshooting

### Issue: Edit button not showing
**Solution:** Verify user has admin role in auth context

### Issue: Stage not advancing
**Solution:**
- Check current stage is < 8
- Verify test status is in PASSING_STATUSES array
- Confirm autoAdvanceStage flag is true

### Issue: Modal not appearing
**Solution:**
- Check stageAdvancementData is set
- Verify showStageModal state is true
- Check for console errors

### Issue: Changes not saving
**Solution:**
- Check network connectivity
- Verify API endpoint is accessible
- Check browser console for errors
- Verify student data structure matches API expectations

# Stage Test Update Feature - Flow Diagrams

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Navigates to                         │
│              Student Details → Academic Info Tab             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   Is Admin?     │
                   └────┬────────┬───┘
                        │        │
                   Yes  │        │  No
                        ▼        ▼
          ┌──────────────────┐  ┌────────────────────┐
          │ Show Edit Button │  │  Read-Only View    │
          │ "ערוך תוצאות    │  │  (Colored Badges)  │
          │   מבחנים"       │  │                    │
          └────────┬─────────┘  └────────────────────┘
                   │
          Click Edit Button
                   ▼
          ┌──────────────────────────────┐
          │  Enable Edit Mode            │
          │  - Show dropdowns            │
          │  - Show Save/Cancel buttons  │
          │  - Load current test values  │
          └────────┬─────────────────────┘
                   │
          User changes test status
                   ▼
          ┌──────────────────┐
          │  Click "שמור     │
          │   שינויים"      │
          └────────┬─────────┘
                   │
                   ▼
          ┌────────────────────────────┐
          │ Did Stage Test Change to   │
          │    Passing Status?         │
          └────┬─────────────────┬─────┘
               │                 │
           Yes │                 │ No
               ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Is Current Stage │  │  Save Directly   │
    │      < 8?        │  │  (No Modal)      │
    └────┬────────┬────┘  └────────┬─────────┘
         │        │                 │
     Yes │        │ No              │
         ▼        ▼                 │
    ┌─────────────────────┐         │
    │ Show Confirmation   │         │
    │ Modal with:         │         │
    │ - Current Stage     │         │
    │ - New Stage (cur+1) │         │
    │ - Confirm/Cancel    │         │
    └────┬───────────┬────┘         │
         │           │              │
    Confirm      Cancel             │
         │           │              │
         ▼           ▼              │
    ┌─────────┐  ┌──────────┐      │
    │ Save +  │  │   Save   │      │
    │ Advance │  │  No      │      │
    │  Stage  │  │ Advance  │      │
    └────┬────┘  └────┬─────┘      │
         │            │             │
         └────────────┴─────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   API Call    │
              │ updateStage   │
              │  TestStatus   │
              └───────┬───────┘
                      │
              ┌───────┴────────┐
              │                │
          Success          Error
              │                │
              ▼                ▼
    ┌──────────────────┐  ┌───────────────┐
    │ Show Success Msg │  │ Show Error Msg│
    │ "תוצאות המבחנים │  │ Keep Edit Mode│
    │ עודכנו בהצלחה!" │  │ Allow Retry   │
    └────────┬─────────┘  └───────────────┘
             │
             ▼
    ┌──────────────────┐
    │  Refresh Page    │
    │  (after 1.5s)    │
    └──────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────┐
│           AcademicInfoTab Component                 │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         State Management                      │ │
│  │  - isEditingTests: boolean                    │ │
│  │  - editedTestData: Record<string, any>        │ │
│  │  - isSaving: boolean                          │ │
│  │  - saveError: string | null                   │ │
│  │  - saveSuccess: boolean                       │ │
│  │  - showStageModal: boolean                    │ │
│  │  - stageAdvancementData: object | null        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         Event Handlers                        │ │
│  │  - handleEditTests()                          │ │
│  │  - handleCancelEdit()                         │ │
│  │  - handleTestStatusChange()                   │ │
│  │  - handleSaveTests()                          │ │
│  │  - saveTestUpdates()                          │ │
│  │  - handleConfirmStageAdvancement()            │ │
│  │  - handleCancelStageAdvancement()             │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │         UI Rendering                          │ │
│  │                                               │ │
│  │  ┌─────────────────────────────────────────┐ │ │
│  │  │  Test Results Section                   │ │ │
│  │  │  ┌─────────────────────────────────┐    │ │ │
│  │  │  │ Edit Button (Admin Only)        │    │ │ │
│  │  │  └─────────────────────────────────┘    │ │ │
│  │  │  ┌─────────────────────────────────┐    │ │ │
│  │  │  │ Save/Cancel Buttons (Edit Mode) │    │ │ │
│  │  │  └─────────────────────────────────┘    │ │ │
│  │  │  ┌─────────────────────────────────┐    │ │ │
│  │  │  │ Success/Error Messages          │    │ │ │
│  │  │  └─────────────────────────────────┘    │ │ │
│  │  │  ┌─────────────────────────────────┐    │ │ │
│  │  │  │ Instrument Test Cards (Grid)    │    │ │ │
│  │  │  │  - Stage Test Dropdown/Badge    │    │ │ │
│  │  │  │  - Technical Test Dropdown/Badge│    │ │ │
│  │  │  │  - Current Stage Indicator      │    │ │ │
│  │  │  └─────────────────────────────────┘    │ │ │
│  │  └─────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │   StageAdvancementConfirmModal (Conditional)  │ │
│  │   - Shows when showStageModal = true          │ │
│  │   - Displays stage progression visualization  │ │
│  │   - Confirm/Cancel buttons                    │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ Uses
                         ▼
┌─────────────────────────────────────────────────────┐
│              API Service Layer                      │
│         (apiService.students)                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  updateStageTestStatus(studentId,             │ │
│  │                       instrumentName,         │ │
│  │                       testData)               │ │
│  │                                               │ │
│  │  1. Get current student data                 │ │
│  │  2. Find instrument by name                  │ │
│  │  3. Check if stage advancement needed        │ │
│  │  4. Update tests object                      │ │
│  │  5. Optionally increment currentStage        │ │
│  │  6. Call updateStudent() with new data       │ │
│  │  7. Return updated student                   │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                         │
                         │ HTTP Request
                         ▼
┌─────────────────────────────────────────────────────┐
│              Backend API                            │
│         PUT /api/student/:id                        │
│                                                     │
│  - Validates request data                           │
│  - Updates student in MongoDB                       │
│  - Returns updated student object                   │
└─────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Initial Page Load                     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │  Fetch Student   │
                   │  Data from API   │
                   └────────┬─────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  Extract Instrument Data    │
              │  with Test Statuses:        │
              │                             │
              │  {                          │
              │    instrumentName: string   │
              │    currentStage: number     │
              │    tests: {                 │
              │      stageTest: {           │
              │        status: string       │
              │      },                     │
              │      technicalTest: {       │
              │        status: string       │
              │      }                      │
              │    }                        │
              │  }                          │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │  Display in Read-Only View   │
              │  (Colored Badges)            │
              └──────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    User Clicks Edit                      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Initialize editedTestData   │
              │  with current values:        │
              │                              │
              │  {                           │
              │    [instrumentName]: {       │
              │      stageTestStatus: str    │
              │      technicalTestStatus: str│
              │      currentStage: num       │
              │    }                         │
              │  }                           │
              └─────────────┬────────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │  Set isEditingTests = true   │
              │  Show Dropdowns              │
              └──────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  User Changes Test Status                │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Update editedTestData state │
              │  (local state only)          │
              └──────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    User Clicks Save                      │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  Check for Stage Advancement  │
              │  Logic:                       │
              │  - Is stageTest now passing?  │
              │  - Was it NOT passing before? │
              │  - Is currentStage < 8?       │
              └────────┬──────────────┬───────┘
                       │              │
                 Yes   │              │  No
                       ▼              ▼
         ┌──────────────────┐  ┌───────────────┐
         │ Set stage        │  │ Call API      │
         │ AdvancementData  │  │ directly with │
         │ Show Modal       │  │ autoAdvance   │
         │                  │  │ = false       │
         └────────┬─────────┘  └───────┬───────┘
                  │                     │
         User Confirms/Cancels          │
                  │                     │
                  ▼                     │
         ┌──────────────────┐           │
         │ Call API with    │           │
         │ autoAdvance =    │           │
         │ true/false       │           │
         └────────┬─────────┘           │
                  └─────────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  API Updates Backend          │
              │  - Update test statuses       │
              │  - Increment stage if needed  │
              │  - Save to MongoDB            │
              └─────────────┬─────────────────┘
                            │
                  ┌─────────┴─────────┐
                  │                   │
             Success               Error
                  │                   │
                  ▼                   ▼
         ┌────────────────┐  ┌────────────────┐
         │ Show Success   │  │ Show Error     │
         │ Message        │  │ Message        │
         │ Refresh Page   │  │ Stay in Edit   │
         │ (1.5s delay)   │  │ Mode           │
         └────────────────┘  └────────────────┘
```

## Stage Advancement Logic

```
Input:
  - oldStageTestStatus (from database)
  - newStageTestStatus (from user input)
  - currentStage (from database)

Constants:
  PASSING_STATUSES = ['עבר/ה', 'עבר/ה בהצטיינות', 'עבר/ה בהצטיינות יתרה']
  MAX_STAGE = 8

Logic:
  shouldAdvanceStage =
    newStageTestStatus IN PASSING_STATUSES
    AND
    oldStageTestStatus NOT IN PASSING_STATUSES
    AND
    currentStage < MAX_STAGE

  IF shouldAdvanceStage:
    newStage = currentStage + 1
    SHOW confirmation modal

    IF user confirms:
      UPDATE stage to newStage
      UPDATE test status to newStageTestStatus
    ELSE:
      UPDATE test status to newStageTestStatus only
  ELSE:
    UPDATE test status to newStageTestStatus only
```

## State Transition Diagram

```
┌─────────────┐
│   Initial   │
│   (View)    │
└──────┬──────┘
       │
   Edit Click
       │
       ▼
┌─────────────┐      Save/Cancel
│   Editing   │◄─────────────┐
│             │               │
└──────┬──────┘               │
       │                      │
  Save Click                  │
       │                      │
       ▼                      │
┌─────────────────┐          │
│ Checking Stage  │          │
│  Advancement    │          │
└────────┬────────┘          │
         │                   │
   ┌─────┴─────┐            │
   │           │            │
Needs       Doesn't         │
Advance     Need            │
   │           │            │
   ▼           ▼            │
┌──────┐  ┌────────┐       │
│Modal │  │ Saving │       │
│Shown │  │        │       │
└──┬───┘  └───┬────┘       │
   │          │             │
Confirm/      │             │
Cancel        │             │
   │          │             │
   ▼          ▼             │
┌────────────────┐          │
│     Saving     │          │
│                │          │
└───────┬────────┘          │
        │                   │
   ┌────┴────┐             │
   │         │             │
Success   Error            │
   │         │             │
   ▼         └─────────────┘
┌────────────┐
│  Success   │
│ (Refreshing)│
└────────────┘
```

## Permission Check Flow

```
                  ┌──────────────────┐
                  │  Component Mounts│
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Get user from   │
                  │  useAuth() hook  │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────────────┐
                  │  Check:                  │
                  │  user.roles.includes     │
                  │  ('admin')               │
                  │  OR                      │
                  │  user.role === 'admin'   │
                  └────────┬─────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                 true          false
                    │             │
                    ▼             ▼
          ┌──────────────┐  ┌─────────────┐
          │ Set isAdmin  │  │ Set isAdmin │
          │ = true       │  │ = false     │
          └──────┬───────┘  └──────┬──────┘
                 │                  │
                 ▼                  ▼
          ┌─────────────────────────────────┐
          │  Conditional Rendering:         │
          │                                 │
          │  IF isAdmin:                    │
          │    - Show Edit Button           │
          │    - Show Save/Cancel (edit)    │
          │    - Enable Dropdowns           │
          │  ELSE:                          │
          │    - Hide Edit Button           │
          │    - Show Read-Only Badges      │
          │    - Disable Interactions       │
          └─────────────────────────────────┘
```

---

**Note**: All Hebrew text in diagrams represents actual UI labels used in the application.

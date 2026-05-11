# Design Document: Incomplete Features Completion

## Overview

This design addresses seven incomplete features in the REMO restaurant management system. The system is built with Next.js, TypeScript, React, and Firebase/Firestore. The features span branch management UI, branch-filtered alerts, language persistence, worker unavailability marking, automatic sick leave processing, schedule notifications, and swap schedule updates.

### Design Goals

1. **Branch Management UI**: Provide admins with a complete interface to create, update, and delete branches
2. **Branch-Filtered Alerts**: Ensure users see only alerts relevant to their branch, while admins see all alerts with branch identification
3. **Language Persistence**: Maintain user language preferences across login sessions and throughout the dashboard
4. **Worker Unavailability**: Enable managers to quickly mark workers unavailable and trigger shortage alerts
5. **Automatic Sick Leave**: Calculate remaining shift time automatically when workers report sick leave
6. **Schedule Notifications**: Notify workers when assigned to shifts or when assignments change
7. **Swap Schedule Updates**: Automatically update the scheduler when swap requests are approved

### Key Constraints

- Must integrate seamlessly with existing Firebase/Firestore architecture
- Must respect existing role-based access control (ADMIN, MANAGER, EMPLOYEE)
- Must maintain real-time synchronization using Firestore listeners
- Must support multi-language interface (English, Russian, Latvian)
- Must work within existing component structure and styling patterns

## Architecture

### System Context

The application follows a client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Components Layer                     │ │
│  │  - Dashboard Components                                 │ │
│  │  - Branch Management UI                                 │ │
│  │  - Scheduler, Alerts, Notifications                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Service Layer                              │ │
│  │  - data-service.ts (shifts, notifications, branches)    │ │
│  │  - user-service.ts (profiles, shortage alerts)          │ │
│  │  - groq-service.ts (AI optimization)                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Context Providers                          │ │
│  │  - AuthProvider (user authentication)                   │ │
│  │  - LanguageProvider (i18n state)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Firebase/Firestore                          │
│  Collections:                                                │
│  - users (profiles with branch assignments)                  │
│  - branches (branch metadata)                                │
│  - shifts (weekly schedules)                                 │
│  - shortageAlerts (staffing gaps)                            │
│  - notifications (in-app messages)                           │
│  - swapRequests (shift exchange requests)                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The design follows the existing component structure:

1. **Dashboard Layer**: `restaurant-dashboard.tsx` orchestrates all views
2. **Feature Components**: Self-contained components for each feature (branch-management, weekly-scheduler, shortage-alerts, etc.)
3. **Shared Providers**: Language and authentication context available to all components
4. **Service Layer**: Abstracted Firestore operations with real-time subscriptions

### Data Flow Patterns

**Real-time Updates**: All features use Firestore `onSnapshot` listeners for live data synchronization

**Notification Flow**:
```
Action (shift assignment, swap approval, etc.)
  → Service layer creates notification document
  → Firestore triggers onSnapshot listener
  → NotificationBell component updates UI
  → User sees notification in real-time
```

**Language Persistence Flow**:
```
User selects language
  → LanguageProvider updates state
  → localStorage stores preference
  → All components re-render with new translations
  → On next login, localStorage value restores preference
```

## Components and Interfaces

### 1. Branch Management UI (Requirement 1)

**Component**: `components/dashboard/branch-management.tsx` (already exists, needs completion)

**Current State**: The component has a complete UI for creating, editing, and deleting branches. It already integrates with `data-service.ts` functions.

**Required Changes**: None - the component is functionally complete. The service layer functions (`saveBranch`, `updateBranch`, `deleteBranch`, `subscribeToBranches`) are already implemented.

**Interface**:
```typescript
interface Branch {
  id: string
  name: string
  address?: string
  managerId?: string
  createdAt: any
}

// Service functions (already implemented)
function saveBranch(branch: Omit<Branch, "id" | "createdAt">): Promise<string>
function updateBranch(id: string, data: Partial<Omit<Branch, "id" | "createdAt">>): Promise<void>
function deleteBranch(id: string): Promise<void>
function subscribeToBranches(cb: (branches: Branch[]) => void): Unsubscribe
```

### 2. Branch-Filtered Alerts (Requirement 2)

**Components**: 
- `components/dashboard/shortage-alerts.tsx` (needs filtering logic)
- `lib/services/user-service.ts` (needs branch-aware queries)

**Required Changes**:
1. Add `branchId` field to all alert creation operations (already present in data model)
2. Filter alerts based on user's branch assignment in `getAllShortageAlerts()`
3. For admins, display all alerts with branch name visible
4. For managers/employees, filter to show only alerts matching `profile.branch`

**Interface**:
```typescript
// Enhanced service function
async function getAllShortageAlerts(
  userProfile: UserProfile
): Promise<ShortageAlert[]> {
  // If ADMIN: return all alerts
  // If MANAGER/EMPLOYEE: filter by userProfile.branch
}
```

### 3. Language Persistence (Requirement 3)

**Component**: `components/providers/language-provider.tsx` (already exists)

**Current State**: The LanguageProvider already:
- Stores language preference in localStorage
- Loads preference on mount
- Provides language context to all components
- Updates all translations immediately when language changes

**Required Changes**: None - language persistence is already fully implemented. The provider loads from localStorage on mount and saves on every change.

**Interface**:
```typescript
interface LanguageContextType {
  lang: AppLanguage  // "en" | "ru" | "lv"
  setLang: (l: AppLanguage) => void
  t: typeof translations["en"]  // Translation object
}

// Usage in components
const { lang, setLang, t } = useLang()
```

### 4. Mark Worker Unavailable (Requirement 4)

**Component**: `components/dashboard/weekly-scheduler.tsx` (needs enhancement)

**Current State**: The scheduler has a `handleMarkUnavailable` function that:
- Updates shift status to "vacant"
- Creates a shortage alert
- Calculates remaining shift time
- Broadcasts notification

**Required Changes**: The functionality is already implemented. The "mark as unavailable" button appears on hover for each shift card when the user is a manager or admin.

**Interface**:
```typescript
async function handleMarkUnavailable(shift: Shift): Promise<void> {
  // 1. Mark shift as vacant
  await updateShift(shift.id, { status: "vacant", staffId: null, staffName: null })
  
  // 2. Calculate remaining time (current time to shift end)
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  
  // 3. Create shortage alert
  await createShortageAlert({
    zone: shift.zone,
    date: shift.day,
    startTime: currentTime,
    endTime: shift.endTime,
    reason: `Worker marked unavailable — ${shift.staffName}`,
    priority: "HIGH",
    status: "OPEN"
  })
  
  // 4. Broadcast notification
  await sendNotification("all", "🚨 Emergency Vacancy", message, "shortage")
}
```

### 5. Automatic Sick Leave Processing (Requirement 5)

**Component**: `lib/services/user-service.ts` (needs enhancement)

**Current State**: The `reportSickLeave` function creates a shortage alert but doesn't remove the worker from scheduled shifts.

**Required Changes**:
1. Query all shifts for the employee within the sick leave period
2. Mark each shift as vacant
3. Create a single shortage alert covering the entire period
4. Send notifications to affected managers

**Interface**:
```typescript
async function reportSickLeave(
  employee: UserProfile,
  sickLeaveType: SickLeaveType,
  zone: WorkZone,
  date: string,
  startTime: string,
  endTime: string,
  note: string
): Promise<string> {
  // 1. Find all shifts for this employee in the time window
  const shifts = await getShiftsForEmployee(employee.uid, date, startTime, endTime)
  
  // 2. Mark each shift as vacant
  await Promise.all(shifts.map(shift => 
    updateShift(shift.id, { status: "vacant", staffId: null, staffName: null })
  ))
  
  // 3. Create shortage alert
  const alertId = await createShortageAlert({...})
  
  // 4. Notify managers
  await sendNotification("all", "Sick Leave Reported", message, "shortage")
  
  return alertId
}
```

### 6. Schedule Notification (Requirement 6)

**Component**: `components/dashboard/weekly-scheduler.tsx` (needs enhancement)

**Current State**: The `AddShiftModal` component already sends a notification when a shift is created:
```typescript
await sendNotification(
  staffId,
  "New Shift Assigned",
  `You have been assigned a ${zone} shift on ${day} from ${startTime} to ${endTime}.`,
  "shift"
)
```

**Required Changes**: Add notification when shifts are modified (not just created).

**Interface**:
```typescript
// In shift update operations
async function notifyShiftChange(
  staffId: string,
  shift: Shift,
  changeType: "assigned" | "modified" | "removed"
): Promise<void> {
  const messages = {
    assigned: `You have been assigned a ${shift.zone} shift on ${shift.day} from ${shift.startTime} to ${shift.endTime}.`,
    modified: `Your ${shift.zone} shift on ${shift.day} has been updated to ${shift.startTime} - ${shift.endTime}.`,
    removed: `Your ${shift.zone} shift on ${shift.day} has been removed.`
  }
  
  await sendNotification(staffId, "Schedule Update", messages[changeType], "shift")
}
```

### 7. Swap Schedule Update (Requirement 7)

**Component**: New component needed - `components/dashboard/swap-requests.tsx`

**Current State**: The emergency board shows swap requests, but approval doesn't update the scheduler.

**Required Changes**:
1. Create swap request data model in Firestore
2. Implement swap approval logic that exchanges shift assignments
3. Update scheduler to reflect swapped assignments
4. Send notifications to both workers

**Interface**:
```typescript
interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  targetId: string
  targetName: string
  shiftId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: any
}

async function approveSwapRequest(swapId: string): Promise<void> {
  // 1. Get swap request details
  const swap = await getSwapRequest(swapId)
  
  // 2. Get the shift being swapped
  const shift = await getShift(swap.shiftId)
  
  // 3. Update shift assignment
  await updateShift(swap.shiftId, {
    staffId: swap.targetId,
    staffName: swap.targetName
  })
  
  // 4. Update swap request status
  await updateSwapRequest(swapId, { status: "APPROVED" })
  
  // 5. Notify both workers
  await sendNotification(swap.requesterId, "Swap Approved", message, "swap")
  await sendNotification(swap.targetId, "Swap Approved", message, "swap")
}
```

## Data Models

### Existing Models (No Changes Required)

```typescript
interface Branch {
  id: string
  name: string
  address?: string
  managerId?: string
  createdAt: any
}

interface ShortageAlert {
  id: string
  createdBy: string
  createdByName: string
  branchId: string          // Already present
  branchName: string        // Already present
  zone: WorkZone
  date: string
  startTime: string
  endTime: string
  reason: string
  priority: "HIGH" | "NORMAL"
  sickLeaveType?: SickLeaveType
  status: "OPEN" | "FILLED" | "CANCELLED"
  aiSuggestedUid?: string
  aiReason?: string
  createdAt: any
}

interface Shift {
  id: string
  staffId: string | null    // null means vacant
  staffName: string | null
  branchId: string
  zone: WorkZone | string
  day: string
  startTime: string
  endTime: string
  isEmergency: boolean
  status: "upcoming" | "completed" | "vacant" | "swap_requested" | "optimal"
  weekLabel?: string        // For querying by week
}

interface AppNotification {
  id: string
  uid: string               // recipient uid, or "all" for broadcast
  title: string
  body: string
  type: "shortage" | "swap" | "taxi" | "shift" | "general"
  read: boolean
  createdAt: any
}

interface UserProfile {
  uid: string
  email: string
  role: AppRole
  createdAt: any
  name?: string
  phone?: string
  position?: string
  branch?: string           // Branch assignment for filtering
  skills?: WorkerSkill[]
  workerTypes?: WorkZone[]
}
```

### New Models Required

```typescript
interface SwapRequest {
  id: string
  requesterId: string       // Employee requesting the swap
  requesterName: string
  requesterShiftId: string  // Shift they want to give away
  targetId: string          // Employee they want to swap with
  targetName: string
  targetShiftId: string     // Shift they want to take
  status: "PENDING" | "APPROVED_BY_TARGET" | "APPROVED_BY_MANAGER" | "REJECTED"
  createdAt: any
  approvedAt?: any
}
```

### Firestore Collections

```
/users/{uid}
  - User profiles with branch assignments

/branches/{branchId}
  - Branch metadata

/shifts/{shiftId}
  - Weekly schedule entries

/shortageAlerts/{alertId}
  - Staffing shortage notifications

/shortageResponses/{responseId}
  - Employee responses to shortage alerts

/notifications/{notificationId}
  - In-app notification messages

/swapRequests/{swapId}
  - Shift swap requests (NEW)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- **2.4 is redundant with 2.1**: Both test branch-based alert filtering for non-admin users
- **4.4 is redundant with 4.2**: Both verify shift status updates when marking unavailable
- **7.3 is redundant with 7.1**: Both verify shift assignment exchange during swap approval

These redundant properties will be consolidated into single, comprehensive properties.

### Property 1: Branch Creation Persistence

*For any* valid branch data (name, address, managerId), creating a branch through the admin interface should result in a document in Firestore with a unique branchId and all provided fields.

**Validates: Requirements 1.2**

### Property 2: Branch Update Round-Trip

*For any* existing branch and any valid update data, updating the branch then immediately reading it should reflect all the changes.

**Validates: Requirements 1.3**

### Property 3: Branch Deletion Removes Data

*For any* existing branch, deleting it should result in that branchId no longer appearing in Firestore queries.

**Validates: Requirements 1.4**

### Property 4: All Branches Visible to Admins

*For any* set of branches in Firestore, when an admin user views the branch management interface, all branches should be displayed in the list.

**Validates: Requirements 1.5**

### Property 5: Non-Admin Alert Filtering

*For any* non-admin user with a branch assignment, all alerts returned by the alert query should have a branchId matching the user's assigned branch.

**Validates: Requirements 2.1, 2.4**

### Property 6: Admin Sees All Alerts

*For any* admin user, the alert query should return all alerts from all branches without filtering.

**Validates: Requirements 2.2**

### Property 7: Alert Branch Association

*For any* alert creation operation, the resulting alert document in Firestore should contain a non-empty branchId field.

**Validates: Requirements 2.3**

### Property 8: Language Selection Persistence

*For any* language selection (en, ru, lv), the selected language should be stored in localStorage and retrievable on subsequent page loads.

**Validates: Requirements 3.1**

### Property 9: Language Restoration on Login

*For any* language stored in localStorage, when the dashboard mounts, the LanguageProvider should initialize with that language and all components should render in that language.

**Validates: Requirements 3.2**

### Property 10: Language Change Reactivity

*For any* language change operation, all components using the translation context should immediately re-render with translations from the new language.

**Validates: Requirements 3.4**

### Property 11: Unavailable Button Presence

*For any* shift with a non-null staffId, when viewed by a manager or admin, the shift card should display a "mark as unavailable" button.

**Validates: Requirements 4.1**

### Property 12: Mark Unavailable Updates Shift

*For any* assigned shift, marking the worker as unavailable should update the shift in Firestore with staffId set to null and status set to "vacant".

**Validates: Requirements 4.2, 4.4**

### Property 13: Unavailability Creates Alert

*For any* shift marked as unavailable, a shortage alert should be created with the shift's zone, date, and remaining time (current time to shift end).

**Validates: Requirements 4.3**

### Property 14: Sick Leave Time Calculation

*For any* sick leave submission, the created shortage alert should have a startTime equal to the current time (not a manually entered time).

**Validates: Requirements 5.1**

### Property 15: Sick Leave Removes All Shifts

*For any* sick leave period (date, startTime, endTime), all shifts for the reporting employee within that period should be marked as vacant.

**Validates: Requirements 5.2**

### Property 16: Sick Leave Creates Alert

*For any* sick leave submission, a shortage alert should be created with priority "HIGH" if the leave type is "SUDDEN_ILLNESS", otherwise "NORMAL".

**Validates: Requirements 5.3**

### Property 17: Shift Assignment Notification

*For any* shift creation with a staffId, a notification should be created for that worker with type "shift" and a message containing the zone, day, startTime, and endTime.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 18: Shift Modification Notification

*For any* shift update that changes the staffId, startTime, or endTime, a notification should be sent to the affected worker(s).

**Validates: Requirements 6.4**

### Property 19: Swap Approval Exchanges Assignments

*For any* approved swap request, the two shifts involved should have their staffId and staffName fields exchanged in Firestore.

**Validates: Requirements 7.1, 7.3**

### Property 20: Swap Real-Time Update

*For any* swap approval, the scheduler component should reflect the updated assignments within the real-time listener's update cycle (typically < 1 second).

**Validates: Requirements 7.2, 7.5**

### Property 21: Swap Completion Notifications

*For any* completed swap, both the requester and the target worker should receive notifications with type "swap" confirming the exchange.

**Validates: Requirements 7.4**

## Error Handling

### Validation Errors

**Branch Management**:
- Empty branch name → Display error message "Branch name is required"
- Duplicate branch name → Allow (branches can have same name in different locations)
- Invalid managerId → Allow (manager assignment is optional)

**Alert Filtering**:
- User with no branch assignment → Show no alerts (empty list)
- Missing branchId in alert → Exclude from results (data integrity issue)

**Language Selection**:
- Invalid language code in localStorage → Fall back to "en" (English)
- Missing translation key → Display key name as fallback

**Shift Operations**:
- Mark unavailable on already vacant shift → No-op (idempotent)
- Sick leave with no matching shifts → Create alert anyway (worker may have future shifts)

**Swap Requests**:
- Approve already-approved swap → No-op (idempotent)
- Swap with non-existent shift → Reject with error message

### Network Errors

All Firestore operations should handle network failures gracefully:

```typescript
try {
  await firestoreOperation()
} catch (error) {
  if (error.code === 'unavailable') {
    // Show retry UI
    setError("Network unavailable. Please try again.")
  } else if (error.code === 'permission-denied') {
    // Show permission error
    setError("You don't have permission to perform this action.")
  } else {
    // Generic error
    setError("An error occurred. Please try again.")
  }
}
```

### Concurrent Modification

Firestore transactions should be used for operations that require atomicity:

- **Swap approval**: Use transaction to ensure both shifts are updated together
- **Sick leave processing**: Use batch write to update multiple shifts atomically

### Data Consistency

**Real-time Listener Conflicts**:
- If a shift is deleted while a user is marking it unavailable → Operation fails gracefully, UI updates via listener
- If a branch is deleted while alerts exist → Alerts remain (soft delete pattern)

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Example: Admin can access branch management, employee cannot
- Example: Language selector displays three options (en, ru, lv)
- Example: Sick leave form does not have time window input fields
- Edge case: Empty branch name validation
- Edge case: Marking an already-vacant shift as unavailable
- Integration: Notification bell displays new notifications in real-time

**Property Tests**: Verify universal properties across all inputs
- All properties listed in the Correctness Properties section
- Minimum 100 iterations per property test
- Use random data generation for branches, shifts, alerts, users

### Property-Based Testing Configuration

**Library Selection**: 
- **JavaScript/TypeScript**: Use `fast-check` library
- Install: `npm install --save-dev fast-check @types/fast-check`

**Test Structure**:
```typescript
import fc from 'fast-check'

describe('Feature: incomplete-features-completion, Property 2: Branch Update Round-Trip', () => {
  it('should persist all branch updates to Firestore', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          address: fc.option(fc.string({ maxLength: 100 })),
          managerId: fc.option(fc.uuid())
        }),
        async (updateData) => {
          // Create initial branch
          const branchId = await saveBranch({ name: 'Test Branch' })
          
          // Update branch
          await updateBranch(branchId, updateData)
          
          // Read back
          const branches = await getBranches()
          const updated = branches.find(b => b.id === branchId)
          
          // Verify all fields match
          expect(updated?.name).toBe(updateData.name)
          if (updateData.address) expect(updated?.address).toBe(updateData.address)
          if (updateData.managerId) expect(updated?.managerId).toBe(updateData.managerId)
          
          // Cleanup
          await deleteBranch(branchId)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

**Tag Format**: Each property test must include a comment tag:
```typescript
// Feature: incomplete-features-completion, Property 1: Branch Creation Persistence
```

### Test Coverage Goals

- **Branch Management**: 100% coverage of CRUD operations
- **Alert Filtering**: Test all role combinations (admin, manager, employee)
- **Language Persistence**: Test all three languages and localStorage edge cases
- **Shift Operations**: Test all shift statuses and role permissions
- **Notifications**: Test all notification types and delivery scenarios
- **Swap Requests**: Test all swap states and approval flows

### Integration Testing

**Real Firestore Testing**:
- Use Firebase Emulator Suite for integration tests
- Test real-time listener behavior
- Verify security rules enforcement

**End-to-End Testing**:
- Use Playwright or Cypress for UI testing
- Test complete user flows (e.g., admin creates branch → manager creates shift → worker receives notification)
- Verify multi-language UI rendering

### Performance Testing

**Real-time Listener Performance**:
- Test with 100+ shifts in a single week
- Verify UI remains responsive during rapid updates
- Measure notification delivery latency

**Query Performance**:
- Test alert filtering with 1000+ alerts across 10+ branches
- Verify query execution time < 500ms
- Monitor Firestore read costs

## Implementation Notes

### Phase 1: Data Layer (Completed)

The following are already implemented and require no changes:
- Branch CRUD operations in `data-service.ts`
- Language persistence in `language-provider.tsx`
- Notification system in `data-service.ts`
- Shift operations in `data-service.ts`

### Phase 2: Business Logic (Partially Complete)

**Completed**:
- Branch management UI with full CRUD
- Mark worker unavailable with alert creation
- Shift assignment notifications

**Needs Implementation**:
1. **Branch-filtered alerts**: Modify `getAllShortageAlerts()` to accept `UserProfile` and filter by branch
2. **Automatic sick leave**: Enhance `reportSickLeave()` to query and update shifts
3. **Shift modification notifications**: Add notification calls to shift update operations
4. **Swap request system**: Create new collection, service functions, and UI component

### Phase 3: UI Enhancements (Minimal)

Most UI components are complete. Only needed:
1. Update `shortage-alerts.tsx` to pass user profile to filtering function
2. Add swap request approval UI to emergency board or create new component

### Phase 4: Testing

1. Set up `fast-check` library
2. Write property-based tests for all 21 properties
3. Write unit tests for edge cases and examples
4. Configure Firebase Emulator for integration tests
5. Set up E2E test suite with Playwright

### Migration Considerations

**Existing Data**:
- Branches: Already have `branchId` field
- Alerts: Already have `branchId` and `branchName` fields
- Users: Already have `branch` field for assignment
- No data migration required

**Backward Compatibility**:
- All changes are additive (new functions, enhanced queries)
- Existing functionality remains unchanged
- No breaking changes to existing components

### Security Considerations

**Firestore Rules**:
```javascript
// Branch management - admin only
match /branches/{branchId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
}

// Alerts - filtered by branch
match /shortageAlerts/{alertId} {
  allow read: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN' ||
    resource.data.branchId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.branch
  );
  allow create: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'MANAGER']);
}

// Swap requests
match /swapRequests/{swapId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    request.resource.data.requesterId == request.auth.uid;
  allow update: if request.auth != null && (
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['ADMIN', 'MANAGER'] ||
    request.resource.data.targetId == request.auth.uid
  );
}
```

### Performance Optimizations

**Query Optimization**:
- Use composite indexes for branch + status queries
- Limit alert queries to recent alerts (last 30 days)
- Cache branch list in memory (changes infrequently)

**Real-time Listener Optimization**:
- Use single `where` clause per query to avoid composite index requirements
- Sort results client-side when needed
- Unsubscribe from listeners when components unmount

**Notification Optimization**:
- Batch notifications when possible (e.g., sick leave affecting multiple managers)
- Use "all" uid for broadcast messages instead of creating individual notifications
- Implement notification cleanup (delete read notifications older than 7 days)

## Deployment Strategy

### Rollout Plan

**Phase 1: Backend Changes**
1. Deploy enhanced service functions (alert filtering, sick leave processing)
2. Create swap requests collection
3. Update Firestore security rules
4. Verify with integration tests

**Phase 2: UI Updates**
1. Deploy updated shortage alerts component with filtering
2. Deploy swap request UI
3. Verify real-time updates work correctly

**Phase 3: Monitoring**
1. Monitor Firestore read/write costs
2. Track notification delivery latency
3. Monitor user feedback for language persistence issues

### Rollback Plan

If issues arise:
1. Revert service function changes (restore previous version)
2. Keep Firestore data intact (no destructive changes)
3. UI components can be individually reverted without affecting data layer

### Feature Flags

Consider using feature flags for:
- Swap request system (new feature, may need refinement)
- Branch-filtered alerts (can be toggled per user role)

## Conclusion

This design addresses all seven incomplete features with minimal changes to the existing codebase. Most functionality is already implemented; the primary work involves:

1. Enhancing alert filtering logic to respect branch assignments
2. Extending sick leave processing to automatically update shifts
3. Adding notifications for shift modifications
4. Implementing the swap request approval system

The design maintains consistency with existing patterns, respects the current architecture, and provides comprehensive testing strategies to ensure correctness.

# Implementation Plan: Incomplete Features Completion

## Overview

This plan implements four incomplete features in the REMO restaurant management system: branch-filtered alerts, automatic sick leave processing, shift modification notifications, and swap schedule updates. Three features (Branch Management UI, Language Persistence, Mark Worker Unavailable) are already complete and require no implementation.

The implementation uses TypeScript with Next.js, React, and Firebase/Firestore. All property-based tests will use the fast-check library.

## Tasks

- [x] 1. Set up testing infrastructure
  - Install fast-check library and TypeScript types
  - Create test directory structure for property-based tests
  - Configure test runner for property tests
  - _Requirements: All (testing foundation)_

- [x] 2. Implement branch-filtered alerts
  - [x] 2.1 Enhance getAllShortageAlerts function in user-service.ts
    - Accept UserProfile parameter
    - Filter alerts by branch for non-admin users
    - Return all alerts for admin users
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 2.2 Update shortage-alerts.tsx component
    - Pass user profile to getAllShortageAlerts
    - Display branch name for admin users viewing all alerts
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 2.3 Write property test for non-admin alert filtering
    - **Property 5: Non-Admin Alert Filtering**
    - **Validates: Requirements 2.1, 2.4**
  
  - [ ]* 2.4 Write property test for admin sees all alerts
    - **Property 6: Admin Sees All Alerts**
    - **Validates: Requirements 2.2**
  
  - [ ]* 2.5 Write property test for alert branch association
    - **Property 7: Alert Branch Association**
    - **Validates: Requirements 2.3**

- [x] 3. Implement automatic sick leave processing
  - [x] 3.1 Create getShiftsForEmployee helper function in data-service.ts
    - Query shifts by staffId within date/time range
    - Return all matching shifts sorted by day and time
    - _Requirements: 5.2_
  
  - [x] 3.2 Enhance reportSickLeave function in user-service.ts
    - Query all shifts for employee in sick leave period
    - Use batch write to mark all shifts as vacant
    - Calculate remaining time automatically (current time to shift end)
    - Create shortage alert with calculated time window
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 3.3 Write property test for sick leave time calculation
    - **Property 14: Sick Leave Time Calculation**
    - **Validates: Requirements 5.1**
  
  - [ ]* 3.4 Write property test for sick leave removes all shifts
    - **Property 15: Sick Leave Removes All Shifts**
    - **Validates: Requirements 5.2**
  
  - [ ]* 3.5 Write property test for sick leave creates alert
    - **Property 16: Sick Leave Creates Alert**
    - **Validates: Requirements 5.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement shift modification notifications
  - [x] 5.1 Create notifyShiftChange helper function in data-service.ts
    - Accept staffId, shift, and changeType parameters
    - Generate appropriate message based on changeType
    - Call sendNotification with shift details
    - _Requirements: 6.4_
  
  - [x] 5.2 Add notification calls to shift update operations in weekly-scheduler.tsx
    - Detect when staffId, startTime, or endTime changes
    - Call notifyShiftChange for affected workers
    - Handle both assignment and modification cases
    - _Requirements: 6.1, 6.4_
  
  - [ ]* 5.3 Write property test for shift assignment notification
    - **Property 17: Shift Assignment Notification**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [ ]* 5.4 Write property test for shift modification notification
    - **Property 18: Shift Modification Notification**
    - **Validates: Requirements 6.4**

- [x] 6. Implement swap request system
  - [x] 6.1 Create SwapRequest interface in lib/types.ts
    - Define all required fields (requesterId, targetId, shiftIds, status)
    - Add TypeScript types for swap status enum
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 6.2 Create swap request service functions in data-service.ts
    - Implement createSwapRequest function
    - Implement getSwapRequests function with real-time subscription
    - Implement approveSwapRequest function with transaction
    - Implement rejectSwapRequest function
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 6.3 Implement swap approval logic in approveSwapRequest
    - Use Firestore transaction for atomicity
    - Exchange staffId and staffName between two shifts
    - Update swap request status to APPROVED
    - Send notifications to both workers
    - _Requirements: 7.1, 7.3, 7.4_
  
  - [x] 6.4 Create swap-requests.tsx component
    - Display list of pending swap requests
    - Add approve/reject buttons for managers and admins
    - Show swap details (requester, target, shift info)
    - Subscribe to real-time updates
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 6.5 Integrate swap requests into emergency-board.tsx or dashboard
    - Add swap requests section to appropriate dashboard view
    - Wire up component with real-time data
    - _Requirements: 7.1, 7.5_
  
  - [ ]* 6.6 Write property test for swap approval exchanges assignments
    - **Property 19: Swap Approval Exchanges Assignments**
    - **Validates: Requirements 7.1, 7.3**
  
  - [ ]* 6.7 Write property test for swap real-time update
    - **Property 20: Swap Real-Time Update**
    - **Validates: Requirements 7.2, 7.5**
  
  - [ ]* 6.8 Write property test for swap completion notifications
    - **Property 21: Swap Completion Notifications**
    - **Validates: Requirements 7.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Write property tests for completed features
  - [ ]* 8.1 Write property test for branch creation persistence
    - **Property 1: Branch Creation Persistence**
    - **Validates: Requirements 1.2**
  
  - [ ]* 8.2 Write property test for branch update round-trip
    - **Property 2: Branch Update Round-Trip**
    - **Validates: Requirements 1.3**
  
  - [ ]* 8.3 Write property test for branch deletion removes data
    - **Property 3: Branch Deletion Removes Data**
    - **Validates: Requirements 1.4**
  
  - [ ]* 8.4 Write property test for all branches visible to admins
    - **Property 4: All Branches Visible to Admins**
    - **Validates: Requirements 1.5**
  
  - [ ]* 8.5 Write property test for language selection persistence
    - **Property 8: Language Selection Persistence**
    - **Validates: Requirements 3.1**
  
  - [ ]* 8.6 Write property test for language restoration on login
    - **Property 9: Language Restoration on Login**
    - **Validates: Requirements 3.2**
  
  - [ ]* 8.7 Write property test for language change reactivity
    - **Property 10: Language Change Reactivity**
    - **Validates: Requirements 3.4**
  
  - [ ]* 8.8 Write property test for unavailable button presence
    - **Property 11: Unavailable Button Presence**
    - **Validates: Requirements 4.1**
  
  - [ ]* 8.9 Write property test for mark unavailable updates shift
    - **Property 12: Mark Unavailable Updates Shift**
    - **Validates: Requirements 4.2, 4.4**
  
  - [ ]* 8.10 Write property test for unavailability creates alert
    - **Property 13: Unavailability Creates Alert**
    - **Validates: Requirements 4.3**

- [x] 9. Update Firestore security rules
  - [x] 9.1 Add security rules for swap requests collection
    - Allow read for authenticated users
    - Allow create for employees (own requests only)
    - Allow update for managers, admins, and target workers
    - _Requirements: 7.1, 7.2_
  
  - [x] 9.2 Verify branch-filtered alert rules
    - Ensure admins can read all alerts
    - Ensure non-admins can only read alerts matching their branch
    - _Requirements: 2.1, 2.2_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties using fast-check library
- All property tests should run with minimum 100 iterations
- Three features are already complete: Branch Management UI (Req 1), Language Persistence (Req 3), Mark Worker Unavailable (Req 4)
- Focus is on implementing the four incomplete features: branch-filtered alerts, automatic sick leave, shift notifications, and swap requests

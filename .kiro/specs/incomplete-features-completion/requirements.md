# Requirements Document

## Introduction

This document specifies requirements for completing six incomplete features in the restaurant management system. These features include branch management UI, language persistence across the application, worker unavailability marking, automatic shift time calculation, schedule notifications, and swap schedule updates.

## Glossary

- **System**: The restaurant management application (Next.js with Firebase/Firestore)
- **Admin**: User with administrative privileges who can manage branches and system-wide settings
- **Manager**: User who can create schedules, manage staff, and approve requests
- **Worker**: Employee who is assigned to shifts and can request changes
- **Branch**: A physical restaurant location with its own staff and operations
- **Alert**: A notification or warning displayed in the system (e.g., shortage alerts, emergency alerts)
- **Scheduler**: The weekly schedule view component that displays shift assignments
- **Shift**: A scheduled work period assigned to a worker
- **Sick_Leave_Form**: The form used by workers to report illness and unavailability
- **Swap_Request**: A request from one worker to exchange shifts with another worker
- **Language_Selector**: UI component allowing users to choose their preferred language
- **Dashboard**: The main application interface displayed after login
- **Notification**: A message sent to inform users of events or changes

## Requirements

### Requirement 1: Branch Management UI

**User Story:** As an admin, I want to create and manage branches through a UI, so that I can organize the restaurant system by location.

#### Acceptance Criteria

1. THE System SHALL provide a branch management interface accessible only to admins
2. WHEN an admin creates a branch, THE System SHALL store the branch with a unique branchId and branchName in Firestore
3. WHEN an admin updates a branch, THE System SHALL persist the changes to Firestore
4. WHEN an admin deletes a branch, THE System SHALL remove the branch from Firestore
5. THE System SHALL display a list of all branches to admins

### Requirement 2: Branch-Filtered Alerts

**User Story:** As a manager, I want to see only alerts relevant to my branch, so that I can focus on my location's issues.

#### Acceptance Criteria

1. WHEN a user views alerts, THE System SHALL filter alerts to show only those associated with the user's assigned branch
2. WHEN an admin views alerts, THE System SHALL display alerts from all branches with branch identification
3. THE System SHALL associate each alert with a branchId when created
4. WHILE a user is assigned to a specific branch, THE System SHALL restrict alert visibility to that branch only

### Requirement 3: Language Persistence

**User Story:** As a user, I want my language preference to persist throughout the application, so that I can use the system in my preferred language after login.

#### Acceptance Criteria

1. WHEN a user selects a language, THE System SHALL store the language preference in the user's session
2. WHEN a user logs in, THE System SHALL apply the stored language preference to the dashboard
3. THE System SHALL provide a language selector accessible from the dashboard
4. WHEN a user changes language in the dashboard, THE System SHALL update all translated content immediately
5. THE System SHALL translate all dashboard components according to the selected language

### Requirement 4: Mark Worker Unavailable

**User Story:** As a manager, I want to mark a worker as unavailable for a shift, so that I can quickly handle staffing changes.

#### Acceptance Criteria

1. THE Scheduler SHALL display a "mark as unavailable" button for each assigned shift
2. WHEN a manager marks a worker as unavailable, THE System SHALL remove the worker from that shift in the scheduler
3. WHEN a worker is marked unavailable, THE System SHALL create an alert notifying relevant managers
4. THE System SHALL update the shift status in Firestore when a worker is marked unavailable

### Requirement 5: Automatic Sick Leave Processing

**User Story:** As a worker, I want the system to automatically remove me from scheduled shifts when I report sick leave, so that I don't have to manually specify time windows.

#### Acceptance Criteria

1. WHEN a worker submits the sick leave form, THE System SHALL calculate the remaining shift time automatically
2. WHEN sick leave is submitted, THE System SHALL remove the worker from all shifts within the sick leave period
3. THE System SHALL create an alert when sick leave is processed
4. THE Sick_Leave_Form SHALL not require manual entry of time windows

### Requirement 6: Schedule Notification

**User Story:** As a worker, I want to receive a notification when I'm assigned to a shift, so that I'm aware of my schedule changes.

#### Acceptance Criteria

1. WHEN a manager assigns a worker to a shift, THE System SHALL send a notification to that worker
2. THE Notification SHALL include the shift date, time, and location
3. THE System SHALL deliver the notification through the in-app notification system
4. WHEN a manager modifies an existing shift assignment, THE System SHALL send an updated notification to the affected worker

### Requirement 7: Swap Schedule Update

**User Story:** As a manager, I want the schedule to automatically update when I approve a swap request, so that the scheduler reflects the current assignments.

#### Acceptance Criteria

1. WHEN a manager approves a swap request, THE System SHALL update the scheduler to reflect the swap
2. WHEN Worker B accepts a swap, THE System SHALL update the schedule immediately
3. THE System SHALL exchange shift assignments between the two workers in Firestore
4. WHEN a swap is completed, THE System SHALL send notifications to both workers confirming the change
5. THE Scheduler SHALL display the updated assignments after a swap is approved

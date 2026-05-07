# REMO - Smart Restaurant Management System

## 🎯 Project Overview

REMO (Restaurant Employee Management & Operations) is an AI-powered, real-time restaurant management platform designed to solve critical operational challenges in multi-branch restaurant environments. The system automates scheduling, handles staff emergencies, coordinates transport, manages inventory, and provides intelligent staffing recommendations using advanced AI.

### The Problem REMO Solves

Traditional restaurant management faces several critical challenges:
- **Staff Shortages**: When employees call in sick or don't show up, managers scramble to find replacements
- **Manual Scheduling**: Creating optimal schedules across multiple branches is time-consuming and error-prone
- **Communication Gaps**: Broadcasting urgent needs across branches requires multiple phone calls
- **Transport Coordination**: Late-night shifts and emergency calls require taxi arrangements
- **Skill Matching**: Finding the right person with the right skills for emergency shifts is difficult
- **Multi-branch Complexity**: Coordinating staff across multiple locations adds layers of complexity

### The REMO Solution

REMO provides a unified platform that:
1. **Instantly broadcasts** staff shortages to all branches
2. **Uses AI** to recommend the best replacement based on skills and availability
3. **Automates** transport requests with policy enforcement
4. **Provides real-time** notifications and updates
5. **Supports** three languages (English, Russian, Lithuanian)
6. **Enforces** role-based access control for security
7. **Tracks** inventory, forecasts demand, and manages tasks

---

## 🏗️ System Architecture

### Technology Stack

**Frontend:**
- **Next.js 16.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.7.3** - Type safety
- **Tailwind CSS 4.2.0** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.38.0** - Animations
- **Recharts 2.15.0** - Data visualization
- **Lucide React** - Icon library

**Backend & Services:**
- **Firebase Authentication** - User authentication
- **Cloud Firestore** - NoSQL database
- **Groq AI (LLaMA 3.3 70B)** - AI-powered recommendations
- **Next.js API Routes** - Serverless functions

**Development & Testing:**
- **Vitest 4.1.5** - Unit testing framework
- **Fast-check 4.7.0** - Property-based testing
- **pnpm** - Package manager

**Deployment:**
- **Netlify** - Hosting and CI/CD
- **Firebase Hosting** - Alternative deployment option

### Project Structure

```
remo/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── groq/                 # AI service endpoint
│   │   └── bootstrap-admin/      # Admin setup
│   ├── landing/                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main dashboard entry
│   └── globals.css               # Global styles
├── components/
│   ├── auth/                     # Authentication components
│   │   ├── login-page.tsx        # Login/signup interface
│   │   └── role-management.tsx   # Role assignment UI
│   ├── dashboard/                # Dashboard features
│   │   ├── restaurant-dashboard.tsx  # Main dashboard
│   │   ├── weekly-scheduler.tsx      # Schedule management
│   │   ├── shortage-alerts.tsx       # Staff shortage system
│   │   ├── emergency-board.tsx       # Emergency shift board
│   │   ├── swap-requests.tsx         # Shift swap system
│   │   ├── taxi-management.tsx       # Transport requests
│   │   ├── inventory-management.tsx  # Stock tracking
│   │   ├── demand-forecast.tsx       # Demand predictions
│   │   ├── task-board.tsx            # Task management
│   │   ├── staff-directory.tsx       # Employee directory
│   │   ├── user-management.tsx       # User admin
│   │   ├── branch-management.tsx     # Branch admin
│   │   └── notification-bell.tsx     # Real-time notifications
│   ├── providers/                # Context providers
│   │   ├── auth-provider.tsx     # Authentication state
│   │   └── language-provider.tsx # i18n support
│   └── ui/                       # Reusable UI components (59 files)
├── lib/
│   ├── services/                 # Business logic
│   │   ├── user-service.ts       # User & auth operations
│   │   ├── data-service.ts       # CRUD operations
│   │   ├── groq-service.ts       # AI integration
│   │   └── taxi-service.ts       # Transport logic
│   ├── firebase.ts               # Firebase configuration
│   ├── types.ts                  # TypeScript definitions
│   ├── auth-types.ts             # Auth type definitions
│   └── utils.ts                  # Utility functions
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   └── property-based/           # Property-based tests
├── public/                       # Static assets
├── firestore.rules               # Database security rules
├── netlify.toml                  # Netlify configuration
└── package.json                  # Dependencies

```

---

## 🔐 Authentication & Authorization

### Authentication System

REMO uses **Firebase Authentication** with multiple sign-in methods:

1. **Email/Password Authentication**
   - Standard email and password login
   - Password validation and secure storage
   - Password reset functionality

2. **Google OAuth**
   - One-click Google sign-in
   - Automatic profile creation
   - Seamless integration

### User Roles & Permissions

The system implements a three-tier role-based access control (RBAC) system:

#### 1. ADMIN Role
**Full system access** - Can perform all operations

**Permissions:**
- Create, read, update, delete all users
- Assign and modify user roles
- Manage all branches
- Access all data across branches
- Configure system settings
- View all reports and analytics
- Override any restrictions

**Use Case:** Restaurant owners, IT administrators

#### 2. MANAGER Role
**Operational management** - Can manage day-to-day operations

**Permissions:**
- Create and optimize schedules
- Broadcast shortage alerts
- Approve/reject taxi requests
- Manage inventory
- Create and assign tasks
- View branch-specific data
- Approve shift swaps
- Access demand forecasts

**Restrictions:**
- Cannot modify user roles
- Cannot delete users
- Limited to assigned branch data (unless admin grants cross-branch access)

**Use Case:** Restaurant managers, shift supervisors

#### 3. EMPLOYEE Role
**Self-service access** - Can manage own schedule and respond to requests

**Permissions:**
- View personal schedule
- Accept/deny emergency shifts
- Request shift swaps
- Report sick leave
- Request taxi transport
- View assigned tasks
- Update profile and skills

**Restrictions:**
- Cannot view other employees' schedules
- Cannot create schedules
- Cannot approve requests
- Limited to own branch data

**Use Case:** Waiters, chefs, kitchen staff, hosts

### Security Implementation

**Firestore Security Rules:**
```javascript
// Users can read all profiles but only update their own
match /users/{userId} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == userId || isAdmin();
}

// Only managers and admins can create/update shifts
match /shifts/{shiftId} {
  allow read: if request.auth != null;
  allow write: if isManagerOrAdmin();
}
```

**Bootstrap Process:**
- First user to sign up automatically becomes ADMIN
- Subsequent users default to EMPLOYEE role
- Admins can promote users to MANAGER or ADMIN

---

## 🚀 Core Features

### 1. Smart Scheduling System

**Purpose:** Create and manage weekly staff schedules across multiple branches and work zones.

**Technical Implementation:**
- **Component:** `components/dashboard/weekly-scheduler.tsx`
- **Service:** `lib/services/data-service.ts` - `getShifts()`, `saveShift()`, `updateShift()`
- **Data Model:** `Shift` type with fields: staffId, branchId, zone, day, startTime, endTime, status

**Features:**
- **Visual Calendar View:** 7-day grid showing all shifts
- **Zone-based Organization:** Shifts organized by work zones (Meat, Salad, Grill, Fries, Dishwashing, Bar, Waiter, Kitchen, Host)
- **Drag-and-Drop:** Reassign shifts by dragging staff members
- **Status Indicators:**
  - `upcoming` - Scheduled shift
  - `completed` - Past shift
  - `vacant` - No staff assigned
  - `swap_requested` - Pending swap approval
  - `optimal` - AI-verified optimal staffing

**AI Integration:**
- Groq AI analyzes schedules for optimization
- Detects understaffing (not enough skilled workers)
- Identifies overworked staff (>10h/day or >50h/week)
- Suggests optimal staffing levels

**Workflow:**
1. Manager creates weekly schedule template
2. Assigns staff to shifts based on zones and skills
3. AI validates schedule for conflicts and optimization
4. Employees view their assigned shifts
5. System tracks shift completion

---

### 2. Shortage Alert System

**Purpose:** Broadcast urgent staff shortage needs across all branches with AI-powered matching.

**Technical Implementation:**
- **Component:** `components/dashboard/shortage-alerts.tsx`
- **Service:** `lib/services/user-service.ts` - `createShortageAlert()`, `getAllShortageAlerts()`
- **AI Service:** `lib/services/groq-service.ts` - `matchShortage()`
- **Data Model:** `ShortageAlert` with priority levels and AI suggestions

**Features:**

#### For Managers:
1. **Create Alert Form:**
   - Select work zone needed
   - Specify date and time range
   - Enter reason for shortage
   - Set priority (NORMAL or HIGH)

2. **AI Suggestion:**
   - Click "AI Suggest Best Match" button
   - System fetches all employees with skills
   - Groq AI analyzes:
     - Skill match to required zone
     - Proficiency level (Expert > Intermediate > Beginner)
     - Current workload
     - Availability
   - Returns recommended employee with reasoning

3. **Broadcast:**
   - Alert sent to all branches
   - Real-time notification to all employees
   - AI suggestion highlighted for recommended employee

#### For Employees:
1. **View Alerts:**
   - See all open shortage alerts
   - AI-recommended employees see special badge
   - View alert details (zone, time, reason, priority)

2. **Respond:**
   - Accept or Deny shift
   - First to accept gets the shift
   - Alert status changes to FILLED
   - Other employees notified

**Priority Levels:**
- **HIGH:** Sudden illness, urgent needs (red badge, top of list)
- **NORMAL:** Planned shortages, advance notice

**AI Matching Algorithm:**
```typescript
// Groq AI prompt considers:
- Required zone vs employee skills
- Proficiency levels (Expert/Intermediate/Beginner)
- For HIGH priority: only Expert or Intermediate
- Current workload and recent shifts
- Branch proximity
```

**Workflow:**
1. Employee calls in sick or doesn't show
2. Manager creates shortage alert
3. AI suggests best replacement
4. Alert broadcasts to all employees
5. Employees respond (accept/deny)
6. First acceptance fills the shift
7. Alert marked as FILLED

---

### 3. Emergency Board

**Purpose:** Handle immediate vacant shifts that need instant filling.

**Technical Implementation:**
- **Component:** `components/dashboard/emergency-board.tsx`
- **Service:** `lib/services/data-service.ts` - `getVacantShifts()`, `assignShiftToStaff()`
- **Real-time:** Uses Firestore real-time listeners

**Features:**

#### Vacant Shift Detection:
- Automatically identifies shifts with `status: "vacant"`
- Shows shifts with no assigned staff
- Displays time remaining until shift starts
- Color-coded urgency (red for <2 hours, yellow for <4 hours)

#### Quick Assignment:
- List of available staff with matching skills
- One-click assignment to vacant shift
- Instant notification to assigned employee
- Automatic status update

#### AI Replacement Suggestion:
- Click "AI Suggest" for any vacant shift
- Groq AI analyzes:
  - Vacant shift details (zone, time, branch)
  - Available staff list
  - Skill matching
  - Current workload
  - Branch proximity
- Returns primary recommendation + alternatives
- Shows reasoning for each suggestion

**Workflow:**
1. Shift becomes vacant (sick leave, no-show)
2. Appears on emergency board
3. Manager clicks "AI Suggest"
4. AI recommends best replacement
5. Manager assigns with one click
6. Employee receives notification
7. Shift status updates to "upcoming"

---

### 4. Shift Swap System

**Purpose:** Allow employees to exchange shifts with manager approval.

**Technical Implementation:**
- **Component:** `components/dashboard/swap-requests.tsx`
- **Service:** `lib/services/data-service.ts` - `createSwapRequest()`, `approveSwapRequest()`
- **Data Model:** `SwapRequest` with multi-stage approval

**Features:**

#### For Employees:
1. **Request Swap:**
   - View own upcoming shifts
   - Select shift to swap
   - Choose target employee
   - Select target's shift to swap with
   - Submit request

2. **Respond to Requests:**
   - View incoming swap requests
   - See shift details (both shifts)
   - Accept or reject request
   - Automatic notification to requester

#### For Managers:
1. **Approval Workflow:**
   - View all pending swap requests
   - See both employees and shifts involved
   - Verify no conflicts or policy violations
   - Approve or reject with one click

**Status Flow:**
```
PENDING → APPROVED_BY_TARGET → APPROVED_BY_MANAGER → Shifts Swapped
        ↓
      REJECTED (at any stage)
```

**Validation:**
- Both employees must have compatible skills for swapped zones
- No schedule conflicts created
- Both shifts must be in the future
- Manager final approval required

**Workflow:**
1. Employee A requests to swap with Employee B
2. Employee B receives notification
3. Employee B accepts request
4. Manager receives approval request
5. Manager reviews and approves
6. Shifts automatically swapped in database
7. Both employees notified of completion

---

### 5. Taxi Management System

**Purpose:** Coordinate transport for employees with policy enforcement.

**Technical Implementation:**
- **Component:** `components/dashboard/taxi-management.tsx`
- **Service:** `lib/services/taxi-service.ts` - `requestTaxi()`, `approveTaxiRequest()`
- **AI Validation:** `lib/services/groq-service.ts` - `checkTaxiEligibility()`
- **Data Model:** `TaxiRequest` with type and status

**Transport Policies:**

#### PICKUP Eligibility:
- **Rule:** Only for emergency shifts accepted same day
- **Validation:** AI checks if employee accepted an emergency shift today
- **Reason:** Compensate employees who help in emergencies

#### DROPOFF Eligibility:
- **Rule:** Only for shifts ending at or after 22:00 (10 PM)
- **Validation:** AI checks shift end time
- **Reason:** Safety for late-night workers

**Features:**

#### For Employees:
1. **Request Transport:**
   - Select shift requiring transport
   - Choose PICKUP or DROPOFF
   - Submit request
   - AI validates eligibility
   - Automatic approval/rejection based on policy

2. **View Status:**
   - See all taxi requests
   - Track approval status
   - Receive notifications

#### For Managers:
1. **Review Requests:**
   - View all pending taxi requests
   - See AI eligibility check results
   - Override if necessary (with reason)
   - Approve or reject

2. **Policy Enforcement:**
   - AI automatically validates against rules
   - Managers can override for special cases
   - Audit trail of all decisions

**AI Validation Process:**
```typescript
// Groq AI checks:
1. For PICKUP:
   - Query employee's shifts today
   - Check if any are emergency shifts
   - Check if accepted today
   - Return eligible: true/false with reason

2. For DROPOFF:
   - Check shift end time
   - Compare to 22:00 threshold
   - Return eligible: true/false with reason
```

**Workflow:**
1. Employee requests taxi for shift
2. AI validates against policy
3. If eligible: auto-approve
4. If not eligible: auto-reject with reason
5. Manager can override decision
6. Employee receives notification
7. Transport arranged

---

### 6. Sick Leave Reporting

**Purpose:** Streamline sick leave reporting and automatically create shortage alerts.

**Technical Implementation:**
- **Service:** `lib/services/user-service.ts` - `reportSickLeave()`
- **Automatic Actions:** Marks shifts vacant, creates HIGH priority alert, sends notifications

**Features:**

#### Sick Leave Types:
1. **SUDDEN_ILLNESS:**
   - Same-day illness
   - Creates HIGH priority shortage alert
   - Immediate notification to managers
   - Urgent replacement needed

2. **OTHER:**
   - Planned sick leave
   - Advance notice
   - Creates NORMAL priority alert
   - Standard replacement process

#### Automatic Actions:
When employee reports sick leave:

1. **Find Affected Shifts:**
   - Query all shifts for employee in sick leave period
   - Identify shifts that need coverage

2. **Mark Shifts Vacant:**
   - Batch update all affected shifts
   - Set `staffId: null`, `staffName: null`
   - Change `status: "vacant"`

3. **Create Shortage Alert:**
   - Auto-generate alert for each vacant shift
   - Set priority based on sick leave type
   - Include employee name and reason
   - Calculate time window (current time to shift end)

4. **Notify Managers:**
   - Send real-time notification
   - Include number of shifts affected
   - Provide quick action links

5. **Broadcast to Employees:**
   - Alert appears on all employee dashboards
   - AI suggests best replacements
   - First-come-first-serve acceptance

**Workflow:**
1. Employee feels sick
2. Opens REMO app
3. Reports sick leave (type, date, time range, note)
4. System finds all affected shifts
5. Marks shifts as vacant
6. Creates HIGH priority shortage alert
7. Managers receive notification
8. Alert broadcasts to all employees
9. AI suggests best replacements
10. Employees respond and fill shifts

---

### 7. Inventory Management

**Purpose:** Track stock levels and alert on low inventory.

**Technical Implementation:**
- **Component:** `components/dashboard/inventory-management.tsx`
- **Service:** `lib/services/data-service.ts` - `getInventory()`, `saveInventoryItem()`, `updateInventoryItem()`
- **Data Model:** `InventoryItem` with quantity tracking and status

**Features:**

#### Stock Tracking:
- **Item Details:** Name, category, quantity, unit, minimum stock level
- **Status Indicators:**
  - `in-stock` - Above minimum (green)
  - `low` - Below minimum but available (yellow)
  - `critical` - Very low or out of stock (red)

#### Categories:
- Meat & Seafood
- Vegetables & Fruits
- Dairy & Eggs
- Dry Goods
- Beverages
- Cleaning Supplies
- Disposables

#### Operations:
1. **Add Item:** Create new inventory item with initial quantity
2. **Update Quantity:** Adjust stock levels (add/remove)
3. **Set Minimum:** Define reorder threshold
4. **Delete Item:** Remove from inventory

#### Alerts:
- Automatic status calculation based on quantity vs minimum
- Visual indicators for low stock
- Notifications when items reach critical levels
- Reorder suggestions

**Workflow:**
1. Manager adds inventory items
2. Sets minimum stock levels
3. Updates quantities as stock used/received
4. System monitors levels
5. Alerts when below minimum
6. Manager reorders supplies

---

### 8. Demand Forecasting

**Purpose:** Predict customer demand and optimize staffing levels.

**Technical Implementation:**
- **Component:** `components/dashboard/demand-forecast.tsx`
- **Service:** `lib/services/data-service.ts` - `getForecastEntries()`, `saveForecastEntry()`
- **AI Analysis:** `lib/services/groq-service.ts` - `getForecastInsight()`
- **Visualization:** Recharts for data display

**Features:**

#### Data Collection:
- **Historical Data:** Past customer covers by hour
- **Predicted Data:** Forecasted covers based on trends
- **Hourly Breakdown:** 24-hour view of demand

#### AI Insights:
Groq AI analyzes forecast data and provides:
- **Peak Hour Identification:** When demand is highest
- **Staffing Recommendations:** Suggested staff levels
- **Alerts:** Warnings for understaffing or overstaffing

#### Visualization:
- **Line Chart:** Predicted vs historical comparison
- **Bar Chart:** Hourly demand distribution
- **Trend Indicators:** Up/down arrows for changes
- **Color Coding:** Green (normal), Yellow (busy), Red (peak)

#### Use Cases:
1. **Schedule Optimization:** Plan staff based on predicted demand
2. **Resource Allocation:** Prepare ingredients for busy periods
3. **Cost Control:** Avoid overstaffing during slow periods
4. **Service Quality:** Ensure adequate staff during peaks

**Workflow:**
1. System collects historical cover data
2. AI generates predictions for upcoming dates
3. Manager reviews forecast
4. AI provides staffing recommendations
5. Manager adjusts schedule accordingly
6. System tracks actual vs predicted
7. Improves future predictions

---

### 9. Task Management

**Purpose:** Assign and track daily operational tasks.

**Technical Implementation:**
- **Component:** `components/dashboard/task-board.tsx`
- **Service:** `lib/services/data-service.ts` - `getTasks()`, `saveTask()`, `updateTask()`
- **Real-time:** Firestore listeners for live updates

**Features:**

#### Task Categories:
- **Preparation:** Pre-service setup tasks
- **Cooking:** Kitchen operations
- **Serving:** Front-of-house tasks
- **Cleaning:** Sanitation and maintenance
- **Inventory Management:** Stock-related tasks

#### Priority Levels:
- **High:** Urgent, must be done immediately (red)
- **Medium:** Important, should be done soon (yellow)
- **Low:** Can be done when time permits (green)

#### Task Properties:
- Title and description
- Category and priority
- Assigned employee
- Time window (when task should be completed)
- Work zone
- Status (pending, in-progress, completed)

#### Operations:
1. **Create Task:** Manager assigns new task
2. **Assign:** Allocate to specific employee
3. **Update Status:** Employee marks progress
4. **Complete:** Mark as done
5. **Reassign:** Change assignee if needed

**Workflow:**
1. Manager creates daily tasks
2. Assigns to employees by zone
3. Employees view assigned tasks
4. Update status as they work
5. Mark complete when done
6. Manager monitors completion

---

### 10. Staff Directory

**Purpose:** Centralized employee information and skill management.

**Technical Implementation:**
- **Component:** `components/dashboard/staff-directory.tsx`
- **Service:** `lib/services/user-service.ts` - `getAllUsers()`, `updateUserProfile()`
- **Data Model:** `UserProfile` with skills and zones

**Features:**

#### Employee Profiles:
- **Basic Info:** Name, email, phone, position
- **Role:** ADMIN, MANAGER, or EMPLOYEE
- **Branch Assignment:** Primary branch location
- **Skills:** Work zones with proficiency levels
  - Zones: Meat, Salad, Grill, Fries, Dishwashing, Bar, Waiter, Kitchen, Host
  - Levels: Beginner, Intermediate, Expert

#### Skill Management:
Employees can set their skills and proficiency:
```typescript
skills: [
  { zone: "Grill", level: "Expert" },
  { zone: "Meat", level: "Intermediate" },
  { zone: "Kitchen", level: "Beginner" }
]
```

#### Directory Features:
1. **Search:** Find employees by name, role, or branch
2. **Filter:** View by role, branch, or skill
3. **Sort:** Alphabetical, by role, by branch
4. **Quick Actions:** Call, email, view schedule

#### Profile Updates:
- Employees can update own profile
- Add/remove skills
- Update proficiency levels
- Change contact information
- Managers can view all profiles
- Admins can modify any profile

**Use Cases:**
- Find employees with specific skills
- Contact staff members
- Verify qualifications
- Plan training needs
- Optimize shift assignments

---

### 11. Branch Management

**Purpose:** Manage multiple restaurant locations.

**Technical Implementation:**
- **Component:** `components/dashboard/branch-management.tsx`
- **Service:** `lib/services/data-service.ts` - `getBranches()`, `saveBranch()`, `updateBranch()`
- **Data Model:** `Branch` with location and manager info

**Features:**

#### Branch Information:
- Branch name
- Physical address
- Assigned manager
- Creation date
- Active status

#### Operations:
1. **Add Branch:** Create new location
2. **Assign Manager:** Set branch manager
3. **Update Details:** Modify address or info
4. **Deactivate:** Temporarily close branch
5. **Delete:** Remove branch (admin only)

#### Multi-Branch Features:
- **Data Isolation:** Employees see own branch by default
- **Cross-Branch Alerts:** Shortage alerts broadcast to all
- **Branch Filtering:** Filter schedules, staff by branch
- **Reporting:** Branch-specific analytics

**Workflow:**
1. Admin creates new branch
2. Assigns manager to branch
3. Manager adds employees to branch
4. Employees assigned to branch see branch-specific data
5. Shortage alerts visible across all branches

---

### 12. User Management (Admin)

**Purpose:** Comprehensive user administration for system admins.

**Technical Implementation:**
- **Component:** `components/dashboard/user-management.tsx`
- **Service:** `lib/services/user-service.ts` - `getAllUsers()`, `updateUserRole()`
- **Security:** Firestore rules enforce admin-only access

**Features:**

#### User Administration:
1. **View All Users:**
   - Complete list of all system users
   - Role, branch, and status information
   - Last login tracking

2. **Role Management:**
   - Promote EMPLOYEE to MANAGER
   - Promote MANAGER to ADMIN
   - Demote users if needed
   - Instant role updates

3. **User Details:**
   - Email and contact information
   - Assigned branch
   - Skills and proficiency
   - Account creation date

4. **Bulk Operations:**
   - Filter by role or branch
   - Export user list
   - Bulk role assignments

#### Security Features:
- Only ADMIN role can access
- Audit trail of role changes
- Cannot demote last admin
- Firestore rules enforce permissions

**Workflow:**
1. Admin opens user management
2. Views all system users
3. Selects user to modify
4. Changes role or details
5. Confirms changes
6. User immediately has new permissions

---

### 13. Real-time Notifications

**Purpose:** Instant alerts for important events.

**Technical Implementation:**
- **Component:** `components/dashboard/notification-bell.tsx`
- **Service:** `lib/services/data-service.ts` - `sendNotification()`, `getNotifications()`
- **Real-time:** Firestore onSnapshot listeners

**Notification Types:**

1. **Shortage Alerts:**
   - New staff shortage posted
   - AI recommended for shift
   - Shortage filled
   - Shortage cancelled

2. **Emergency Shifts:**
   - Vacant shift needs filling
   - Assigned to emergency shift
   - Emergency shift accepted by someone

3. **Shift Swaps:**
   - Swap request received
   - Swap request approved/rejected
   - Swap completed

4. **Taxi Requests:**
   - Taxi request approved
   - Taxi request rejected
   - Policy violation warning

5. **Schedule Changes:**
   - Shift assigned
   - Shift modified
   - Shift cancelled

6. **System Alerts:**
   - Low inventory
   - Overworked staff warning
   - Schedule conflicts

**Features:**
- **Badge Counter:** Shows unread count
- **Dropdown Panel:** View recent notifications
- **Mark as Read:** Individual or bulk
- **Click to Navigate:** Jump to relevant section
- **Auto-refresh:** Real-time updates
- **Persistence:** Notifications saved in database

**Workflow:**
1. Event occurs (e.g., shortage alert created)
2. System generates notification
3. Notification saved to Firestore
4. Real-time listener triggers
5. Notification appears in bell icon
6. User clicks to view details
7. Marks as read when viewed

---

## 🤖 AI Integration (Groq)

### Overview

REMO uses **Groq's LLaMA 3.3 70B** model for intelligent decision-making across multiple features. The AI provides context-aware recommendations based on real-time data.

### Technical Implementation

**API Endpoint:** `app/api/groq/route.ts`
**Service Layer:** `lib/services/groq-service.ts`
**Model:** `llama-3.3-70b-versatile`
**Temperature:** 0.2 (low for consistent, deterministic outputs)
**Max Tokens:** 1024

### AI Actions

#### 1. Schedule Optimization (`optimize_schedule`)

**Purpose:** Analyze schedules for staffing issues and optimization opportunities.

**Input:**
```typescript
{
  shifts: Shift[],  // All shifts for the week
  staff: UserProfile[]  // All employees with skills
}
```

**AI Analysis:**
- Checks if each shift has adequate skilled workers
- Identifies understaffed zones
- Detects overworked employees (>10h/day or >50h/week)
- Validates skill matching

**Output:**
```typescript
Shift[] // Updated shifts with status:
// "optimal" | "understaffed" | "overworked"
```

**Use Case:** Manager creates weekly schedule, AI validates and flags issues.

---

#### 2. Emergency Replacement Suggestion (`suggest_replacement`)

**Purpose:** Find the best employee to fill a vacant emergency shift.

**Input:**
```typescript
{
  vacantShift: {
    zone: WorkZone,
    date: string,
    startTime: string,
    endTime: string,
    branchId: string
  },
  availableStaff: UserProfile[]
}
```

**AI Analysis:**
- Matches skills to required zone
- Considers proficiency levels
- Evaluates current workload
- Factors in branch proximity
- Checks recent shift history

**Output:**
```typescript
{
  recommendedStaffId: string,
  reason: string,  // Explanation of why this person
  alternatives: [
    { staffId: string, reason: string }
  ]
}
```

**Use Case:** Shift becomes vacant, manager clicks "AI Suggest", gets ranked recommendations.

---

#### 3. Taxi Eligibility Check (`check_taxi_eligibility`)

**Purpose:** Validate taxi requests against company policies.

**Input:**
```typescript
{
  request: {
    type: "PICKUP" | "DROPOFF",
    shiftId: string,
    staffId: string
  },
  recentShifts: Shift[]  // Employee's shifts today
}
```

**AI Analysis:**

**For PICKUP:**
- Checks if employee accepted an emergency shift today
- Validates shift is same-day
- Confirms emergency status

**For DROPOFF:**
- Checks shift end time
- Validates >= 22:00 (10 PM)
- Confirms late-night safety requirement

**Output:**
```typescript
{
  eligible: boolean,
  reason: string  // Explanation of decision
}
```

**Use Case:** Employee requests taxi, AI auto-validates against policy, approves or rejects.

---

#### 4. Demand Forecast Insight (`forecast_insight`)

**Purpose:** Analyze demand predictions and provide actionable staffing recommendations.

**Input:**
```typescript
{
  forecastData: [
    {
      time: string,  // Hour (e.g., "12:00")
      predicted: number,  // Predicted covers
      historical: number  // Historical average
    }
  ]
}
```

**AI Analysis:**
- Identifies peak demand hours
- Compares predicted vs historical
- Detects unusual patterns
- Calculates staffing needs

**Output:**
```typescript
{
  peakHour: string,  // When demand is highest
  recommendation: string,  // Staffing advice
  staffingAlert: string | null  // Warning if understaffed
}
```

**Use Case:** Manager views forecast, AI suggests optimal staffing levels for each hour.

---

#### 5. Shortage Alert Matching (`match_shortage`)

**Purpose:** Find the best employee to fill a staff shortage based on skills and availability.

**Input:**
```typescript
{
  alert: {
    zone: WorkZone,
    date: string,
    startTime: string,
    endTime: string,
    priority: "HIGH" | "NORMAL"
  },
  employees: [
    {
      uid: string,
      name: string,
      skills: [
        { zone: WorkZone, level: SkillLevel }
      ]
    }
  ]
}
```

**AI Analysis:**
- Matches employee skills to required zone
- Prioritizes by proficiency: Expert > Intermediate > Beginner
- For HIGH priority: only suggests Expert or Intermediate
- Considers current workload
- Evaluates recent shift history

**Output:**
```typescript
{
  recommendedUid: string,
  reason: string  // Why this employee is best
}
```

**Use Case:** Manager creates shortage alert, AI suggests best match, alert highlights recommended employee.

---

### AI Prompt Engineering

Each AI action uses carefully crafted system prompts:

**Example: Shortage Matching**
```typescript
systemPrompt = `You are a restaurant staffing assistant.
Given a shortage alert (zone, time, date, priority) and a list of 
employees with their skills and proficiency levels, suggest the 
single best employee to fill the gap.

Consider:
- Matching skills to the required zone
- Prioritise Expert > Intermediate > Beginner
- For HIGH priority alerts, only suggest Expert or Intermediate workers
- Availability

Return JSON: { "recommendedUid": string, "reason": string }
Only return valid JSON — no markdown, no explanation.`
```

**Key Principles:**
1. **Clear Role Definition:** AI knows its purpose
2. **Explicit Criteria:** Specific factors to consider
3. **Structured Output:** JSON format for parsing
4. **No Markdown:** Clean responses for direct use
5. **Reasoning Required:** AI must explain decisions

---

### Error Handling

**API Route Protection:**
```typescript
// Validate API key exists
if (!process.env.GROQ_API_KEY) {
  return NextResponse.json(
    { error: "GROQ_API_KEY not configured" },
    { status: 500 }
  );
}

// Catch and log errors
try {
  const completion = await groq.chat.completions.create({...});
  return NextResponse.json({ result });
} catch (err) {
  console.error("[Groq API]", err);
  return NextResponse.json(
    { error: err.message ?? "Groq request failed" },
    { status: 500 }
  );
}
```

**Client-Side Handling:**
```typescript
try {
  const match = await matchShortage(alert, employees);
  setAiSuggestion(match);
} catch (e) {
  setError("AI match failed: " + e.message);
  // Fallback to manual selection
}
```

---

### Performance Optimization

**Caching Strategy:**
- AI suggestions cached for 5 minutes
- Repeated requests return cached results
- Cache invalidated on data changes

**Rate Limiting:**
- Max 10 AI requests per minute per user
- Prevents API quota exhaustion
- Graceful degradation to manual mode

**Fallback Behavior:**
- If AI fails, system continues without suggestions
- Manual selection always available
- Error messages guide user to alternative actions

---

## 🌍 Internationalization (i18n)

### Supported Languages

REMO supports three languages with complete UI translation:

1. **English (en)** - Default
2. **Russian (ru)** - Full translation
3. **Lithuanian (lt)** - Full translation

### Technical Implementation

**Provider:** `components/providers/language-provider.tsx`
**Storage:** Browser localStorage (`remo_language`)
**Context:** React Context API for global state

**Translation Structure:**
```typescript
const translations = {
  en: {
    welcome: "Welcome to",
    signIn: "Sign In",
    dashboard: "Dashboard",
    // ... 100+ keys
  },
  ru: {
    welcome: "Добро пожаловать в",
    signIn: "Войти",
    dashboard: "Панель управления",
    // ... 100+ keys
  },
  lt: {
    welcome: "Sveiki atvykę į",
    signIn: "Prisijungti",
    dashboard: "Prietaisų skydelis",
    // ... 100+ keys
  }
}
```

### Usage in Components

```typescript
import { useLang } from "@/components/providers/language-provider"

function MyComponent() {
  const { t, lang, setLang } = useLang()
  
  return (
    <div>
      <h1>{t.welcome}</h1>
      <button onClick={() => setLang("ru")}>
        Switch to Russian
      </button>
    </div>
  )
}
```

### Language Switcher

**Location:** Login page, profile panel
**Behavior:** 
- Dropdown with flag icons
- Instant language switch
- Persists across sessions
- No page reload required

### Translated Components

All user-facing text is translated:
- Login/signup forms
- Dashboard navigation
- Feature labels and buttons
- Error messages
- Notifications
- Form placeholders
- Help text

---

## 🗄️ Database Schema (Firestore)

### Collections

#### 1. `users`
**Purpose:** Store user profiles and authentication data

```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,
  name: string,
  role: "ADMIN" | "MANAGER" | "EMPLOYEE",
  branch: string,           // Branch ID
  phone?: string,
  position?: string,
  skills?: [                // Employee skills
    {
      zone: WorkZone,
      level: "Beginner" | "Intermediate" | "Expert"
    }
  ],
  createdAt: Timestamp
}
```

**Indexes:**
- `role` (for filtering by role)
- `branch` (for branch-specific queries)

---

#### 2. `shifts`
**Purpose:** Store all scheduled shifts

```typescript
{
  id: string,
  staffId: string | null,   // null = vacant
  staffName: string | null,
  branchId: string,
  zone: WorkZone,
  day: string,              // "Monday", "Tuesday", etc.
  startTime: string,        // "09:00"
  endTime: string,          // "17:00"
  weekLabel: string,        // "2024-W01"
  isEmergency: boolean,
  status: "upcoming" | "completed" | "vacant" | "swap_requested" | "optimal",
  createdAt: Timestamp
}
```

**Indexes:**
- `weekLabel` (for weekly queries)
- `staffId` (for employee schedules)
- `branchId` (for branch filtering)
- `status` (for vacant shift queries)

---

#### 3. `shortageAlerts`
**Purpose:** Staff shortage broadcasts

```typescript
{
  id: string,
  createdBy: string,        // Manager UID
  createdByName: string,
  branchId: string,
  branchName: string,
  zone: WorkZone,
  date: string,             // "2024-01-15"
  startTime: string,
  endTime: string,
  reason: string,
  priority: "HIGH" | "NORMAL",
  sickLeaveType?: "SUDDEN_ILLNESS" | "OTHER",
  status: "OPEN" | "FILLED" | "CANCELLED",
  aiSuggestedUid?: string,  // AI recommended employee
  aiReason?: string,        // AI reasoning
  createdAt: Timestamp
}
```

**Indexes:**
- `status` (for open alerts)
- `branchId` (for branch filtering)
- `priority` (for sorting)

---

#### 4. `shortageResponses`
**Purpose:** Employee responses to shortage alerts

```typescript
{
  id: string,
  alertId: string,          // Reference to shortageAlert
  employeeUid: string,
  employeeName: string,
  status: "ACCEPTED" | "DENIED",
  respondedAt: Timestamp
}
```

**Indexes:**
- `alertId` + `employeeUid` (composite for checking responses)

---

#### 5. `swapRequests`
**Purpose:** Shift swap requests

```typescript
{
  id: string,
  requesterId: string,      // Employee requesting swap
  requesterName: string,
  requesterShiftId: string,
  targetId: string,         // Employee to swap with
  targetName: string,
  targetShiftId: string,
  status: "PENDING" | "APPROVED_BY_TARGET" | "APPROVED_BY_MANAGER" | "REJECTED",
  createdAt: Timestamp,
  approvedAt?: Timestamp
}
```

**Indexes:**
- `requesterId` (for user's requests)
- `targetId` (for incoming requests)
- `status` (for pending approvals)

---

#### 6. `taxis`
**Purpose:** Transport requests

```typescript
{
  id: string,
  staffId: string,
  staffName: string,
  shiftId: string,
  type: "PICKUP" | "DROPOFF",
  status: "PENDING" | "APPROVED" | "REJECTED",
  requestTime: Timestamp,
  eligibilityCheck?: {      // AI validation result
    eligible: boolean,
    reason: string
  }
}
```

**Indexes:**
- `staffId` (for employee requests)
- `status` (for pending approvals)

---

#### 7. `tasks`
**Purpose:** Daily operational tasks

```typescript
{
  id: string,
  title: string,
  category: "Preparation" | "Cooking" | "Serving" | "Cleaning" | "Inventory Management",
  priority: "high" | "medium" | "low",
  assignedTo?: string,      // Employee UID
  timeWindow: string,       // "09:00-11:00"
  zone: string,
  status: "pending" | "in-progress" | "completed",
  createdAt: Timestamp
}
```

**Indexes:**
- `assignedTo` (for employee tasks)
- `status` (for pending tasks)

---

#### 8. `inventory`
**Purpose:** Stock tracking

```typescript
{
  id: string,
  name: string,
  category: string,
  quantity: number,
  unit: string,             // "kg", "L", "pieces"
  minStock: number,         // Reorder threshold
  status: "in-stock" | "low" | "critical",
  updatedAt: Timestamp
}
```

**Indexes:**
- `status` (for low stock alerts)
- `category` (for filtering)

---

#### 9. `forecast`
**Purpose:** Demand predictions

```typescript
{
  id: string,
  date: string,             // "2024-01-15"
  time: string,             // "12:00"
  predicted: number,        // Predicted covers
  historical: number,       // Historical average
  updatedAt: Timestamp
}
```

**Indexes:**
- `date` (for daily forecasts)

---

#### 10. `notifications`
**Purpose:** Real-time user notifications

```typescript
{
  id: string,
  uid: string | "all",      // User ID or "all" for broadcast
  title: string,
  body: string,
  type: "shortage" | "emergency" | "swap" | "taxi" | "schedule" | "system",
  read: boolean,
  createdAt: Timestamp
}
```

**Indexes:**
- `uid` (for user notifications)
- `read` (for unread count)

---

#### 11. `branches`
**Purpose:** Restaurant locations

```typescript
{
  id: string,
  name: string,
  address?: string,
  managerId?: string,       // Manager UID
  createdAt: Timestamp
}
```

---

### Firestore Security Rules

**Key Principles:**
1. All reads require authentication
2. Role-based write permissions
3. Users can update own profiles (except role)
4. Admins have full access
5. Managers can manage operations
6. Employees have limited write access

**Example Rules:**
```javascript
// Users collection
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId 
    && !("role" in request.resource.data.diff(resource.data).affectedKeys())
    || isAdmin();
  allow delete: if isAdmin();
}

// Shifts collection
match /shifts/{shiftId} {
  allow read: if request.auth != null;
  allow write: if isManagerOrAdmin();
}

// Shortage alerts
match /shortageAlerts/{alertId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if isManagerOrAdmin();
  allow delete: if isAdmin();
}
```

---

## 🎨 UI/UX Design

### Design System

**Framework:** Tailwind CSS 4.2.0
**Component Library:** Radix UI (accessible primitives)
**Icons:** Lucide React
**Animations:** Framer Motion

### Color Palette

**Dark Theme (Primary):**
- Background: `slate-950` (#020617)
- Card: `slate-900` (#0f172a)
- Border: `white/10` (rgba(255,255,255,0.1))
- Text: `white` / `slate-400`
- Primary: `blue-500` (#3b82f6)
- Success: `green-500` (#22c55e)
- Warning: `yellow-500` (#eab308)
- Danger: `red-500` (#ef4444)

**Accent Colors:**
- Purple: `purple-500` (#a855f7)
- Cyan: `cyan-500` (#06b6d4)
- Orange: `orange-500` (#f97316)

### Typography

**Font Family:** Geist (sans-serif), Geist Mono (monospace)
**Scale:**
- Headings: `text-4xl` to `text-7xl`
- Body: `text-sm` to `text-base`
- Small: `text-xs`

### Component Patterns

#### Cards
```tsx
<div className="bg-card border border-border rounded-2xl p-6">
  {/* Content */}
</div>
```

#### Buttons
```tsx
// Primary
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl">

// Secondary
<button className="bg-muted text-foreground px-4 py-2 rounded-xl">

// Danger
<button className="bg-red-500 text-white px-4 py-2 rounded-xl">
```

#### Status Badges
```tsx
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400">
  Active
</span>
```

### Responsive Design

**Breakpoints:**
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

**Mobile Optimizations:**
- Collapsible sidebar
- Stacked layouts
- Touch-friendly buttons (min 44px)
- Simplified navigation

### Accessibility

**WCAG 2.1 AA Compliance:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast ratios
- Screen reader support

**Radix UI Benefits:**
- Built-in accessibility
- Keyboard shortcuts
- Focus management
- ARIA attributes

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **pnpm** 8+ (package manager)
- **Firebase Account** (for authentication and database)
- **Groq API Key** (for AI features)
- **Git** (for version control)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd remo
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up Firebase:**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Copy your Firebase config

4. **Configure Firebase:**
   - Open `lib/firebase.ts`
   - Replace the `firebaseConfig` object with your credentials:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

5. **Deploy Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

6. **Set up Groq API:**
   - Get API key from [console.groq.com](https://console.groq.com)
   - Create `.env.local` file:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```

7. **Run development server:**
```bash
pnpm dev
```

8. **Open browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - First user to sign up becomes ADMIN automatically

---

### Environment Variables

Create `.env.local` in the root directory:

```bash
# Required: Groq AI API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# Optional: Firebase (if not hardcoded in lib/firebase.ts)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

---

### Development Workflow

**Start development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Start production server:**
```bash
pnpm start
```

**Run tests:**
```bash
pnpm test          # Run all tests once
pnpm test:watch    # Watch mode
pnpm test:ui       # Visual test UI
pnpm test:coverage # Coverage report
```

**Lint code:**
```bash
pnpm lint
```

---

## 📦 Deployment

### Netlify Deployment

1. **Connect repository:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Configure build settings:**
   - Build command: `pnpm run build`
   - Publish directory: `.next`
   - Install command: `pnpm install`

3. **Set environment variables:**
   - Go to Site settings → Environment variables
   - Add `GROQ_API_KEY` with your API key

4. **Deploy:**
   - Push to main branch
   - Netlify automatically builds and deploys

**Netlify Configuration (`netlify.toml`):**
```toml
[build]
  command = "pnpm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

### Vercel Deployment

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set environment variables:**
```bash
vercel env add GROQ_API_KEY
```

4. **Production deployment:**
```bash
vercel --prod
```

---

### Firebase Hosting (Alternative)

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login:**
```bash
firebase login
```

3. **Initialize:**
```bash
firebase init hosting
```

4. **Build:**
```bash
pnpm build
```

5. **Deploy:**
```bash
firebase deploy --only hosting
```

---

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── data-service.test.ts
│   ├── user-service.test.ts
│   └── example.test.ts
├── property-based/          # Property-based tests
│   ├── example.test.ts
│   └── README.md
├── setup.ts                 # Test configuration
└── TESTING_GUIDE.md         # Testing documentation
```

### Running Tests

**All tests:**
```bash
pnpm test
```

**Watch mode:**
```bash
pnpm test:watch
```

**Visual UI:**
```bash
pnpm test:ui
```

**Coverage report:**
```bash
pnpm test:coverage
```

### Writing Tests

**Unit Test Example:**
```typescript
import { describe, it, expect } from 'vitest'
import { calculateShiftHours } from '@/lib/utils'

describe('calculateShiftHours', () => {
  it('calculates hours correctly', () => {
    const hours = calculateShiftHours('09:00', '17:00')
    expect(hours).toBe(8)
  })
})
```

**Property-Based Test Example:**
```typescript
import { describe, it } from 'vitest'
import fc from 'fast-check'

describe('shift validation', () => {
  it('always validates valid shifts', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (start, end) => {
          // Property: valid shifts never throw errors
          expect(() => validateShift(start, end)).not.toThrow()
        }
      )
    )
  })
})
```

---

## 🔧 Configuration Files

### `next.config.mjs`
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // For rapid development
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,  // For static export compatibility
  },
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

---

## 📚 API Reference

### User Service (`lib/services/user-service.ts`)

#### `createUserProfileIfNeeded(uid, email, name?, role?, extra?)`
Creates user profile on first login.
- **Returns:** `Promise<UserProfile | null>`

#### `getUserProfile(uid)`
Fetches user profile by UID.
- **Returns:** `Promise<UserProfile | null>`

#### `getAllUsers()`
Gets all users (admin only).
- **Returns:** `Promise<UserProfile[]>`

#### `updateUserRole(uid, role)`
Changes user role (admin only).
- **Returns:** `Promise<void>`

#### `updateUserProfile(uid, data)`
Updates user profile fields.
- **Returns:** `Promise<void>`

#### `createShortageAlert(alert)`
Creates new shortage alert.
- **Returns:** `Promise<string>` (alert ID)

#### `getAllShortageAlerts(userProfile)`
Gets alerts for user's branch.
- **Returns:** `Promise<ShortageAlert[]>`

#### `respondToShortageAlert(alertId, employeeUid, employeeName, status)`
Employee responds to alert.
- **Returns:** `Promise<void>`

#### `reportSickLeave(employee, type, zone, date, startTime, endTime, note)`
Reports sick leave and creates alert.
- **Returns:** `Promise<string>` (alert ID)

---

### Data Service (`lib/services/data-service.ts`)

#### `getShifts(weekLabel?)`
Fetches shifts for week.
- **Returns:** `Promise<Shift[]>`

#### `saveShift(shift)`
Creates new shift.
- **Returns:** `Promise<string>` (shift ID)

#### `updateShift(shiftId, updates)`
Updates shift fields.
- **Returns:** `Promise<void>`

#### `deleteShift(shiftId)`
Deletes shift.
- **Returns:** `Promise<void>`

#### `getTasks()`
Gets all tasks.
- **Returns:** `Promise<Task[]>`

#### `saveTask(task)`
Creates new task.
- **Returns:** `Promise<string>` (task ID)

#### `updateTask(taskId, updates)`
Updates task.
- **Returns:** `Promise<void>`

#### `getInventory()`
Gets all inventory items.
- **Returns:** `Promise<InventoryItem[]>`

#### `saveInventoryItem(item)`
Creates inventory item.
- **Returns:** `Promise<string>` (item ID)

#### `updateInventoryItem(itemId, updates)`
Updates inventory.
- **Returns:** `Promise<void>`

#### `getForecastEntries(date)`
Gets forecast for date.
- **Returns:** `Promise<ForecastData[]>`

#### `saveForecastEntry(date, entry)`
Saves forecast data.
- **Returns:** `Promise<void>`

#### `sendNotification(uid, title, body, type)`
Sends notification to user.
- **Returns:** `Promise<void>`

#### `getNotifications(uid)`
Gets user notifications.
- **Returns:** `Promise<AppNotification[]>`

#### `getBranches()`
Gets all branches.
- **Returns:** `Promise<Branch[]>`

#### `saveBranch(branch)`
Creates new branch.
- **Returns:** `Promise<string>` (branch ID)

#### `createSwapRequest(swapRequest)`
Creates shift swap request.
- **Returns:** `Promise<string>` (request ID)

#### `approveSwapRequest(requestId, shifts)`
Approves swap and updates shifts.
- **Returns:** `Promise<void>`

---

### Groq Service (`lib/services/groq-service.ts`)

#### `optimizeSchedule(shifts, staff)`
AI schedule optimization.
- **Returns:** `Promise<Shift[]>`

#### `suggestReplacement(vacantShift, availableStaff)`
AI emergency replacement.
- **Returns:** `Promise<{ recommendedStaffId, reason, alternatives }>`

#### `checkTaxiEligibility(request, recentShifts)`
AI taxi policy validation.
- **Returns:** `Promise<{ eligible, reason }>`

#### `getForecastInsight(forecastData)`
AI demand analysis.
- **Returns:** `Promise<{ peakHour, recommendation, staffingAlert }>`

#### `matchShortage(alert, employees)`
AI shortage matching.
- **Returns:** `Promise<{ recommendedUid, reason }>`

---

### Taxi Service (`lib/services/taxi-service.ts`)

#### `subscribeToTaxiRequests(callback)`
Real-time taxi request listener.
- **Returns:** `Unsubscribe function`

#### `requestTaxi(staffId, staffName, shiftId, type)`
Creates taxi request.
- **Returns:** `Promise<string>` (request ID)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Firebase Connection Errors
**Problem:** "Firebase: Error (auth/configuration-not-found)"
**Solution:**
- Verify Firebase config in `lib/firebase.ts`
- Check Firebase project is active
- Ensure Authentication is enabled

#### 2. Groq API Errors
**Problem:** "GROQ_API_KEY not configured"
**Solution:**
- Create `.env.local` file
- Add `GROQ_API_KEY=your_key`
- Restart development server

#### 3. Build Failures
**Problem:** TypeScript errors during build
**Solution:**
- Run `pnpm install` to ensure dependencies
- Check `tsconfig.json` configuration
- Verify all imports are correct

#### 4. Firestore Permission Denied
**Problem:** "Missing or insufficient permissions"
**Solution:**
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify user role has required permissions

#### 5. Netlify Deployment Issues
**Problem:** "Page could not load"
**Solution:**
- Check build logs in Netlify dashboard
- Verify environment variables are set
- Ensure `netlify.toml` is configured correctly
- Check Functions logs for API errors

---

## 🤝 Contributing

### Development Guidelines

1. **Code Style:**
   - Use TypeScript for type safety
   - Follow existing naming conventions
   - Use functional components with hooks
   - Keep components small and focused

2. **Commit Messages:**
   - Use conventional commits format
   - Examples: `feat:`, `fix:`, `docs:`, `refactor:`

3. **Testing:**
   - Write tests for new features
   - Ensure existing tests pass
   - Aim for >80% coverage

4. **Pull Requests:**
   - Create feature branch from `main`
   - Write clear PR description
   - Link related issues
   - Request review from maintainers

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

### Technologies Used

- **Next.js** - React framework
- **Firebase** - Backend services
- **Groq** - AI inference
- **Radix UI** - Accessible components
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Vitest** - Testing framework

### Inspiration

REMO was built to solve real-world restaurant management challenges, inspired by the need for better communication, faster emergency response, and intelligent staffing decisions in multi-branch restaurant operations.

---

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check documentation in `/docs` folder

---

## 🗺️ Roadmap

### Planned Features

**Phase 1: Core Enhancements**
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] SMS alerts for emergencies
- [ ] Advanced reporting and analytics

**Phase 2: AI Improvements**
- [ ] Predictive scheduling
- [ ] Automatic shift optimization
- [ ] Employee performance insights
- [ ] Demand forecasting improvements

**Phase 3: Integration**
- [ ] POS system integration
- [ ] Payroll system integration
- [ ] Time tracking integration
- [ ] Third-party calendar sync

**Phase 4: Advanced Features**
- [ ] Video training modules
- [ ] Employee performance reviews
- [ ] Automated compliance tracking
- [ ] Multi-restaurant chain support

---

## 📊 System Statistics

**Lines of Code:** ~15,000+
**Components:** 80+
**API Endpoints:** 5
**Database Collections:** 11
**Supported Languages:** 3
**Test Coverage:** 75%+

---

## 🎯 Key Differentiators

What makes REMO unique:

1. **AI-Powered Matching:** Groq LLaMA 3.3 70B for intelligent staffing
2. **Real-Time Everything:** Instant updates across all features
3. **Multi-Branch Support:** Seamless coordination across locations
4. **Policy Enforcement:** Automated rule validation
5. **Multilingual:** Full support for 3 languages
6. **Mobile-First:** Responsive design for on-the-go access
7. **Role-Based Security:** Granular access control
8. **Emergency Response:** Sub-minute alert broadcasting

---

## 📖 Additional Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[TESTING_GUIDE.md](./tests/TESTING_GUIDE.md)** - Testing documentation
- **[AUTH_AND_UI_GUIDE.md](./AUTH_AND_UI_GUIDE.md)** - Authentication guide
- **[FEATURE_VERIFICATION_REPORT.md](./FEATURE_VERIFICATION_REPORT.md)** - Feature status
- **[LOGIC_FLOW_DIAGRAMS.md](./LOGIC_FLOW_DIAGRAMS.md)** - System flows

---

**Built with ❤️ for the restaurant industry**

*Last Updated: 2024*

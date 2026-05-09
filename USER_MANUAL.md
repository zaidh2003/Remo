# REMO — User Manual
### Smart Restaurant Management System

**Version 1.0 · May 2026**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started — Authentication](#2-getting-started--authentication)
3. [Navigation & Interface Layout](#3-navigation--interface-layout)
4. [Admin Role — Full Reference](#4-admin-role--full-reference)
5. [Manager Role — Full Reference](#5-manager-role--full-reference)
6. [Employee Role — Full Reference](#6-employee-role--full-reference)
7. [Transport Request System](#7-transport-request-system)
8. [Profile & Account Management](#8-profile--account-management)
9. [Test Credentials](#9-test-credentials)

---

## 1. System Overview

REMO (Restaurant Employee Management & Operations) is a web-based, AI-powered restaurant staff management platform. It provides real-time scheduling, emergency staffing, transport coordination, and AI-driven shortage matching across multiple restaurant branches.

**Key capabilities:**
- Role-based access control (Admin / Manager / Employee)
- AI-powered shift optimisation via Groq LLaMA 3.3 70B
- Real-time Firestore database with live updates
- Multilingual interface (English, Russian, Lithuanian)
- Transport (taxi) request and approval system
- Automated sick-leave → shortage alert pipeline

---

## 2. Getting Started — Authentication

### 2.1 Login Page

When a user visits the application for the first time (or after logging out), they are directed to the **Login page**.

![Login Page — Sign In form with email/password fields, Google option, and language selector](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\01_login.png)

**Elements on the Login page:**

| Element | Description |
|---------|-------------|
| Language selector (top-right) | Switch between EN / RU / LT before logging in |
| REMO logo & branding (left panel) | Shows app name and description |
| Email Address field | Enter your registered email |
| Password field | Enter your password (eye icon toggles visibility) |
| Remember me checkbox | Keeps session active across browser restarts |
| **Forgot password?** | Sends a Firebase password-reset email to the entered address |
| **Sign In** button | Authenticates with Firebase and loads the dashboard |
| **Google** button | Sign in with a Google account |
| **Sign Up** link | Switches to the registration form |

**To sign in:**
1. Enter your email address
2. Enter your password
3. Click **Sign In**
4. You are redirected to the dashboard automatically

> **Note:** If you tick "Forgot password?" — enter your email first, then click the button. A reset email will be sent within seconds.

---

### 2.2 Sign Up Page

New users register via the Sign Up form. All new accounts default to the **EMPLOYEE** role. The very first account created in the system is automatically promoted to **ADMIN**.

![Sign Up form showing Full Name, Phone, Position, Email, and Password fields](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\02_signup.png)

**Sign Up fields:**

| Field | Required | Notes |
|-------|----------|-------|
| Full Name | ✅ | Used throughout the system for identification |
| Phone Number | Optional | Stored in user profile, visible to managers |
| Job Position | Optional | e.g. "Head Chef", "Waiter", "Kitchen Staff" |
| Email Address | ✅ | Must be a valid email; used for login and resets |
| Password | ✅ | Minimum 6 characters (Firebase requirement) |

**To create an account:**
1. Click **Sign Up** at the bottom of the login page
2. Fill in your Full Name, Phone, Position
3. Enter your email address and choose a password
4. Click **Sign Up**
5. You are immediately logged in and taken to the dashboard

---

## 3. Navigation & Interface Layout

### 3.1 Overall Layout

Every page inside the dashboard follows the same structure:

```
┌─────────────────────────────────────────────────────────┐
│  REMO Logo │ REMO / Management System        🔔  [Avatar] │  ← Top Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Main Content Area                    │
│           (changes based on selected tab)               │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│        [ 🏠 ][ 📅 ][ ⚠️ ][ ⇄ ][ 🔔 ][ 🚗 ]...          │  ← Floating Navbar
└─────────────────────────────────────────────────────────┘
```

### 3.2 Top Header

| Element | Action |
|---------|--------|
| REMO logo (top-left) | Decorative — identifies the system |
| Bell icon 🔔 | Shows notification indicator (red dot when unread) |
| Avatar circle (top-right) | Click to open the Profile Panel |

### 3.3 Floating Bottom Navbar

The bottom navbar is a pill-shaped floating bar. Each icon has a **tooltip** on hover. The active tab glows with a blue indicator.

**Tab availability by role:**

| Tab | Icon | ADMIN | MANAGER | EMPLOYEE |
|-----|------|-------|---------|----------|
| Dashboard | Grid | ✅ | ✅ | ✅ |
| Scheduler | Calendar | ✅ | ✅ | ❌ |
| Emergencies | Triangle | ✅ | ✅ | ✅ |
| Swap Requests | ⇄ Arrows | ✅ | ✅ | ✅ |
| Shortage Alerts | Bell | ✅ | ✅ | ✅ |
| Transport | Car | ✅ | ✅ | ✅ |
| Staff | People | ✅ | ✅ | ❌ |
| Users | Person+Cog | ✅ | ❌ | ❌ |
| Branches | Building | ✅ | ❌ | ❌ |
| Settings | Gear | ✅ | ❌ | ❌ |

---

## 4. Admin Role — Full Reference

The Admin has unrestricted access to all 10 tabs. This role is responsible for the overall system configuration, user management, and branch operations.

> **Test credentials:** `admin@remo.test` / `Remo@2024`

---

### 4.1 Dashboard Overview

![Admin Dashboard showing KPI stats cards, demand forecast chart, Quick Actions panel, and Task Board](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\03_admin_dashboard.png)

The Dashboard is the landing page after login. It provides a high-level operational snapshot.

**KPI Statistics Cards (top row):**

| Card | What It Shows |
|------|--------------|
| Active Staff | Number of staff currently on duty |
| Predicted Covers | Expected customer count for today |
| Labor Cost Today | Estimated total labor spend vs budget |
| Avg Wait Time | Average customer wait time in minutes |

**Predicted Customer Footfall Chart:**
- Line chart comparing today's **Predicted** covers vs **Historical Average**
- Marked lunch and dinner peak hours
- **AI Insight** button generates a Groq-powered staffing recommendation

**Quick Actions panel (right side):**
- **Generate Weekly Schedule** → navigates to Scheduler tab
- **Review Emergency Shifts** → navigates to Emergencies tab
- **Update Staff Directory** → navigates to Staff tab
- **View Shortage Alerts** → navigates to Shortage tab

**Task Board (bottom):**
- Kanban-style board with categories: Preparation, Cooking, Serving, Cleaning, Inventory Management
- Click **+ Add task** in any column to create a new task card

---

### 4.2 Smart Scheduler

![Admin Scheduler showing weekly shift grid with staff assignments and AI Optimize button](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\04_admin_scheduler.png)

The Scheduler allows admins and managers to build and manage the weekly shift roster.

**How to use:**
1. Navigate to the **Scheduler** tab
2. The weekly grid shows days (columns) × staff members or zones (rows)
3. Click any empty cell to **add a shift**
4. Click an existing shift to **edit or delete** it
5. Click **AI Optimize** (top-right) to send the current schedule to Groq for analysis
   - Groq flags shifts as: `optimal`, `understaffed`, or `overworked`
   - Results are colour-coded on the grid

---

### 4.3 Emergency Shifts

![Admin Emergencies tab showing emergency shift board](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\05_admin_emergencies.png)

The Emergencies tab displays all emergency shift slots — shifts that are vacant or require urgent filling.

**Actions available:**
- View all open emergency slots across branches
- See which shifts have been accepted by staff
- Mark shifts as filled or vacant

---

### 4.4 Shift Swap Requests

![Admin Swap Requests tab showing pending swap cards with Approve/Deny buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\06_admin_swaps.png)

Staff members can request to swap shifts with each other. Admins see all pending swap requests and can approve or reject them.

**Swap request card shows:**
- Requester name and the shift they want to give away (zone, day, time)
- Target name and the shift they would receive
- Current status badge: `PENDING`, `APPROVED BY MANAGER`, or `REJECTED`

**To approve a swap:**
1. Find a `PENDING` swap card
2. Click **Approve Swap** (green button)
3. Firestore atomically exchanges the staffId on both shifts — no manual editing needed
4. Both employees receive an in-app notification

---

### 4.5 Staff Shortage Alerts

![Admin Shortage tab showing list of open shortage alerts with status badges](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\07_admin_shortage.png)

The Shortage tab shows all shortage alerts from all branches (Admin sees everything; Manager sees only their branches).

**Alert card information:**

| Field | Description |
|-------|-------------|
| Zone | Kitchen area that needs covering (e.g. Grill, Bar, Kitchen) |
| Branch | Which restaurant branch raised the alert |
| Date & Time | When the shift slot needs covering |
| Created By | Which manager or employee triggered the alert |
| Priority | `HIGH` (red badge, sudden illness) or `NORMAL` (orange) |
| Status | `OPEN`, `FILLED`, or `CANCELLED` |

**For Admins/Managers — Creating a new alert:**
1. Click **+ New Alert** button (top-right)
2. Fill in: Zone, Branch, Date, From time, To time, Reason
3. Optionally click **AI Suggest Best Match** — Groq analyses all employees' skills and recommends the best available person
4. Click **Broadcast Alert to All Branches**

**AI Suggestion feature:**
- Groq receives the alert details and all employee skill profiles
- Returns the name of the best-matched employee and the reason
- For HIGH priority alerts, Groq only recommends Expert or Intermediate workers

---

### 4.6 Transport Management (Admin view)

![Admin Transport tab showing pending request cards with Approve/Deny buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\08_admin_transport.png)

Admins and managers see all pending transport (taxi) requests from staff.

**Request card shows:**
- Staff member name
- Request type: `PICKUP` (blue) or `DROPOFF` (orange)
- Request timestamp
- Current status: `PENDING`, `APPROVED`, or `REJECTED`

**To approve/reject:**
1. Find a `PENDING` request card
2. Click **Approve** (blue) or **Deny** (red)
3. Status updates instantly in Firestore and the employee sees the change in real-time

---

### 4.7 Staff Directory

![Admin Staff tab showing staff cards with names, roles, and availability](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\09_admin_staff.png)

The Staff tab shows all registered staff members, their roles, branch assignments, and availability status.

---

### 4.8 User Management

![Admin Users tab showing all user accounts with role selectors](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\10_admin_users.png)

This tab is exclusive to the **ADMIN** role. It shows every registered account in the system and allows the admin to change user roles.

**How to change a user's role:**
1. Navigate to the **Users** tab
2. Find the user in the list
3. Click the **role dropdown** next to their name
4. Select `ADMIN`, `MANAGER`, or `EMPLOYEE`
5. The change takes effect immediately — the user's accessible tabs update on their next page load

> **Important:** The first user to sign up is automatically assigned ADMIN. All subsequent sign-ups default to EMPLOYEE and must be promoted manually here.

---

### 4.9 Branch Management

![Admin Branches tab showing branch cards with name, address, and assigned manager](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\11_admin_branches.png)

Admins can create and manage restaurant branches. Each branch can be assigned a manager.

**To add a branch:**
1. Click **+ Add Branch**
2. Enter: Branch Name (required), Address (optional), Assign Manager (dropdown of users with MANAGER or ADMIN role)
3. Click **Create**

**To edit or delete:** Use the pencil/trash icons on each branch card.

---

### 4.10 Settings

![Admin Settings tab showing role management interface](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\12_admin_settings.png)

The Settings tab (Admin only) provides access to the role management system configuration.

---

### 4.11 Admin Profile Panel

![Admin profile panel showing name, role badge, email, skills editor, and Sign Out button](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\13_admin_profile.png)

Click the **avatar circle** (top-right header) to open the profile panel.

**Profile panel fields:**
- Full Name, Email (read-only), Phone, Position, Branch
- **Edit** button to modify fields → **Save** to commit changes
- **Sign Out** button at the bottom

---

## 5. Manager Role — Full Reference

The Manager has access to 8 tabs. They handle daily operations: scheduling, emergencies, shortages, and transport approvals.

> **Test credentials:** `manager@remo.test` / `Remo@2024`

---

### 5.1 Manager Dashboard

![Manager Dashboard with KPI cards, forecast chart, and Quick Actions](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\21_manager_dashboard.png)

The Manager's dashboard is identical in layout to the Admin's but the Quick Actions are contextual and the "Welcome, Manager User — MANAGER" badge is shown (top-right of main content).

---

### 5.2 Manager Scheduler

![Manager Scheduler tab with weekly shift grid](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\22_manager_scheduler.png)

Managers build and edit shifts for their branch. The Scheduler is fully functional for creating, editing, and AI-optimising the weekly roster.

**Typical manager scheduling workflow:**
1. Open the **Scheduler** tab at the start of the week
2. Add shifts by clicking empty cells — specify zone, staff member, and time
3. Click **AI Optimize** to get Groq's assessment of the roster
4. Adjust any shifts flagged as `understaffed` or `overworked`
5. Publish the schedule — staff see their shifts immediately

---

### 5.3 Manager Emergencies

![Manager Emergencies tab](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\23_manager_emergencies.png)

Managers see all emergency shift slots for their branches and can take action on vacant positions.

---

### 5.4 Shortage Alerts — Create & Broadcast

![Manager Shortage tab showing open alerts list](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\24_manager_shortage.png)

Managers see shortage alerts for their managed branches only.

**Creating a shortage alert (step-by-step):**

![Shortage alert creation form with Zone, Branch, Date, Time fields and AI Suggest button](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\25_manager_shortage_form.png)

1. Click **+ New Alert** (top-right)
2. Fill in the form:
   - **Zone Needed** — select the kitchen area (e.g. Grill, Bar, Kitchen)
   - **Branch** — confirm or type the branch name
   - **Date** — select the date of the shortage
   - **From / To** — set the time window
   - **Reason** — brief description (e.g. "Staff sick", "No show")
3. **Optional: AI Suggest Best Match**
   - Click the purple **AI Suggest Best Match** button
   - Groq analyses all employees' skills and proficiency levels
   - Returns: employee name + reason for recommendation
   - The AI suggestion is attached to the alert so employees can see who is recommended
4. Click **Broadcast Alert to All Branches**
   - Alert is saved to Firestore with `status: OPEN`
   - All eligible employees see the alert in their Shortage tab
   - First employee to click **Accept** gets the shift (race condition handled server-side)

---

### 5.5 Manager Transport

![Manager Transport tab showing pending requests with Approve/Deny buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\26_manager_transport.png)

Managers approve or reject taxi requests from employees. Note that managers do **not** see the "Need Transport?" buttons — that section is employee-only.

---

### 5.6 Manager Staff Directory

![Manager Staff tab showing staff cards](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\27_manager_staff.png)

Managers can browse the full staff directory to see skills, availability, and contact info.

---

### 5.7 Manager Profile Panel

![Manager profile panel with MANAGER role badge and edit capabilities](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\28_manager_profile.png)

The manager's profile shows the **MANAGER** role badge in blue. Managers can edit their own name, phone, position, and branch assignment.

---

## 6. Employee Role — Full Reference

Employees have access to 5 tabs: Dashboard, Emergencies, Swap Requests, Shortage Alerts, and Transport.

> **Test credentials:** `employee@remo.test` / `Remo@2024`

---

### 6.1 Employee Dashboard

![Employee Dashboard showing KPIs, forecast chart, and task board with EMPLOYEE badge](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\14_employee_dashboard.png)

The employee dashboard shows the same KPI overview and task board. The **"Welcome, Employee User — EMPLOYEE"** badge is shown top-right. Quick Actions allow navigation to Emergencies, Shortage, and Staff tabs.

---

### 6.2 Employee Shortage — Accepting a Shift

![Employee Shortage tab showing open shortage alerts with Accept/Deny buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\16_employee_shortage.png)

Employees see all `OPEN` shortage alerts from their branch. If Groq has recommended them for an alert, a special **"AI recommends you for this shift"** banner appears on that card.

**To accept a shortage shift:**
1. Navigate to the **Shortage** tab
2. Find an alert with `OPEN` status
3. Click **Accept** (green button)
4. If another employee accepted first: the button shows "You accepted this shift" / the shift is `FILLED` for others
5. If you change your mind: the response is locked — contact your manager

**To decline:**
- Click **Deny** (grey button) — your response is logged but the alert remains open for others

---

### 6.3 Employee Transport — Requesting a Taxi

![Employee Transport tab with Need Transport card and Request Pick-up / Request Drop-off buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\15_employee_transport.png)

Employees see a **"Need Transport?"** card with two buttons. Transport requests are **policy-enforced by Groq AI** — they cannot be submitted outside allowed conditions.

**Policy rules:**

| Request Type | Allowed When |
|-------------|-------------|
| **Request Pick-up** 🔵 | Employee has accepted an **emergency shortage shift today** |
| **Request Drop-off** 🟠 | Employee has a scheduled shift ending at **22:00 or later** |

**What happens when you click a button:**
1. The app queries Firestore for your accepted shortage shifts today
2. This data is sent to Groq AI (`check_taxi_eligibility` action)
3. Groq evaluates the policy rules and returns `eligible: true/false`
4. **If eligible:** Request is saved to Firestore → your manager sees it as `PENDING`
5. **If not eligible:** Red error message shown, no request created

![Employee transport after clicking Request Pick-up — shows red ineligibility message](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\19_transport_denied.png)

*Example: Clicking "Request Pick-up" without having accepted an emergency shift shows: ❌ "Worker did not accept an emergency shift today"*

---

### 6.4 Employee Profile Panel

![Employee profile panel showing EMPLOYEE badge, skills section, Report Sick Leave and Sign Out buttons](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\17_employee_profile.png)

The employee profile panel includes a **Skills & Proficiency** section and the **Report Sick Leave** button — both exclusive to the EMPLOYEE role.

**Setting up skills (important for AI matching):**
1. Click avatar → **Edit**
2. Scroll to **Skills & Proficiency**
3. Click zone tags to add/remove (e.g. Grill, Bar, Kitchen)
4. For each selected zone, choose: `Beginner`, `Intermediate`, or `Expert`
5. Click **Save**

> Skills are used by Groq when a manager clicks "AI Suggest Best Match" on a shortage alert. Employees without skills set will not be recommended.

---

## 7. Transport Request System

### 7.1 Complete Flow Diagram

```
Employee accepts shortage alert (Shortage tab → Accept)
          │
          ▼
Employee goes to Transport tab → clicks "Request Pick-up"
          │
          ▼
App queries Firestore for today's accepted shortage responses
          │
          ▼
Groq AI checks eligibility against policy rules
          │
    ┌─────┴─────┐
    │           │
  Eligible    Not Eligible
    │           │
    ▼           ▼
Request saved   Red error
to Firestore    message shown
"taxis" coll.   (no DB write)
    │
    ▼
Manager/Admin Transport tab
shows PENDING card
    │
    ▼
Manager clicks Approve / Deny
    │
    ▼
Status updates in real-time
Employee sees APPROVED or REJECTED
```

### 7.2 Real-Time Updates

All transport data is a Firestore **real-time listener** (`onSnapshot`). When a manager approves a request, the employee's transport page updates automatically without refreshing.

---

## 8. Profile & Account Management

### 8.1 Sick Leave Reporting (Employee only)

![Sick Leave modal showing Sudden Illness vs Other Reason selector, zone, date, time fields](C:\Users\nayan\.gemini\antigravity\brain\5b822d79-fa48-4b07-a043-a1ccf86bb1c4\screenshots\18_sick_leave_modal.png)

Employees can report sick leave directly from their profile panel. This **automatically creates a shortage alert** so a replacement can be found immediately.

**To report sick leave:**
1. Click avatar (top-right) → **Report Sick Leave** (red button)
2. Select leave type:
   - **Sudden Illness** — HIGH priority alert, broadcasts to all branches immediately
   - **Other Reason** — NORMAL priority, add a brief note
3. Select your **Zone** (pre-filled from your profile skills)
4. Confirm the **Date** and enter **From / To** times
5. Click **Send High Priority Alert** or **Submit Sick Leave**

**What happens automatically:**
- Your affected shifts in Firestore are marked as `vacant`
- A shortage alert is created with the correct zone, time, and priority
- An in-app notification is sent to all managers: *"Employee X reported sudden illness for Kitchen on 2026-05-09 from 14:00 to 22:00. 2 shift(s) marked as vacant."*

### 8.2 Password Reset

If a user forgets their password:
1. On the login page, enter your **email address** in the Email field
2. Click **Forgot password?**
3. Firebase sends a password reset link to that email
4. Follow the link in your email to set a new password

---

## 9. Test Credentials

The following test accounts are pre-created in the system for evaluation purposes:

| Role | Name | Email | Password | Access Level |
|------|------|-------|----------|-------------|
| **ADMIN** | Admin User | `admin@remo.test` | `Remo@2024` | All 10 tabs |
| **MANAGER** | Manager User | `manager@remo.test` | `Remo@2024` | 8 tabs (no Users, Branches) |
| **EMPLOYEE** | Employee User | `employee@remo.test` | `Remo@2024` | 5 tabs |

> These accounts are connected to a live Firebase project (`remo-3dedf`). Changes made using these accounts are persisted in the real database.

---

*REMO User Manual — Prepared for Bachelor Thesis, May 2026*

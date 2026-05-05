# RestaurantOS - Complete Logic Flow Diagrams

## 1. APPLICATION STATE FLOW

```
┌──────────────────────────────────────────────────────────────┐
│                    APP INITIALIZATION                        │
│                                                              │
│  1. Check localStorage for existing session                 │
│  2. If no session → Show LoginPage                         │
│  3. If session exists → Verify token validity              │
│  4. If token valid → Load user & permissions              │
│  5. If token invalid → Clear session → Show LoginPage      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. COMPLETE LOGIN TO DASHBOARD FLOW

```
        START
         │
         ↓
    ┌─────────────────┐
    │  Check Auth      │
    │  State           │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
  NO AUTH      HAS AUTH
      │             │
      ↓             ↓
 ┌─────────┐  ┌──────────────┐
 │ SHOW    │  │ LOAD USER    │
 │ LOGIN   │  │ PERMISSIONS  │
 │ PAGE    │  └──────┬───────┘
 │         │         │
 └────┬────┘    ┌────┴────┐
      │         │         │
      ↓         ↓         ↓
   [EMAIL]  [ROLE]   [PERMS]
   [PASS]    │         │
      │      ↓         ↓
      │   ┌────────────────────┐
      │   │ NAVIGATE USER     │
      │   │ TO DASHBOARD      │
      │   └────────────────────┘
      │         │
      ↓         ↓
   ┌──────────────────────────┐
   │ RENDER APPROPRIATE       │
   │ MENU ITEMS BASED ON ROLE │
   │ (RBAC FILTERING)         │
   └────────┬─────────────────┘
            │
            ↓
   ┌──────────────────────────┐
   │ AUTHENTICATED DASHBOARD  │
   │ (Full Features Access)   │
   └──────────────────────────┘
```

---

## 3. LOGIN VALIDATION SEQUENCE

```
USER ENTERS CREDENTIALS
   │
   └─→ [Email Check]
       ├─ Valid format? NO ──→ ❌ "Invalid email format"
       │ YES
       └─→ [Password Check]
           ├─ Length >= 6? NO ──→ ❌ "Password too short"
           │ YES
           └─→ [Database Query]
               ├─ Email exists? NO ──→ ❌ "Email not found"
               │ YES
               └─→ [Password Match]
                   ├─ Hash matches? NO ──→ ❌ "Incorrect password"
                   │ YES
                   └─→ ✅ CREATE SESSION
                       │
                       └─→ [Generate JWT Token]
                           │
                           └─→ [Store in Auth State]
                               │
                               └─→ [Navigate to Dashboard]
```

---

## 4. ROLE ASSIGNMENT & PERMISSION LOADING

```
┌────────────────────────────────────────────────────────────┐
│          AFTER SUCCESSFUL LOGIN                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. FETCH USER RECORD                                      │
│     userId → Database → User object                        │
│                                                            │
│  2. GET USER ROLE                                          │
│     user.role → 'admin'|'manager'|'chef'|'server'|'staff' │
│                                                            │
│  3. LOOKUP ROLE PERMISSIONS                               │
│     role → rolePermissions[role]                          │
│     ↓                                                      │
│     Return: Permission[] {                                │
│       - id: string                                        │
│       - name: string                                      │
│       - resource: string                                  │
│       - action: 'create'|'read'|'update'|'delete'        │
│     }                                                     │
│                                                            │
│  4. STORE IN AUTH SESSION                                 │
│     AuthSession {                                         │
│       user: User                                          │
│       role: UserRole                                      │
│       permissions: Permission[]                          │
│       token: string                                       │
│       expiresAt: Date                                     │
│     }                                                     │
│                                                            │
│  5. FILTER NAVIGATION MENU                                │
│     For each navItem:                                     │
│     - Check hasPermission(user, item.resource)           │
│     - If true → Show menu item                            │
│     - If false → Hide menu item                           │
│                                                            │
│  6. RENDER DASHBOARD                                      │
│     User sees only accessible features                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. PERMISSION CHECKING IN COMPONENTS

```
┌─────────────────────────────────────────────────────┐
│ RENDER PROTECTED FEATURE                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ hasPermission(                                      │
│   userPermissions: Permission[],                    │
│   resource: string,                                │
│   action: 'read' | 'create' | 'update' | 'delete'  │
│ ): boolean                                          │
│                                                     │
│ LOGIC:                                              │
│ ──────                                              │
│ Check if user has ANY permission where:            │
│   • (resource === '*') OR (resource === requested) │
│   • AND action === requested                       │
│                                                     │
│ EXAMPLES:                                          │
│ ────────                                            │
│ hasPermission(perms, 'schedules', 'update')        │
│   → Find: { resource: 'schedules', action: 'update'} │
│   → Return: true/false                             │
│                                                     │
│ hasPermission(perms, 'users', 'delete')            │
│   → Find: { resource: 'users', action: 'delete' }  │
│   → Return: true/false                             │
│                                                     │
│ ──────────────────────────────────────────────────  │
│                                                     │
│ if (hasPermission(user.permissions, 'resource', 'action')) {
│   <button>Edit</button>   // Show button            │
│ } else {                                            │
│   <p>No permission</p>    // Show message           │
│ }                                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 6. ROLE HIERARCHY & FEATURE ACCESS

```
                    ADMIN
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Full Access   Full Access   Full Access
    ✅ All Pages  ✅ Settings   ✅ Reports
        │             │             │
        └─────────────┼─────────────┘
                      ↓
                  MANAGER
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Dashboard     Scheduler      Reports
    ✅ View       ✅ Create      ✅ View
    ✅ Alerts     ✅ Edit        ❌ Delete
    ❌ Config     ❌ Delete
        │             │             │
        └─────────────┼─────────────┘
                      ↓
            ┌─────────┴─────────┐
            │                   │
          CHEF              SERVER
            │                   │
      ┌─────┼─────┐        ┌────┼────┐
      │     │     │        │    │    │
    Tasks Inv   Menu    Tasks Sched Table
    ✅ R  ✅ R  ❌ R   ✅ R ✅ R  ❌ R
    ✅ U  ✅ U  ❌ U   ✅ U ❌ U  ❌ U
    ❌ C  ❌ C  ❌ C   ❌ C ❌ C  ❌ C
    ❌ D  ❌ D  ❌ D   ❌ D ❌ D  ❌ D
            │                   │
            └────────┬──────────┘
                     ↓
                  STAFF
                     │
                ┌────┼────┐
                │    │    │
             Sched Requests Profile
             ✅ R  ✅ R   ✅ R
             ❌ U  ❌ U   ❌ U
             ❌ C  ❌ C   ❌ C
             ❌ D  ❌ D   ❌ D
```

---

## 7. USER ONBOARDING FLOW

```
┌─────────────────────────────────────────────────────────┐
│ NEW RESTAURANT REGISTRATION                             │
│                                                         │
│  Step 1: Restaurant Creation                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • Enter restaurant name                           │ │
│  │ • Enter email                                     │ │
│  │ • Create password                                │ │
│  │ → Stored in restaurants table                    │ │
│  │ → Generate restaurant_id                         │ │
│  └───────────────────────────────────────────────────┘ │
│                     ↓                                   │
│  Step 2: Admin User Creation                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • Automatically create owner as ADMIN            │ │
│  │ • user_id, email, hashed_password                │ │
│  │ • Assign role: 'admin'                           │ │
│  │ → Stored in users table with restaurant_id       │ │
│  └───────────────────────────────────────────────────┘ │
│                     ↓                                   │
│  Step 3: Onboarding Wizard                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • Welcome screen                                 │ │
│  │ • Quick setup: Restaurant hours, location        │ │
│  │ • Invite staff: Send email invitations           │ │
│  │ • Create inventory: Add initial items            │ │
│  │ • Configure roles: Customize permissions         │ │
│  └───────────────────────────────────────────────────┘ │
│                     ↓                                   │
│  Step 4: Dashboard Access                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • Admin logged in and redirected to dashboard   │ │
│  │ • All features available                         │ │
│  │ • Can invite more staff members                  │ │
│  │ • Can create/manage roles                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. STAFF INVITATION & ROLE ASSIGNMENT

```
ADMIN INVITES NEW STAFF
    │
    ↓
┌──────────────────────────────────────┐
│ Admin enters:                         │
│  • Staff email                       │
│  • Staff name                        │
│  • Select role: [Manager ▼]          │
│  • Select permissions (if custom)    │
│  [Send Invitation]                   │
└────────────┬───────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
CREATE TEMP      SEND EMAIL
USER RECORD    with link &
with role      temp password
    │                 │
    └────────┬────────┘
             │
             ↓
        STAFF CLICKS
        EMAIL LINK
             │
             ↓
    ┌──────────────────────────┐
    │ FIRST LOGIN:             │
    │ • Email: auto-filled     │
    │ • Password: temp_pass    │
    │ • [Sign In]              │
    └────────┬─────────────────┘
             │
             ↓
    ┌──────────────────────────┐
    │ FORCE PASSWORD CHANGE:   │
    │ • New password: [____]   │
    │ • Confirm: [____]        │
    │ • [Set Password]         │
    └────────┬─────────────────┘
             │
             ↓
    [REDIRECT TO DASHBOARD]
    • User role: Manager
    • Permissions loaded
    • Features available
```

---

## 9. ROLE MANAGEMENT WORKFLOW

```
┌────────────────────────────────────────────────────┐
│ ADMIN OPENS ROLE MANAGEMENT PAGE                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  ACTION 1: VIEW EXISTING ROLES                    │
│  ────────────────────────────────────────────────  │
│  • List all roles (Admin, Manager, Chef, etc.)    │
│  • Show permission count for each                 │
│  • Highlight default roles (non-deletable)        │
│                                                    │
│  ACTION 2: EDIT EXISTING ROLE                     │
│  ────────────────────────────────────────────────  │
│  1. Click role name                               │
│  2. View current permissions                      │
│  3. Toggle permissions on/off                     │
│  4. See real-time permission matrix update        │
│  5. [Save] or [Cancel]                            │
│  → Update database                                │
│  → Invalidate cached permissions                  │
│  → Notify active users of role change             │
│                                                    │
│  ACTION 3: CREATE NEW ROLE                        │
│  ────────────────────────────────────────────────  │
│  1. [+ Add Role] button                           │
│  2. Enter role name: "Sous Chef"                 │
│  3. Enter description: "Senior kitchen staff"     │
│  4. Select base role to clone from (optional)     │
│  5. Customize permissions                         │
│  6. [Create Role]                                 │
│  → Store in database                              │
│  → Add to rolePermissions constant                │
│  → Make available for staff assignment            │
│                                                    │
│  ACTION 4: DELETE ROLE                            │
│  ────────────────────────────────────────────────  │
│  1. Click [Delete] button                         │
│  2. Confirm dialog:                               │
│     "Are you sure? This will reassign X staff"    │
│  3. Choose reassignment role for existing staff   │
│  4. Confirm deletion                              │
│  → Delete from database                           │
│  → Reassign all users in that role                │
│  → Update any policy rules                        │
│                                                    │
│  ACTION 5: VIEW PERMISSION MATRIX                 │
│  ────────────────────────────────────────────────  │
│  ┌──────────┬───┬───┬───┬───┐                    │
│  │ Role     │ C │ R │ U │ D │ Actions            │
│  ├──────────┼───┼───┼───┼───┼──────────────┐    │
│  │ Admin    │✓ │✓ │✓ │✓ │ [Edit][Del] │    │
│  │ Manager  │✓ │✓ │✓ │  │ [Edit][Del] │    │
│  │ Chef     │  │✓ │✓ │  │ [Edit][Del] │    │
│  │ Server   │  │✓ │  │  │ [Edit][Del] │    │
│  │ Staff    │  │✓ │  │  │ [Edit][Del] │    │
│  └──────────┴───┴───┴───┴───┴──────────────┘    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 10. LOGOUT & SESSION CLEANUP

```
USER CLICKS LOGOUT
    │
    ↓
┌──────────────────────┐
│ Confirm Dialog?      │ NO → Skip
├──────────────────────┤
│ "Sign out?"          │
│ [Cancel] [Sign Out]  │
└────────┬─────────────┘
         │ YES
         ↓
┌──────────────────────────────────────┐
│ CLEANUP OPERATIONS:                  │
│                                      │
│ 1. Clear auth token from storage     │
│ 2. Clear user state/permissions      │
│ 3. Close all open connections        │
│ 4. Clear cache/temporary data        │
│ 5. Reset form values                 │
│ 6. Invalidate session on server      │
│                                      │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ SET isAuthenticated = false          │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│ RENDER LOGIN PAGE                    │
│ • Form reset                         │
│ • No user data visible               │
│ • Ready for next login               │
└──────────────────────────────────────┘
```

---

## 11. DATABASE SCHEMA (Conceptual)

```
RESTAURANTS
├─ id (PK)
├─ name
├─ address
├─ email
├─ owner_id (FK)
├─ created_at
└─ settings (JSON)

USERS
├─ id (PK)
├─ restaurant_id (FK)
├─ email (UNIQUE)
├─ name
├─ password_hash
├─ role (FK)
├─ avatar_url
├─ is_active
├─ created_at
└─ last_login

ROLES
├─ id (PK)
├─ restaurant_id (FK)
├─ name (admin, manager, etc.)
├─ description
├─ is_custom
├─ created_at
└─ updated_at

PERMISSIONS
├─ id (PK)
├─ role_id (FK)
├─ resource (dashboard, schedules, users, etc.)
├─ action (create, read, update, delete)
└─ description

USER_SESSIONS
├─ id (PK)
├─ user_id (FK)
├─ token_hash
├─ expires_at
├─ created_at
├─ ip_address
└─ user_agent

AUDIT_LOG
├─ id (PK)
├─ user_id (FK)
├─ action (login, create_user, edit_role, etc.)
├─ resource (users, roles, schedules, etc.)
├─ resource_id
├─ changes (JSON: before/after)
├─ timestamp
└─ ip_address
```

---

**Document Version**: 2.0  
**Last Updated**: May 5, 2026  
**Status**: Complete Flow Diagrams for Auth & Role System

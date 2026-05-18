# Urmo Projects Template - Updated with Real Staff

## Overview
The Urmo Projects template has been updated with the actual employee names and positions you provided. This template will be used when seeding any branch with data.

## Staff Members (6 Total)

### 1. Andrew Trump
- **Position:** Meat Specialist
- **Phone:** +58 52551455
- **Email Pattern:** `andrew.trump@{branch}.test`
- **Skills:**
  - Meat (Expert)
  - Grill (Expert)
  - Kitchen (Intermediate)

### 2. Marco
- **Position:** Preparation Chef
- **Phone:** +1-555-0102
- **Email Pattern:** `marco@{branch}.test`
- **Skills:**
  - Kitchen (Expert)
  - Salad (Expert)
  - Meat (Intermediate)

### 3. Mia Khalifa
- **Position:** Dishwashing Specialist
- **Phone:** +1-555-0201
- **Email Pattern:** `mia.khalifa@{branch}.test`
- **Skills:**
  - Dishwashing (Intermediate)
  - Kitchen (Intermediate)
  - Grill (Beginner)

### 4. Brundan Jagila
- **Position:** Burger Specialist
- **Phone:** +371 25582867
- **Email Pattern:** `brundan.jagila@{branch}.test`
- **Skills:**
  - Grill (Expert)
  - Meat (Expert)
  - Fries (Intermediate)

### 5. Masood
- **Position:** Potato Specialist
- **Phone:** +371 2000 0005
- **Email Pattern:** `masood@{branch}.test`
- **Skills:**
  - Fries (Expert)
  - Kitchen (Intermediate)
  - Salad (Beginner)

### 6. Branch Manager
- **Position:** Branch Manager
- **Phone:** +371 2000 0001
- **Email Pattern:** `manager@{branch}.test`
- **Role:** MANAGER
- **Skills:**
  - Kitchen (Expert)
  - Grill (Expert)
  - Bar (Intermediate)

## How It Works

When you seed a branch (e.g., "Downtown Branch"), the system will:

1. **Replace `{branch}` with branch slug:**
   - "Downtown Branch" → `downtown-branch`
   - Email: `andrew.trump@downtown-branch.test`

2. **Assign branch name to all staff:**
   - Each employee gets `branch: "Downtown Branch"`
   - Each employee gets `branchId: "{branch-id}"`

3. **Create consistent data:**
   - Same 6 employees with same skills
   - Same positions and phone numbers
   - Different email addresses per branch

## Example: Seeding "Branch A"

```
Branch: Branch A
Slug: branch-a

Staff Created:
✓ andrew.trump@branch-a.test (Meat Specialist)
✓ marco@branch-a.test (Preparation Chef)
✓ mia.khalifa@branch-a.test (Dishwashing Specialist)
✓ brundan.jagila@branch-a.test (Burger Specialist)
✓ masood@branch-a.test (Potato Specialist)
✓ manager@branch-a.test (Branch Manager)
```

## Additional Template Data

The template also includes:

- **Shifts:** ~250 shifts (7 days × 4 time slots × multiple zones)
- **Tasks:** 17 tasks across 5 categories
- **Inventory:** 18 items across 7 categories
- **Time Slots:**
  - Morning: 10:00-14:00
  - Afternoon: 14:00-18:00
  - Evening: 18:00-22:00
  - Night: 22:00-02:00

## Usage

1. **Go to Branch Management**
2. **Click "Seed with Urmo Template"** on any branch card
3. **Confirm** the action
4. **Wait** for completion (shows success message)

All branches will now use this consistent template with the real employee names and positions!

---

**Note:** Staff creation requires Firebase Authentication setup. The seed function currently logs what would be created but doesn't actually create Firebase Auth users. You can create users manually via User Management or use the `create-test-users.js` script.

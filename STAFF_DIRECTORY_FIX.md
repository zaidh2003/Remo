# Staff Directory Fix - Why Employees Don't Show

## The Issue

You updated the Urmo Projects template with real employee names (Andrew Trump, Marco, Mia Khalifa, etc.), but they don't appear in Staff Directory.

## Why This Happens

The seed template defines the **structure** of employees (names, positions, skills), but it doesn't create actual **Firebase Auth users**. 

Think of it like this:
- ✅ **Template** = Blueprint/Recipe (what employees should look like)
- ❌ **Actual Users** = Real accounts that can login

Staff Directory shows **actual users** from Firebase, not template data.

## The Solution

You need to **create the employees as real users**. You have 2 options:

---

## Option 1: Manual Creation (Recommended)

### Why This is Better:
- ✅ No Firebase credentials needed
- ✅ Works right now in your browser
- ✅ Full control over each employee
- ✅ Can see results immediately

### How to Do It:

1. **Go to User Management** (in sidebar)

2. **Click "Add Employee"** (blue button, top right)

3. **Create each employee one by one:**

```
Employee 1: Andrew Trump
- Email: andrew.trump@urmo-projects.test
- Password: Urmo123!
- Phone: +58 52551455
- Position: Meat Specialist
- Branch: Urmo Projects
- Role: EMPLOYEE

Employee 2: Marco
- Email: marco@urmo-projects.test
- Password: Urmo123!
- Phone: +1-555-0102
- Position: Preparation Chef
- Branch: Urmo Projects
- Role: EMPLOYEE

Employee 3: Mia Khalifa
- Email: mia.khalifa@urmo-projects.test
- Password: Urmo123!
- Phone: +1-555-0201
- Position: Dishwashing Specialist
- Branch: Urmo Projects
- Role: EMPLOYEE

Employee 4: Brundan Jagila
- Email: brundan.jagila@urmo-projects.test
- Password: Urmo123!
- Phone: +371 25582867
- Position: Burger Specialist
- Branch: Urmo Projects
- Role: EMPLOYEE

Employee 5: Masood
- Email: masood@urmo-projects.test
- Password: Urmo123!
- Phone: +371 2000 0005
- Position: Potato Specialist
- Branch: Urmo Projects
- Role: EMPLOYEE

Employee 6: Branch Manager
- Email: manager@urmo-projects.test
- Password: Urmo123!
- Phone: +371 2000 0001
- Position: Branch Manager
- Branch: Urmo Projects
- Role: MANAGER
```

4. **After creating, add skills:**
   - Go to **Staff Directory**
   - Click **Edit** on each employee
   - Add their skills (see skills list below)

### Skills Reference:

| Employee | Skills |
|----------|--------|
| Andrew Trump | Meat (Expert), Grill (Expert), Kitchen (Intermediate) |
| Marco | Kitchen (Expert), Salad (Expert), Meat (Intermediate) |
| Mia Khalifa | Dishwashing (Int), Kitchen (Int), Grill (Beginner) |
| Brundan Jagila | Grill (Expert), Meat (Expert), Fries (Intermediate) |
| Masood | Fries (Expert), Kitchen (Int), Salad (Beginner) |
| Branch Manager | Kitchen (Expert), Grill (Expert), Bar (Intermediate) |

---

## Option 2: Automated Script

### Why Use This:
- ✅ Creates all 6 employees at once
- ✅ Includes skills automatically
- ❌ Requires Firebase credentials

### Prerequisites:

You need Firebase Admin credentials. Either:

**A) Download service account key:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json` in project root

**B) Fill in `.env.local`:**
- Get private key from Firebase Console
- Paste into `FIREBASE_ADMIN_PRIVATE_KEY`

### Run:

```bash
node scripts/create-urmo-employees.js
```

---

## What Happens After Creation

### Before:
```
Staff Directory
┌────────────────────────┐
│ No employees found     │
│ or                     │
│ Only shows you (admin) │
└────────────────────────┘
```

### After:
```
Staff Directory
┌─────────────────────────────────────┐
│ Andrew Trump - Meat Specialist      │
│ Skills: Meat ⭐⭐⭐, Grill ⭐⭐⭐      │
│                                     │
│ Marco - Preparation Chef            │
│ Skills: Kitchen ⭐⭐⭐, Salad ⭐⭐⭐   │
│                                     │
│ Mia Khalifa - Dishwashing Spec.    │
│ Skills: Dishwashing ⭐⭐, Kitchen ⭐⭐│
│                                     │
│ Brundan Jagila - Burger Specialist  │
│ Skills: Grill ⭐⭐⭐, Meat ⭐⭐⭐      │
│                                     │
│ Masood - Potato Specialist          │
│ Skills: Fries ⭐⭐⭐, Kitchen ⭐⭐     │
│                                     │
│ Branch Manager                      │
│ Skills: Kitchen ⭐⭐⭐, Grill ⭐⭐⭐   │
└─────────────────────────────────────┘
```

---

## Important Notes

### About the Template

The template you updated is still useful! It's used when:
- **Seeding shifts** - creates shifts for these employee types
- **Seeding tasks** - creates tasks for these zones
- **Documentation** - shows what employees should exist
- **Future branches** - blueprint for other branches

### About Creating Users

- **Manual creation** = You create each user through UI
- **Script creation** = Script creates all users automatically
- **Both work** = Choose what's easier for you

### About Skills

- Skills are stored in the user's Firestore profile
- They determine which shifts the employee can work
- They're used by the AI for shift assignment
- You can edit them anytime in Staff Directory

---

## Quick Start Guide

### Fastest Way (5-10 minutes):

1. **Open User Management**
2. **Click "Add Employee"** 6 times
3. **Copy-paste** the employee data from above
4. **Go to Staff Directory** - see all 6 employees!
5. **Click Edit** on each - add their skills
6. **Done!** ✅

---

## Troubleshooting

**Q: I created employees but they don't show in Staff Directory**  
A: Make sure you set `Branch: Urmo Projects` when creating them

**Q: Employees show but no skills**  
A: Go to Staff Directory → Edit each employee → Add skills manually

**Q: Can I use different emails?**  
A: Yes! Just make sure they're unique and valid email format

**Q: What's the password for these employees?**  
A: Default is `Urmo123!` - employees can change it after first login

**Q: Do I need to create all 6?**  
A: No! Create as many as you need. The template is just a suggestion.

---

## Files Created

1. **scripts/create-urmo-employees.js** - Automated creation script
2. **HOW_TO_ADD_TEMPLATE_EMPLOYEES.md** - Detailed guide
3. **STAFF_DIRECTORY_FIX.md** - This file (explanation)

---

## Next Steps

1. ✅ **Create employees** (Option 1 or 2)
2. ✅ **Verify in Staff Directory** - should see all employees
3. ✅ **Add skills** (if using Option 1)
4. ✅ **Test shift assignment** - assign shifts to employees
5. ✅ **Test AI recommendations** - see AI suggest employees for shifts

---

**Ready?** Go to User Management → Click "Add Employee" → Start creating! 🚀

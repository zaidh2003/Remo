# How to Add Urmo Projects Template Employees

## Problem
The template employees (Andrew Trump, Marco, Mia Khalifa, etc.) don't show in Staff Directory because they need to be created as actual Firebase Auth users.

## Solution: 2 Options

---

## Option 1: Manual Creation via UI (Recommended - Easy!)

Use the **User Management** page to manually create each employee:

### Steps:

1. **Go to User Management** (sidebar)

2. **Click "Add Employee"** button (top right)

3. **Fill in the form for each employee:**

#### Employee 1: Andrew Trump
```
Full Name: Andrew Trump
Email: andrew.trump@urmo-projects.test
Password: Urmo123!
Phone: +58 52551455
Position: Meat Specialist
Branch: Urmo Projects
Role: EMPLOYEE
```

#### Employee 2: Marco
```
Full Name: Marco
Email: marco@urmo-projects.test
Password: Urmo123!
Phone: +1-555-0102
Position: Preparation Chef
Branch: Urmo Projects
Role: EMPLOYEE
```

#### Employee 3: Mia Khalifa
```
Full Name: Mia Khalifa
Email: mia.khalifa@urmo-projects.test
Password: Urmo123!
Phone: +1-555-0201
Position: Dishwashing Specialist
Branch: Urmo Projects
Role: EMPLOYEE
```

#### Employee 4: Brundan Jagila
```
Full Name: Brundan Jagila
Email: brundan.jagila@urmo-projects.test
Password: Urmo123!
Phone: +371 25582867
Position: Burger Specialist
Branch: Urmo Projects
Role: EMPLOYEE
```

#### Employee 5: Masood
```
Full Name: Masood
Email: masood@urmo-projects.test
Password: Urmo123!
Phone: +371 2000 0005
Position: Potato Specialist
Branch: Urmo Projects
Role: EMPLOYEE
```

#### Employee 6: Branch Manager
```
Full Name: Branch Manager
Email: manager@urmo-projects.test
Password: Urmo123!
Phone: +371 2000 0001
Position: Branch Manager
Branch: Urmo Projects
Role: MANAGER
```

4. **After creating each employee:**
   - Go to **Staff Directory**
   - Find the employee
   - Click **Edit** (pencil icon)
   - Add their **Skills** (zones and proficiency levels)

### Skills to Add:

**Andrew Trump:**
- Meat (Expert)
- Grill (Expert)
- Kitchen (Intermediate)

**Marco:**
- Kitchen (Expert)
- Salad (Expert)
- Meat (Intermediate)

**Mia Khalifa:**
- Dishwashing (Intermediate)
- Kitchen (Intermediate)
- Grill (Beginner)

**Brundan Jagila:**
- Grill (Expert)
- Meat (Expert)
- Fries (Intermediate)

**Masood:**
- Fries (Expert)
- Kitchen (Intermediate)
- Salad (Beginner)

**Branch Manager:**
- Kitchen (Expert)
- Grill (Expert)
- Bar (Intermediate)

---

## Option 2: Automated Script (Requires Firebase Credentials)

Run the script to create all 6 employees automatically:

### Prerequisites:

You need **either**:

**A) Service Account Key File:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **remo-3dedf**
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Save as `serviceAccountKey.json` in project root

**OR**

**B) Environment Variables:**
1. Fill in `.env.local` with valid Firebase Admin credentials
2. Get private key from Firebase Console (same steps as above)
3. Copy the `private_key` value into `FIREBASE_ADMIN_PRIVATE_KEY`

### Run the Script:

```bash
node scripts/create-urmo-employees.js
```

### What It Does:

- Creates all 6 employees with Firebase Auth accounts
- Creates Firestore profiles with skills
- Assigns them to "Urmo Projects" branch
- Shows success message with credentials

### Output:

```
✅ Urmo Projects employees created successfully!

📋 Employee Credentials:
--------------------------------------------------
Andrew Trump (Meat Specialist)
  Email: andrew.trump@urmo-projects.test
  Password: Urmo123!
  Skills: Meat (Expert), Grill (Expert), Kitchen (Intermediate)

Marco (Preparation Chef)
  Email: marco@urmo-projects.test
  Password: Urmo123!
  Skills: Kitchen (Expert), Salad (Expert), Meat (Intermediate)

... (and so on)
```

---

## Verification

After creating employees (either method):

1. **Go to Staff Directory**
2. **You should see all 6 employees**
3. **Each employee should show:**
   - Name and position
   - Phone number
   - Branch: Urmo Projects
   - Skills with proficiency levels

---

## Troubleshooting

### Issue: "Email already exists"
**Solution:** Employee already created. Skip to next one or check Staff Directory.

### Issue: Script fails with "Failed to initialize Firebase Admin"
**Solution:** 
- Make sure `serviceAccountKey.json` exists in project root
- OR fill in `.env.local` with valid credentials
- See Option 2 prerequisites above

### Issue: Employees created but no skills showing
**Solution:** 
- Go to Staff Directory
- Click Edit on each employee
- Manually add their skills (see skills list above)

### Issue: Can't see employees in Staff Directory
**Solution:**
- Make sure you're logged in as Admin or Manager
- Check that employees have `branch: "Urmo Projects"` set
- Refresh the page (F5)

---

## Recommendation

**Use Option 1 (Manual UI)** if:
- ✅ You don't have Firebase credentials set up
- ✅ You want full control over each employee
- ✅ You prefer visual interface
- ✅ You're creating employees for the first time

**Use Option 2 (Script)** if:
- ✅ You have Firebase credentials configured
- ✅ You want to create all 6 employees at once
- ✅ You're comfortable with command line
- ✅ You need to recreate employees quickly

---

## Quick Checklist

- [ ] Choose Option 1 (Manual) or Option 2 (Script)
- [ ] Create all 6 employees
- [ ] Verify employees appear in Staff Directory
- [ ] Add skills to each employee (if using Option 1)
- [ ] Test: Click on employee to see their profile
- [ ] Test: Assign shifts to employees in Weekly Scheduler

---

**Ready to start?** Go to User Management → Click "Add Employee" → Fill in the form! 🚀

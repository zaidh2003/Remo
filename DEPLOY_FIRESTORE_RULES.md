# Deploy Firestore Rules - Quick Guide

**Time Required**: 2 minutes  
**Issue**: Manager cannot update employee skills  
**Solution**: Deploy updated Firestore rules

---

## 🚀 Quick Deploy (2 minutes)

### Option 1: Firebase Console (Easiest)

1. **Open Firebase Console**:
   - Go to: https://console.firebase.google.com/project/remo-3dedf/firestore/rules

2. **Copy the rules**:
   - Open `firestore.rules` file in your project
   - Select all (Ctrl+A)
   - Copy (Ctrl+C)

3. **Paste and publish**:
   - Paste into Firebase Console editor
   - Click "Publish" button
   - Wait for confirmation

4. **Done!** ✅

---

### Option 2: Firebase CLI (For Developers)

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase (if not done)
firebase init firestore

# 4. Deploy rules
firebase deploy --only firestore:rules
```

---

## ✅ Verify It's Working

### Test 1: Manager Updates Employee Skills

1. Log in as **Manager**
2. Go to **Staff Directory**
3. Click **edit icon** on an employee
4. Try to **add/edit skills**
5. Click **Save**
6. Should work without errors ✅

### Test 2: Employee Updates Own Skills

1. Log in as **Employee**
2. Click **profile icon** (top right)
3. Go to **Skills section**
4. Try to **add/edit skills**
5. Click **Save**
6. Should work without errors ✅

---

## 🐛 Troubleshooting

### Still Getting Permission Errors?

**Check 1**: Did you deploy the rules?
- Go to Firebase Console → Firestore → Rules
- Check if the rules match your local file

**Check 2**: Is the user role correct?
- Manager must have `role: "MANAGER"` in Firestore
- Employee must have `role: "EMPLOYEE"` in Firestore

**Check 3**: Are you trying to change the role?
- Managers cannot change employee roles
- Only update: name, phone, position, branch, skills

**Check 4**: Wait a few seconds
- Rules can take 10-30 seconds to propagate
- Try refreshing the page

---

## 📋 What the Rules Allow

| Action | ADMIN | MANAGER | EMPLOYEE |
|--------|-------|---------|----------|
| **Update own profile** | ✅ | ✅ | ✅ |
| **Update own skills** | ✅ | ✅ | ✅ |
| **Update employee skills** | ✅ | ✅ | ❌ |
| **Update employee profile** | ✅ | ✅ | ❌ |
| **Change user roles** | ✅ | ❌ | ❌ |
| **Delete users** | ✅ | ❌ | ❌ |

---

## 🔒 Security

### Protected
- ✅ Role changes (ADMIN only)
- ✅ User deletion (ADMIN only)
- ✅ Cross-user editing (except manager → employee)

### Allowed
- ✅ Manager can update employee skills
- ✅ Employee can update own skills
- ✅ All users can read all profiles

---

## 📖 Related Documents

- **Detailed Explanation**: `FIRESTORE_RULES_FIX.md`
- **Full Rules File**: `firestore.rules`
- **RBAC Guide**: `SYSTEM_CHANGES_AND_RBAC_GUIDE.md`

---

## ✨ Quick Summary

**Problem**: Manager gets permission error updating employee skills  
**Cause**: Firestore rules need to be deployed  
**Solution**: Deploy `firestore.rules` to Firebase  
**Time**: 2 minutes  
**Result**: Managers can update employee skills ✅

---

**Status**: Ready to deploy  
**Action**: Follow Option 1 or Option 2 above  
**Next**: Test as manager and employee

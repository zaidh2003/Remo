# Branch Assignment Solution

## Problem
User's profile panel shows "Branch: —" because existing users in Firestore don't have the `branch` field populated.

## Solution Implemented

### UI-Based Branch Assignment (Recommended)
Added a new button in the **Branch Management** page that allows admins to assign branches to all users directly from the browser.

#### How to Use:
1. **Login as Admin**
2. **Navigate to Branch Management** (from the sidebar)
3. **Click "Assign Branches to Users"** button (blue button at the top)
4. **Confirm the action** in the dialog
5. **Wait for completion** - you'll see success messages
6. **Page will auto-refresh** to show updated data

#### What It Does:
- Gets all users from Firestore
- Creates "Urmo Projects" branch if no branches exist
- Assigns the first available branch to users without a branch
- Skips users who already have a branch assigned
- Shows summary: how many users were updated vs skipped

### Alternative: Node.js Script (Requires Firebase Credentials)
The script `scripts/assign-branches-simple.js` is available but requires:
- Valid Firebase Admin credentials in `.env.local`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

**Note:** The UI-based solution is easier and doesn't require server-side credentials.

## After Assignment

Once branches are assigned, the profile panel will display:
- **Branch name** instead of "—"
- Users can edit their branch in the profile panel (if they have permission)
- Managers can see which branch they're assigned to
- All branch-related features will work correctly

## Files Modified

1. **`components/dashboard/branch-management.tsx`**
   - Added `handleAssignBranches()` function
   - Added "Assign Branches to Users" button
   - Imports: `Users` icon, Firestore functions

2. **`scripts/assign-branches-simple.js`**
   - Updated to manually load `.env.local` (removed dotenv dependency)
   - Ready to use if Firebase credentials are configured

## Verification

After running the assignment:
1. Open your profile panel (click your avatar/name)
2. Check the "Branch" field - should show "Urmo Projects" or your first branch
3. All users should now have branches assigned
4. Branch-based features (scheduling, tasks, etc.) will work correctly

## Next Steps

1. ✅ Click "Assign Branches to Users" in Branch Management
2. ✅ Verify branch appears in profile panel
3. ✅ Test branch-related features (scheduling, tasks, inventory)
4. ✅ Optionally: Reassign users to different branches via User Management

---

**Status:** Ready to use! Just click the button in Branch Management.

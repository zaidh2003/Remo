# Screenshot Capture Script

Automated screenshot capture for REMO User Manual using Playwright.

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **REMO application** running locally or deployed
3. **Test user accounts** created in Firebase

## Installation

### Step 1: Install Playwright

```bash
npm install -D @playwright/test playwright
```

### Step 2: Install Playwright Browsers

```bash
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

## Configuration

### Step 3: Update Credentials

Edit `scripts/capture-screenshots.js` and update the `CONFIG` object:

```javascript
const CONFIG = {
  // Your application URL
  baseUrl: 'http://localhost:3000',  // or your deployed URL
  
  // Test user credentials - CREATE THESE USERS FIRST
  credentials: {
    admin: {
      email: 'admin@remo.app',      // Update with your admin email
      password: 'admin123'            // Update with your admin password
    },
    manager: {
      email: 'manager@remo.app',     // Update with your manager email
      password: 'manager123'          // Update with your manager password
    },
    employee: {
      email: 'employee@remo.app',    // Update with your employee email
      password: 'employee123'         // Update with your employee password
    }
  },
  
  // Screenshot directory (relative to project root)
  screenshotDir: 'screenshots',
  
  // Browser viewport size
  viewport: { width: 1920, height: 1080 },
};
```

## Creating Test Users

Before running the script, create test users in your Firebase:

### Option 1: Using the Application

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/?login`
3. Click "Sign Up"
4. Create three accounts:
   - Admin account
   - Manager account
   - Employee account

### Option 2: Using Firebase Console

1. Go to Firebase Console
2. Navigate to Authentication
3. Add users manually
4. Then use User Management in REMO to assign roles

## Usage

### Step 4: Start Your Application

```bash
npm run dev
```

Wait for the server to start on `http://localhost:3000`

### Step 5: Run the Screenshot Script

In a new terminal:

```bash
node scripts/capture-screenshots.js
```

### What Happens

The script will:
1. Launch a Chromium browser (visible by default)
2. Navigate through your application
3. Capture screenshots of all major features
4. Save images to the `screenshots/` directory
5. Close the browser when complete

### Expected Output

```
🚀 Starting REMO Screenshot Capture
=====================================

Base URL: http://localhost:3000
Screenshot Directory: screenshots
Viewport: 1920x1080

📸 Capturing Landing Page...
✓ Captured: 00-landing-page
✓ Captured: 00-landing-features
✓ Captured: 00-landing-roles

📸 Capturing Signup Page...
✓ Captured: 02-signup-page
✓ Captured: 03-language-selector

Logging in as admin...
✓ Captured: 01-login-page
✓ Logged in as admin

📸 Capturing Dashboard...
✓ Captured: 04-dashboard-overview
✓ Captured: 05-sidebar-navigation
✓ Captured: 06-top-navigation

... (continues for all features)

✅ Screenshot capture complete!
📁 Screenshots saved to: C:\path\to\project\screenshots
```

## Screenshots Captured

The script captures approximately 28+ screenshots:

1. `00-landing-page.png` - Landing page hero
2. `00-landing-features.png` - Features section
3. `00-landing-roles.png` - Roles section
4. `01-login-page.png` - Login page
5. `02-signup-page.png` - Signup form
6. `03-language-selector.png` - Language dropdown
7. `04-dashboard-overview.png` - Main dashboard
8. `05-sidebar-navigation.png` - Sidebar menu
9. `06-top-navigation.png` - Top navigation bar
10. `07-smart-scheduler-main.png` - Smart Scheduler
11. `08-create-schedule-dialog.png` - Create schedule form
12. `09-emergency-board-main.png` - Emergency Board
13. `10-create-emergency-alert.png` - Create emergency alert
14. `11-shortage-alerts-main.png` - Shortage Alerts
15. `12-create-shortage-alert.png` - Create shortage alert
16. `13-ai-suggestion-result.png` - AI suggestion
17. `14-transport-management-main.png` - Transport Management
18. `15-taxi-request-form.png` - Taxi request form
19. `16-staff-directory-main.png` - Staff Directory
20. `17-employee-profile.png` - Employee profile
21. `18-demand-forecast-main.png` - Demand Forecast
22. `19-forecast-chart.png` - Forecast chart
23. `20-inventory-management-main.png` - Inventory Management
24. `21-add-inventory-item.png` - Add inventory item
25. `22-user-management-main.png` - User Management
26. `23-add-user-form.png` - Add user form
27. `24-branch-management-main.png` - Branch Management
28. `25-add-branch-form.png` - Add branch form
29. `26-profile-menu-dropdown.png` - Profile menu
30. `27-profile-settings.png` - Profile settings
31. `28-notification-center.png` - Notification center

## Customization

### Headless Mode

To run without opening a visible browser:

```javascript
const browser = await chromium.launch({ 
  headless: true,  // Change to true
  slowMo: 0        // Remove delay
});
```

### Adjust Delays

If screenshots are capturing before content loads:

```javascript
delays: {
  navigation: 3000,  // Increase wait time
  interaction: 1500,
  animation: 1000
}
```

### Change Screenshot Directory

```javascript
screenshotDir: 'thesis-images',  // Custom directory name
```

### Capture Specific Features Only

Comment out functions you don't need in the `main()` function:

```javascript
async function main() {
  // ...
  await captureLandingPage(page);
  // await captureSignupPage(page);  // Skip this
  await login(page, 'admin');
  await captureDashboard(page);
  // ... etc
}
```

## Troubleshooting

### Issue: "Cannot find module 'playwright'"

**Solution:**
```bash
npm install -D @playwright/test playwright
```

### Issue: "Browser not found"

**Solution:**
```bash
npx playwright install chromium
```

### Issue: "Login failed" or "Element not found"

**Solutions:**
1. Verify your credentials are correct
2. Check that your app is running on the correct URL
3. Increase delay times in CONFIG
4. Check browser console for errors (script runs in non-headless mode by default)

### Issue: Screenshots are blank or incomplete

**Solutions:**
1. Increase `delays.navigation` and `delays.interaction`
2. Check that elements are visible (not hidden by CSS)
3. Ensure data is loaded (you may need test data in Firebase)

### Issue: Some dialogs/modals not captured

**Cause:** The element selectors might not match your actual HTML

**Solution:** Update the selectors in the script to match your components:

```javascript
// Example: Update button selector
await page.click('button:has-text("Your Actual Button Text")');
```

## Adding More Screenshots

To capture additional features:

1. Create a new capture function:

```javascript
async function captureMyFeature(page) {
  console.log('\n📸 Capturing My Feature...');
  
  // Navigate to feature
  await page.click('button:has-text("My Feature")');
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  // Take screenshot
  await takeScreenshot(page, '29-my-feature-main');
}
```

2. Call it in `main()`:

```javascript
async function main() {
  // ... existing code
  await captureMyFeature(page);
}
```

## Using Screenshots in User Manual

After capturing:

1. Review all screenshots in the `screenshots/` directory
2. Rename if needed for better organization
3. Insert into `USER_MANUAL.md` by replacing placeholders:

```markdown
**[INSERT SCREENSHOT: Landing page]**
```

Replace with:

```markdown
![Landing Page](screenshots/00-landing-page.png)
```

4. For Word documents, insert images directly

## Tips for Best Results

1. **Populate Test Data**: Add sample employees, schedules, alerts before running
2. **Clean UI**: Close unnecessary dialogs/notifications
3. **Consistent Theme**: Use the same theme (light/dark) for all screenshots
4. **High Resolution**: Keep viewport at 1920x1080 for crisp images
5. **Review**: Check each screenshot after capture for quality

## Advanced: Capture with Different Roles

To capture employee or manager views:

```javascript
// In main() function
await logout(page);
await login(page, 'employee');  // or 'manager'
await captureDashboard(page);
// ... capture employee-specific features
```

## Performance

- **Full run time**: ~5-10 minutes (depending on delays)
- **Screenshot size**: ~100-500KB per image
- **Total size**: ~10-20MB for all screenshots

## Support

If you encounter issues:

1. Check the browser console (script runs in visible mode)
2. Increase delay times
3. Verify selectors match your HTML
4. Ensure test data exists in Firebase
5. Check that all features are accessible with your test user roles

---

**Happy Screenshot Capturing! 📸**

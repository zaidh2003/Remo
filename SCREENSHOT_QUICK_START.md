# Quick Start: Automated Screenshot Capture

Get screenshots for your user manual in 5 minutes!

## Step 1: Install Playwright

```bash
npm install -D @playwright/test playwright
npx playwright install chromium
```

## Step 2: Create Test Users

You need three test accounts with different roles:

1. Go to your app: `http://localhost:3000/?login`
2. Click "Sign Up" and create:
   - **Admin**: `admin@remo.app` / `admin123`
   - **Manager**: `manager@remo.app` / `manager123`
   - **Employee**: `employee@remo.app` / `employee123`

3. Use User Management to assign proper roles to each account

## Step 3: Update Configuration

Edit `scripts/capture-screenshots.js` line 23-35:

```javascript
credentials: {
  admin: {
    email: 'admin@remo.app',      // Your admin email
    password: 'admin123'            // Your admin password
  },
  manager: {
    email: 'manager@remo.app',     // Your manager email
    password: 'manager123'          // Your manager password
  },
  employee: {
    email: 'employee@remo.app',    // Your employee email
    password: 'employee123'         // Your employee password
  }
}
```

## Step 4: Start Your App

```bash
npm run dev
```

Wait for it to start on `http://localhost:3000`

## Step 5: Run Screenshot Script

Open a new terminal:

```bash
npm run screenshots
```

Or:

```bash
node scripts/capture-screenshots.js
```

## Step 6: Watch the Magic! ✨

The browser will open and automatically:
- Navigate through all features
- Capture 28+ screenshots
- Save them to `screenshots/` folder

## Step 7: Use Screenshots

Find your screenshots in the `screenshots/` directory:
- `00-landing-page.png`
- `01-login-page.png`
- `04-dashboard-overview.png`
- ... and more!

Insert them into your `USER_MANUAL.md` by replacing the placeholders.

## Troubleshooting

**Script fails to login?**
- Check credentials are correct
- Verify users exist in Firebase
- Make sure app is running

**Screenshots are blank?**
- Increase delay times in CONFIG (line 40-44)
- Add test data (employees, schedules, etc.)

**Element not found errors?**
- Some features might not be visible
- Script will continue and capture what it can

## Tips

1. **Add Test Data First**: Create sample employees, schedules, alerts
2. **Run in Visible Mode**: Keep `headless: false` to watch progress
3. **Review Screenshots**: Check quality before using in thesis
4. **Retake if Needed**: Run script multiple times until perfect

## Need Help?

Check `scripts/README.md` for detailed documentation.

---

**That's it! You now have automated screenshot capture for your thesis! 🎉**

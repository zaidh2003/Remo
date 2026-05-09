/**
 * Automated Screenshot Capture Script for REMO User Manual
 * 
 * This script uses Playwright to automatically navigate through the REMO application
 * and capture screenshots for the user manual.
 * 
 * Prerequisites:
 * 1. Install Playwright: npm install -D @playwright/test
 * 2. Install browsers: npx playwright install
 * 3. Start your dev server: npm run dev
 * 4. Update credentials below
 * 
 * Usage: node scripts/capture-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const CONFIG = {
  // Application URL
  baseUrl: 'http://localhost:3000',
  
  // Test credentials - UPDATE THESE
  credentials: {
    admin: {
      email: 'admin@remo.app',
      password: 'admin123'
    },
    manager: {
      email: 'manager@remo.app',
      password: 'manager123'
    },
    employee: {
      email: 'employee@remo.app',
      password: 'employee123'
    }
  },
  
  // Screenshot settings
  screenshotDir: 'screenshots',
  viewport: { width: 1920, height: 1080 },
  
  // Delays (in milliseconds)
  delays: {
    navigation: 2000,  // Wait after navigation
    interaction: 1000, // Wait after clicking/typing
    animation: 500     // Wait for animations
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function setupScreenshotDir() {
  const dir = path.join(process.cwd(), CONFIG.screenshotDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function takeScreenshot(page, name, fullPage = false) {
  const screenshotPath = path.join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage,
    animations: 'disabled'
  });
  console.log(`✓ Captured: ${name}`);
}

async function login(page, role = 'admin') {
  const creds = CONFIG.credentials[role];
  
  console.log(`\nLogging in as ${role}...`);
  await page.goto(CONFIG.baseUrl + '/?login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  // Fill in credentials
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.waitForTimeout(CONFIG.delays.interaction);
  
  // Take login page screenshot before submitting
  await takeScreenshot(page, '01-login-page');
  
  // Submit login
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  console.log(`✓ Logged in as ${role}`);
}

async function logout(page) {
  try {
    // Click profile menu
    await page.click('[data-testid="profile-menu"], .profile-button, button:has-text("Profile")').catch(() => {});
    await page.waitForTimeout(CONFIG.delays.interaction);
    
    // Click logout
    await page.click('button:has-text("Logout"), button:has-text("Sign Out")').catch(() => {});
    await page.waitForTimeout(CONFIG.delays.navigation);
  } catch (error) {
    console.log('Logout failed, continuing...');
  }
}

// ============================================
// SCREENSHOT CAPTURE FUNCTIONS
// ============================================

async function captureLandingPage(page) {
  console.log('\n📸 Capturing Landing Page...');
  
  await page.goto(CONFIG.baseUrl + '/landing');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '00-landing-page', true);
  
  // Scroll to features section
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(CONFIG.delays.animation);
  await takeScreenshot(page, '00-landing-features');
  
  // Scroll to roles section
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(CONFIG.delays.animation);
  await takeScreenshot(page, '00-landing-roles');
}

async function captureSignupPage(page) {
  console.log('\n📸 Capturing Signup Page...');
  
  await page.goto(CONFIG.baseUrl + '/?login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  // Click Sign Up link
  await page.click('button:has-text("Sign Up")');
  await page.waitForTimeout(CONFIG.delays.interaction);
  
  await takeScreenshot(page, '02-signup-page');
  
  // Show language selector
  await page.click('select').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.animation);
  await takeScreenshot(page, '03-language-selector');
}

async function captureDashboard(page) {
  console.log('\n📸 Capturing Dashboard...');
  
  await page.waitForSelector('[data-testid="dashboard"], .dashboard, main').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '04-dashboard-overview');
  
  // Capture sidebar
  await takeScreenshot(page, '05-sidebar-navigation');
  
  // Capture top navigation
  await takeScreenshot(page, '06-top-navigation');
}

async function captureSmartScheduler(page) {
  console.log('\n📸 Capturing Smart Scheduler...');
  
  // Navigate to scheduler
  await page.click('button:has-text("Smart Scheduler"), button:has-text("Scheduler")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '07-smart-scheduler-main', true);
  
  // Try to open create schedule dialog
  try {
    await page.click('button:has-text("Create Schedule"), button:has-text("New Schedule")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '08-create-schedule-dialog');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture create schedule dialog');
  }
}

async function captureEmergencyBoard(page) {
  console.log('\n📸 Capturing Emergency Board...');
  
  // Navigate to emergency board
  await page.click('button:has-text("Emergency"), a:has-text("Emergency")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '09-emergency-board-main', true);
  
  // Try to open create alert dialog
  try {
    await page.click('button:has-text("Create Emergency"), button:has-text("New Alert")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '10-create-emergency-alert');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture create emergency dialog');
  }
}

async function captureShortageAlerts(page) {
  console.log('\n📸 Capturing Shortage Alerts...');
  
  // Navigate to shortage alerts
  await page.click('button:has-text("Shortage"), a:has-text("Shortage")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '11-shortage-alerts-main', true);
  
  // Try to open create alert dialog
  try {
    await page.click('button:has-text("Create Alert"), button:has-text("New Shortage")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '12-create-shortage-alert');
    
    // Try to click AI suggestion button
    await page.click('button:has-text("AI Suggestion"), button:has-text("Get AI")').catch(() => {});
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '13-ai-suggestion-result');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture shortage alert dialogs');
  }
}

async function captureTransportManagement(page) {
  console.log('\n📸 Capturing Transport Management...');
  
  // Navigate to transport
  await page.click('button:has-text("Transport"), button:has-text("Taxi"), a:has-text("Transport")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '14-transport-management-main', true);
  
  // Try to open request taxi dialog
  try {
    await page.click('button:has-text("Request Taxi"), button:has-text("New Request")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '15-taxi-request-form');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture taxi request dialog');
  }
}

async function captureStaffDirectory(page) {
  console.log('\n📸 Capturing Staff Directory...');
  
  // Navigate to staff directory
  await page.click('button:has-text("Staff"), a:has-text("Staff")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '16-staff-directory-main', true);
  
  // Try to open employee profile
  try {
    await page.click('.staff-card, .employee-card, [data-testid="employee-card"]').first().catch(() => {});
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '17-employee-profile');
    
    // Close profile
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture employee profile');
  }
}

async function captureDemandForecast(page) {
  console.log('\n📸 Capturing Demand Forecast...');
  
  // Navigate to forecast
  await page.click('button:has-text("Forecast"), button:has-text("Demand"), a:has-text("Forecast")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '18-demand-forecast-main', true);
  await takeScreenshot(page, '19-forecast-chart');
}

async function captureInventoryManagement(page) {
  console.log('\n📸 Capturing Inventory Management...');
  
  // Navigate to inventory
  await page.click('button:has-text("Inventory"), a:has-text("Inventory")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '20-inventory-management-main', true);
  
  // Try to open add item dialog
  try {
    await page.click('button:has-text("Add Item"), button:has-text("New Item")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '21-add-inventory-item');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture add item dialog');
  }
}

async function captureUserManagement(page) {
  console.log('\n📸 Capturing User Management (Admin)...');
  
  // Navigate to user management
  await page.click('button:has-text("User Management"), button:has-text("Users"), a:has-text("Users")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '22-user-management-main', true);
  
  // Try to open add user dialog
  try {
    await page.click('button:has-text("Add User"), button:has-text("New User")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '23-add-user-form');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture add user dialog');
  }
}

async function captureBranchManagement(page) {
  console.log('\n📸 Capturing Branch Management (Admin)...');
  
  // Navigate to branch management
  await page.click('button:has-text("Branch"), a:has-text("Branch")').catch(() => {});
  await page.waitForTimeout(CONFIG.delays.navigation);
  
  await takeScreenshot(page, '24-branch-management-main', true);
  
  // Try to open add branch dialog
  try {
    await page.click('button:has-text("Add Branch"), button:has-text("New Branch")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '25-add-branch-form');
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture add branch dialog');
  }
}

async function captureProfileSettings(page) {
  console.log('\n📸 Capturing Profile Settings...');
  
  // Click profile menu
  try {
    await page.click('[data-testid="profile-menu"], .profile-button, button:has-text("Profile")');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '26-profile-menu-dropdown');
    
    // Click profile settings
    await page.click('button:has-text("Settings"), a:has-text("Settings")');
    await page.waitForTimeout(CONFIG.delays.navigation);
    await takeScreenshot(page, '27-profile-settings', true);
  } catch (error) {
    console.log('Could not capture profile settings');
  }
}

async function captureNotifications(page) {
  console.log('\n📸 Capturing Notifications...');
  
  // Click notification bell
  try {
    await page.click('[data-testid="notification-bell"], button:has([class*="bell"])');
    await page.waitForTimeout(CONFIG.delays.interaction);
    await takeScreenshot(page, '28-notification-center');
    
    // Close notifications
    await page.keyboard.press('Escape');
    await page.waitForTimeout(CONFIG.delays.animation);
  } catch (error) {
    console.log('Could not capture notifications');
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Starting REMO Screenshot Capture');
  console.log('=====================================\n');
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Screenshot Directory: ${CONFIG.screenshotDir}`);
  console.log(`Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height}\n`);
  
  // Setup screenshot directory
  await setupScreenshotDir();
  
  // Launch browser
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: false,  // Set to true for headless mode
    slowMo: 100       // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  try {
    // Capture landing page (no login required)
    await captureLandingPage(page);
    
    // Capture signup page
    await captureSignupPage(page);
    
    // Login as admin and capture admin features
    await login(page, 'admin');
    await captureDashboard(page);
    await captureSmartScheduler(page);
    await captureEmergencyBoard(page);
    await captureShortageAlerts(page);
    await captureTransportManagement(page);
    await captureStaffDirectory(page);
    await captureDemandForecast(page);
    await captureInventoryManagement(page);
    await captureUserManagement(page);
    await captureBranchManagement(page);
    await captureProfileSettings(page);
    await captureNotifications(page);
    
    console.log('\n✅ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${path.join(process.cwd(), CONFIG.screenshotDir)}`);
    
  } catch (error) {
    console.error('\n❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
main().catch(console.error);

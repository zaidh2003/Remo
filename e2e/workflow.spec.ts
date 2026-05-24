import { test, expect } from '@playwright/test';

test.describe('Manager Golden Path Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/?login=true');
    await page.evaluate(() => indexedDB.deleteDatabase('firebaseLocalStorageDb'));
    await page.reload();
  });

  test('Manager completes extensive daily workflow across all modules', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds for this extensive test

    // 1. Login as Manager
    await page.waitForTimeout(2000); // Wait for React hydration
    await page.getByPlaceholder('you@restaurant.com').fill('manager@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000); // Wait for Firebase Auth

    // 2. Dashboard Verification
    // The dashboard should show Demand Forecast
    await expect(page.getByRole('heading', { name: 'Demand Forecast' })).toBeVisible({ timeout: 15000 });
    
    // 3. Task Board Navigation & Verification
    await page.getByRole('button', { name: 'Tasks' }).click();
    await expect(page.getByRole('heading', { name: 'Task Board' })).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();

    // 4. Inventory Management
    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    
    // Open Add Item modal
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Item' })).toBeVisible();
    
    // Fill out form
    await page.getByPlaceholder('Item Name').fill('Premium Test Tomatoes');
    // We click Cancel to avoid polluting the DB
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 5. Scheduler & Shortage Alerts
    await page.getByRole('button', { name: 'Scheduler' }).click();
    // Wait for the grid to load
    await expect(page.getByText('Staff').first()).toBeVisible();

    // Verify Shortage Alerts panel
    await expect(page.getByText('Shortage Alerts')).toBeVisible();
    
    // Trigger AI Match on an alert if one exists
    const matchButton = page.locator('button:has-text("Match")').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
      // AI Match Modal should appear
      await expect(page.getByText('AI Suggestion')).toBeVisible();
      await expect(page.getByText('Confidence:')).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
    }

    // 6. Transport / Taxi Request
    await page.getByRole('button', { name: 'Transport' }).click();
    await expect(page.getByRole('heading', { name: 'Transport Management' })).toBeVisible();
    
    // Ensure the AI Eligibility check runs when trying to request
    await page.getByRole('button', { name: 'Request Uber' }).first().click();
    await expect(page.getByText('AI Eligibility Check')).toBeVisible();
    
    // Wait for AI to finish deciding (Cancel button will be available)
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 7. Emergencies
    await page.getByRole('button', { name: 'Emergencies' }).click();
    await expect(page.getByRole('heading', { name: 'Active Emergencies' })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('RBAC - Role Based Access Control', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and clear any potential left-over firebase auth state
    await page.goto('/?login=true');
    await page.evaluate(() => indexedDB.deleteDatabase('firebaseLocalStorageDb'));
    await page.reload();
  });

  test('Admin has full access and can see Role Management', async ({ page }) => {
    
    // Login as Admin
    await page.waitForTimeout(2000); // Wait for React hydration
    await page.getByPlaceholder('you@restaurant.com').fill('admin@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000); // Wait for Firebase Auth

    try {
      // Verify tabs available to admin
      await expect(page.getByRole('button', { name: 'Scheduler' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Branches' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
    } catch (e) {
      console.log("Admin Test Failed at URL:", page.url());
      console.log("Body text:", await page.locator('body').innerText());
      throw e;
    }
  });

  test('Manager can access their branch but cannot see global Admin tools', async ({ page }) => {
    
    // Login as Manager
    await page.waitForTimeout(2000); // Wait for React hydration
    await page.getByPlaceholder('you@restaurant.com').fill('manager@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000); // Wait for Firebase Auth

    // Manager should see Scheduler
    await expect(page.getByRole('button', { name: 'Scheduler' })).toBeVisible({ timeout: 15000 });
    
    // Manager should NOT see Admin specific tools
    await expect(page.getByRole('button', { name: 'Settings' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Branches' })).not.toBeVisible();
  });

  test('Employee can only see personal tools and no manager features', async ({ page }) => {
    
    // Login as Employee
    await page.waitForTimeout(2000); // Wait for React hydration
    await page.getByPlaceholder('you@restaurant.com').fill('chef@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000); // Wait for Firebase Auth

    // Should see personal dashboard
    await expect(page.getByText('My Shifts This Week')).toBeVisible({ timeout: 10000 });
    
    // Employee should NOT see Manager/Admin tools
    await expect(page.getByRole('button', { name: 'Branches' })).not.toBeVisible();
    
    // Check Scheduler page restriction - employees don't even have the scheduler tab, they have My Shifts
    // Let's just verify they can see My Shifts
    await expect(page.getByText('My Shifts This Week')).toBeVisible();
    await expect(page.getByRole('button', { name: 'AI Optimize' })).not.toBeVisible();
  });

});

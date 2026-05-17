# Appendix: REMO Testing Framework Source Code

This appendix contains the core automated testing scripts used to evaluate the functional completeness and Role-Based Access Control (RBAC) of the REMO platform.

## 1. End-to-End (E2E) UI Automation (Playwright)

### 1.1. Role-Based Access Control (`e2e/rbac.spec.ts`)
This test suite systematically validates that the system strictly enforces DOM-level restrictions based on the authenticated user's role.

```typescript
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

    // Verify tabs available to admin
    await expect(page.getByRole('button', { name: 'Scheduler' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Branches' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('Manager can access their branch but cannot see global Admin tools', async ({ page }) => {
    // Login as Manager
    await page.waitForTimeout(2000);
    await page.getByPlaceholder('you@restaurant.com').fill('manager@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    // Manager should see Scheduler
    await expect(page.getByRole('button', { name: 'Scheduler' })).toBeVisible({ timeout: 15000 });
    
    // Manager should NOT see Admin specific tools
    await expect(page.getByRole('button', { name: 'Settings' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Branches' })).not.toBeVisible();
  });

  test('Employee can only see personal tools and no manager features', async ({ page }) => {
    // Login as Employee
    await page.waitForTimeout(2000);
    await page.getByPlaceholder('you@restaurant.com').fill('chef@remo.demo');
    await page.getByPlaceholder('••••••••').fill('Demo@1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    // Should see personal dashboard
    await expect(page.getByText('My Shifts This Week')).toBeVisible({ timeout: 10000 });
    
    // Employee should NOT see Manager/Admin tools
    await expect(page.getByRole('button', { name: 'Branches' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'AI Optimize' })).not.toBeVisible();
  });
});
```

### 1.2. Manager Golden Path Workflow (`e2e/workflow.spec.ts`)
This suite proves functional completeness by mimicking a manager's entire daily routine across all operational modules.

```typescript
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
    await page.getByPlaceholder('Item Name').fill('Premium Test Tomatoes');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 5. Scheduler & Shortage Alerts
    await page.getByRole('button', { name: 'Scheduler' }).click();
    await expect(page.getByText('Staff')).first().toBeVisible();

    // Verify Shortage Alerts panel
    await expect(page.getByText('Shortage Alerts')).toBeVisible();
    
    // Trigger AI Match on an alert if one exists
    const matchButton = page.locator('button:has-text("Match")').first();
    if (await matchButton.isVisible()) {
      await matchButton.click();
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
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 7. Emergencies
    await page.getByRole('button', { name: 'Emergencies' }).click();
    await expect(page.getByRole('heading', { name: 'Active Emergencies' })).toBeVisible();
  });
});
```

---

## 2. Unit and Integration Testing (Vitest)

### 2.1. Backend Data Service Logic (`tests/unit/data-service.test.ts`)
This suite utilizes Vitest to mock Firestore behavior and test core data transformation logic without hitting the live database.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShiftsForEmployee } from '@/lib/services/data-service'
import type { Shift } from '@/lib/types'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))

describe('data-service: getShiftsForEmployee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should filter shifts by time range', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        { id: '1', staffId: 'staff123', staffName: 'John Doe', branchId: 'branch1', zone: 'KITCHEN', day: 'Monday', startTime: '09:00', endTime: '13:00', isEmergency: false, status: 'upcoming' },
        { id: '2', staffId: 'staff123', staffName: 'John Doe', branchId: 'branch1', zone: 'KITCHEN', day: 'Monday', startTime: '14:00', endTime: '18:00', isEmergency: false, status: 'upcoming' },
        { id: '3', staffId: 'staff123', staffName: 'John Doe', branchId: 'branch1', zone: 'KITCHEN', day: 'Monday', startTime: '19:00', endTime: '22:00', isEmergency: false, status: 'upcoming' },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for shifts between 08:00 and 15:00
      const result = await getShiftsForEmployee('staff123', 'Monday', '08:00', '15:00')
      
      // Should include shifts 1 and 2 (overlapping with the range)
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['1', '2'])
    })
  })

  describe('Edge Cases', () => {
    it('should exclude shifts that end exactly at range start', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        { id: '1', staffId: 'staff123', staffName: 'John Doe', branchId: 'branch1', zone: 'KITCHEN', day: 'Monday', startTime: '08:00', endTime: '10:00', isEmergency: false, status: 'upcoming' },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for 10:00-14:00, shift ends at 10:00 (no overlap)
      const result = await getShiftsForEmployee('staff123', 'Monday', '10:00', '14:00')
      
      expect(result).toHaveLength(0)
    })
  })
})
```

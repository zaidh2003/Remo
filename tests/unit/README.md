# Unit Tests

This directory contains unit tests for specific examples and edge cases.

## Structure

Unit tests are organized by feature area:

- `branch-management.test.ts` - Branch CRUD operations
- `alert-filtering.test.ts` - Alert filtering by branch
- `language-persistence.test.ts` - Language selection and persistence
- `worker-unavailability.test.ts` - Marking workers unavailable
- `sick-leave.test.ts` - Sick leave processing
- `notifications.test.ts` - Notification delivery
- `swap-requests.test.ts` - Swap request handling

## Running Tests

```bash
# Run all unit tests
pnpm test tests/unit

# Run specific test file
pnpm test tests/unit/branch-management.test.ts

# Run in watch mode
pnpm test:watch tests/unit
```

## Test Structure

Unit tests focus on:
- Specific examples that demonstrate correct behavior
- Important edge cases (empty inputs, boundary values, error conditions)
- Role-based access control
- Integration between components

Example:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Branch Management', () => {
  describe('Admin Access', () => {
    it('should allow admin to create branches', async () => {
      // Test implementation
    })
    
    it('should prevent non-admin from creating branches', async () => {
      // Test implementation
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle empty branch name', async () => {
      // Test implementation
    })
  })
})
```

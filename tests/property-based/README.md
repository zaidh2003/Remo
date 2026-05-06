# Property-Based Tests

This directory contains property-based tests using fast-check for the incomplete features completion spec.

## Structure

- `branch-management.test.ts` - Tests for branch CRUD operations (Properties 1-4)
- `alert-filtering.test.ts` - Tests for branch-filtered alerts (Properties 5-7)
- `language-persistence.test.ts` - Tests for language selection and persistence (Properties 8-10)
- `worker-unavailability.test.ts` - Tests for marking workers unavailable (Properties 11-13)
- `sick-leave.test.ts` - Tests for automatic sick leave processing (Properties 14-16)
- `notifications.test.ts` - Tests for shift assignment notifications (Properties 17-18)
- `swap-requests.test.ts` - Tests for swap request approval and updates (Properties 19-21)

## Running Tests

```bash
# Run all property-based tests
pnpm test tests/property-based

# Run specific test file
pnpm test tests/property-based/branch-management.test.ts

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

## Property Test Format

Each property test follows this structure:

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Feature: incomplete-features-completion, Property X: Description', () => {
  it('should verify the property holds for all valid inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generators for test data
        fc.record({
          field1: fc.string(),
          field2: fc.integer(),
        }),
        async (testData) => {
          // Test logic
          const result = await functionUnderTest(testData)
          
          // Assertions
          expect(result).toBeDefined()
        }
      ),
      { numRuns: 100 } // Run 100 iterations
    )
  })
})
```

## Tag Format

Each test must include the feature and property identifier:
- **Feature**: incomplete-features-completion
- **Property**: Property number and name from design.md

Example: `Feature: incomplete-features-completion, Property 1: Branch Creation Persistence`

# Testing Guide

This guide explains the testing infrastructure for the incomplete features completion spec.

## Overview

The project uses **Vitest** as the test runner and **fast-check** for property-based testing. Tests are organized into two categories:

1. **Unit Tests** (`tests/unit/`) - Specific examples and edge cases
2. **Property-Based Tests** (`tests/property-based/`) - Universal properties verified across many inputs

## Installation

All testing dependencies are already installed:

```bash
pnpm install
```

Dependencies:
- `vitest` - Fast test runner with TypeScript support
- `@vitest/ui` - Interactive UI for running tests
- `fast-check` - Property-based testing library

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run tests with interactive UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Running Specific Tests

```bash
# Run all property-based tests
pnpm test tests/property-based

# Run all unit tests
pnpm test tests/unit

# Run a specific test file
pnpm test tests/property-based/branch-management.test.ts

# Run tests matching a pattern
pnpm test branch
```

### Filtering Tests

```bash
# Run only tests with "admin" in the name
pnpm test -t admin

# Run tests in a specific file matching a pattern
pnpm test branch-management.test.ts -t "create"
```

## Test Structure

### Directory Layout

```
tests/
├── setup.ts                    # Global test setup
├── TESTING_GUIDE.md           # This file
├── unit/                      # Unit tests
│   ├── README.md
│   ├── example.test.ts        # Example (can be deleted)
│   └── [feature].test.ts      # Feature-specific tests
└── property-based/            # Property-based tests
    ├── README.md
    ├── example.test.ts        # Example (can be deleted)
    └── [feature].test.ts      # Feature-specific tests
```

### Test File Naming

- Test files must end with `.test.ts` or `.spec.ts`
- Use descriptive names: `branch-management.test.ts`, not `test1.test.ts`
- Co-locate tests with source files when appropriate (e.g., `component.tsx` and `component.test.tsx`)

## Writing Unit Tests

Unit tests verify specific examples and edge cases:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Feature Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize test data
  })

  // Cleanup after each test
  afterEach(() => {
    // Clean up resources
  })

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe('expected')
    })

    it('should handle edge case', () => {
      expect(() => functionUnderTest(null)).toThrow()
    })
  })
})
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected)           // Strict equality (===)
expect(value).toEqual(expected)        // Deep equality for objects

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeDefined()
expect(value).toBeNull()

// Numbers
expect(value).toBeGreaterThan(5)
expect(value).toBeLessThanOrEqual(10)
expect(value).toBeCloseTo(0.3, 5)      // Floating point comparison

// Strings
expect(string).toContain('substring')
expect(string).toMatch(/regex/)

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain(item)
expect(array).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toMatchObject({ key: 'value' })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')

// Async
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

## Writing Property-Based Tests

Property-based tests verify that properties hold for all valid inputs:

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Feature: incomplete-features-completion, Property 1: Description', () => {
  it('should verify the property holds for all inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Define generators for test data
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          age: fc.integer({ min: 0, max: 120 }),
          email: fc.emailAddress(),
        }),
        async (testData) => {
          // Perform operation
          const result = await functionUnderTest(testData)
          
          // Verify property holds
          expect(result).toBeDefined()
          expect(result.id).toBeTruthy()
        }
      ),
      { numRuns: 100 } // Run 100 random iterations
    )
  })
})
```

### fast-check Generators

```typescript
// Primitives
fc.boolean()
fc.integer()                           // Any integer
fc.integer({ min: 0, max: 100 })      // Range
fc.float()
fc.double()
fc.string()                            // Any string
fc.string({ minLength: 1, maxLength: 50 })
fc.char()
fc.ascii()
fc.uuid()

// Dates and Times
fc.date()
fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })

// Arrays
fc.array(fc.integer())                 // Array of integers
fc.array(fc.string(), { minLength: 1, maxLength: 10 })

// Objects
fc.record({
  name: fc.string(),
  age: fc.integer(),
})
fc.dictionary(fc.string(), fc.integer()) // Key-value pairs

// Options
fc.option(fc.string())                 // string | null
fc.option(fc.string(), { nil: undefined }) // string | undefined

// Combinations
fc.oneof(fc.string(), fc.integer())    // string | number
fc.tuple(fc.string(), fc.integer())    // [string, number]

// Custom generators
fc.constantFrom('ADMIN', 'MANAGER', 'EMPLOYEE')
fc.emailAddress()
fc.webUrl()

// Filtering
fc.integer().filter(n => n % 2 === 0)  // Even numbers only

// Mapping
fc.integer().map(n => n * 2)           // Transform values
```

### Property Test Best Practices

1. **Run enough iterations**: Use at least 100 runs for thorough testing
2. **Use smart generators**: Constrain input space to valid values
3. **Test properties, not examples**: Focus on universal truths
4. **Keep tests fast**: Avoid expensive operations in property tests
5. **Use shrinking**: fast-check automatically finds minimal failing cases

### Example Properties

```typescript
// Idempotency: f(f(x)) = f(x)
fc.assert(
  fc.property(fc.string(), (str) => {
    const once = normalize(str)
    const twice = normalize(once)
    expect(once).toBe(twice)
  })
)

// Inverse: f(g(x)) = x
fc.assert(
  fc.property(fc.string(), (str) => {
    const encoded = encode(str)
    const decoded = decode(encoded)
    expect(decoded).toBe(str)
  })
)

// Invariant: property always holds
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const sorted = sort(arr)
    expect(isSorted(sorted)).toBe(true)
  })
)
```

## Mocking and Stubbing

### Mocking Functions

```typescript
import { vi } from 'vitest'

// Create a mock function
const mockFn = vi.fn()

// Mock with return value
const mockFn = vi.fn(() => 'result')

// Mock with implementation
const mockFn = vi.fn((x) => x * 2)

// Verify calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)

// Clear mock history
mockFn.mockClear()
```

### Mocking Modules

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('./module', () => ({
  functionName: vi.fn(() => 'mocked'),
}))

// Partial mock
vi.mock('./module', async () => {
  const actual = await vi.importActual('./module')
  return {
    ...actual,
    specificFunction: vi.fn(),
  }
})
```

### Mocking Firebase

```typescript
import { vi } from 'vitest'

// Mock Firestore operations
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ id: '123', name: 'Test' }),
  })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
}))
```

## Testing Async Code

```typescript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBe('success')
})

// Testing promises
it('should resolve promise', () => {
  return expect(promise).resolves.toBe('value')
})

it('should reject promise', () => {
  return expect(promise).rejects.toThrow('error')
})

// Testing callbacks
it('should call callback', (done) => {
  functionWithCallback((result) => {
    expect(result).toBe('success')
    done()
  })
})
```

## Coverage Reports

Generate coverage reports to identify untested code:

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON data

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Debugging Tests

### Using Console Logs

```typescript
it('should debug test', () => {
  console.log('Debug info:', value)
  expect(value).toBe(expected)
})
```

### Using Vitest UI

```bash
pnpm test:ui
```

The UI provides:
- Visual test results
- Test execution timeline
- Console output per test
- Code coverage visualization

### Running Single Test

```typescript
// Run only this test
it.only('should run this test', () => {
  // ...
})

// Skip this test
it.skip('should skip this test', () => {
  // ...
})
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Troubleshooting

### Tests Not Found

- Ensure test files end with `.test.ts` or `.spec.ts`
- Check that files are in the correct directory
- Verify `vitest.config.ts` includes the correct patterns

### Import Errors

- Check path aliases in `vitest.config.ts`
- Ensure TypeScript configuration is correct
- Verify dependencies are installed

### Slow Tests

- Reduce `numRuns` in property tests during development
- Use `it.only` to run specific tests
- Mock expensive operations (API calls, database queries)

### Flaky Tests

- Avoid relying on timing (use `waitFor` utilities)
- Clean up state between tests
- Use deterministic data instead of random values in unit tests

## Best Practices

1. **Write tests first** (TDD) when possible
2. **Keep tests simple** - one assertion per test when practical
3. **Use descriptive names** - test names should explain what is being tested
4. **Avoid test interdependence** - each test should run independently
5. **Clean up resources** - use `afterEach` to prevent test pollution
6. **Test behavior, not implementation** - focus on what, not how
7. **Use property tests for algorithms** - verify universal properties
8. **Use unit tests for examples** - verify specific cases
9. **Mock external dependencies** - tests should be fast and reliable
10. **Keep tests maintainable** - refactor tests as you refactor code

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)

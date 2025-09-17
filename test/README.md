# Test Setup Documentation

This project uses Bun's native testing framework for all tests. The test suite is organized with co-located unit tests and dedicated directories for E2E and integration tests.

## Test Structure

```
src/                    # Source code with co-located unit tests
├── core/
│   ├── git/
│   │   ├── branches.ts
│   │   ├── branches.test.ts      # Unit tests for branches
│   │   ├── operations.ts
│   │   ├── operations.test.ts    # Unit tests for operations
│   │   ├── commits.ts
│   │   └── commits.test.ts       # Unit tests for commits
│   └── ui/
│       ├── ansi.ts
│       ├── ansi.test.ts          # Unit tests for ANSI codes
│       ├── search.ts
│       └── search.test.ts        # Unit tests for search
test/
├── e2e/               # End-to-end tests for CLI functionality
└── integration/       # Integration tests with real git repositories
```

## Test Commands

- `npm test` - **Run all tests directly from TypeScript** (no build required)
- `npm run test:unit` - Run only unit tests (co-located with source)
- `npm run test:e2e` - Run only E2E tests (simplified CLI testing)
- `npm run test:integration` - Run only integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Legacy test commands (for backwards compatibility)
- `npm run test:legacy` - Run the old custom test runner
- `npm run test:legacy:e2e` - Run legacy E2E tests
- `npm run test:legacy:ci` - Run legacy CI tests

## Key Improvements

### **Bun runs TypeScript directly**
- No build step required for tests
- Faster test execution
- Real-time TypeScript testing

### **Optimized Configuration**
- `bunfig.toml` excludes `dist` folder from test discovery
- `tsconfig.json` excludes test files from compilation
- No duplicate test execution from dist folder

### **Simplified Test Implementation**
- E2E tests use `bun run src/index.ts` directly
- Integration tests create real git repositories for testing
- Performance-focused with reasonable timeouts

## Test Categories

### Unit Tests (co-located with source files)
- Test individual functions and modules in isolation
- Fast execution with mocked dependencies
- Focus on business logic and edge cases
- Located next to their source files for easy maintenance

### E2E Tests (`test/e2e/`)
- Test the complete CLI application
- Real subprocess execution
- Verify command-line interface behavior

### Integration Tests (`test/integration/`)
- Test interaction with real git repositories
- File system operations
- Cross-module functionality

## Writing Tests

### Unit Tests
```typescript
import { describe, it, expect, spyOn } from 'bun:test';

describe('MyModule', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### E2E Tests
```typescript
import { describe, it, expect } from 'bun:test';

describe('CLI Commands', () => {
  it('should show help', async () => {
    const result = await runCLICommand(['--help']);
    expect(result.exitCode).toBe(0);
  });
});
```

## Test Configuration

Tests are configured in `bunfig.toml`:
- Default timeout: 10 seconds
- Reporter: text format
- Coverage available with `--coverage` flag

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies in unit tests
3. **Assertions**: Use descriptive test names and clear assertions
4. **Cleanup**: Clean up any created files/directories in tests
5. **Performance**: Keep unit tests fast (<100ms), E2E tests reasonable (<5s)

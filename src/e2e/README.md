# E2E Testing for git-cli-utils

This directory contains comprehensive end-to-end tests for the git-cli-utils CLI tool.

## Test Architecture

### Core Components

- **`cli-tester.ts`** - Core testing utility that spawns CLI processes and validates outputs
- **`test-runner.ts`** - Basic CLI functionality tests (help, version, commands)
- **`git-integration-tests.ts`** - Tests that verify git integration works correctly
- **`performance-tests.ts`** - Performance benchmarks for CLI startup and response times
- **`e2e-test-suite.ts`** - Main test runner that orchestrates all test suites

### Test Coverage

#### Basic CLI Tests ✅
- Help command functionality
- Version command functionality  
- Invalid command handling
- Command availability (search-branches, search-commits, list-aliases)

#### Git Integration Tests ✅
- Branch fetching and display
- Commit history access
- Git alias creation and management
- Real git repository interaction

#### Performance Tests ✅
- Command startup time (< 3 seconds)
- Help/version response time (< 1 second)
- Large repository handling
- Memory and CPU efficiency

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Build and run tests manually
npm run build
node ./dist/e2e/e2e-test-suite.js
```

## Test Results

Expected success rate: **100%** (16/16 tests pass)

### Recent Fixes ✅

All tests now pass successfully! Fixed issues with interactive terminal components:
- ✅ `search-branches` interactive mode now works in test environment  
- ✅ `search-commits` interactive mode now works in test environment

The CLI automatically detects non-interactive environments and provides appropriate fallback behavior for testing.

## Test Structure

```
src/e2e/
├── cli-tester.ts           # Core testing utilities
├── test-runner.ts          # Basic CLI tests
├── git-integration-tests.ts # Git functionality tests
├── performance-tests.ts     # Performance benchmarks
├── e2e-test-suite.ts       # Main test orchestrator
└── README.md              # This documentation
```

## Adding New Tests

### Basic CLI Test
```typescript
// In test-runner.ts
results.push(await this.tester.runCommand('new-command', [], ['expected output']));
```

### Git Integration Test
```typescript
// In git-integration-tests.ts
async testNewGitFeature(): Promise<TestResult> {
  // Test git functionality
  return { passed: true, message: 'Test passed', duration: 0 };
}
```

### Performance Test
```typescript
// In performance-tests.ts
async testNewPerformance(): Promise<TestResult> {
  const start = Date.now();
  // Perform operation
  const duration = Date.now() - start;
  return { 
    passed: duration < threshold,
    message: `Operation took ${duration}ms`,
    duration 
  };
}
```

## Test Output Format

Tests provide detailed feedback:
- ✅ Passed tests with success message
- ❌ Failed tests with error details
- 📊 Summary with pass/fail counts and success rate
- ⚡ Performance metrics for timed operations

## Dependencies

The testing system uses only Node.js built-in modules:
- `child_process` for spawning CLI processes
- `util.promisify` for async/await patterns
- `Buffer` for handling process output

No external testing frameworks required - everything is self-contained.
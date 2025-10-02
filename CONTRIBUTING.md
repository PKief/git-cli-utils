# Contributing to Git CLI Utils

Thank you for your interest in contributing to Git CLI Utils! This document provides guidelines and setup instructions for development.

## Development Setup

**Prerequisites:**
- [Bun.js](https://bun.sh) (required runtime and package manager)
- Git repository for testing

**Get started:**
```bash
# Clone and setup
git clone https://github.com/PKief/git-cli-utils.git
cd git-cli-utils
bun install

# Run tests
bun test              # All tests
bun test src/         # Unit tests only
bun test test/e2e/    # E2E tests only

# Code quality
bun run lint          # Check linting
bun run format        # Format code
```

## Testing Your Changes

**Option 1: Build and test locally**
```bash
bun run build
bun start         # Run the CLI locally
# or test specific commands
bun start -- branches    # Test branches command
bun start -- commits     # Test commits command
bun start -- authors        # Test authors command
```

**Option 2: Link for global testing**
```bash
# Link your development version globally
bun link
# or
npm link

# Test as if installed globally
git-utils branches
git-utils init
```

**Option 3: Direct TypeScript execution**
```bash
# Run directly without building (development mode)
bun run src/index.ts branches
bun run src/index.ts commits
```

## Writing Tests

- **Unit tests**: Co-located with source files (e.g., `executor.test.ts`)
- **E2E tests**: In `test/e2e/` directory
- **Test framework**: Bun's built-in test runner
- **Coverage**: Run `bun test --coverage`

**Test example:**
```typescript
import { describe, expect, it } from 'bun:test';

describe('MyFeature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write tests** for new functionality
4. **Ensure** all tests pass (`bun test`)
5. **Follow** code style (`bun run lint`)
6. **Commit** with clear messages
7. **Submit** a pull request

## Project Structure

```
src/
├── cli/           # CLI commands and UI components
├── core/          # Core Git operations and utilities
├── modules/       # Reusable modules
└── index.ts       # Main entry point
test/
├── e2e/           # End-to-end tests
└── README.md      # Testing documentation
```

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/PKief/git-cli-utils/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PKief/git-cli-utils/discussions)

## License

By contributing to Git CLI Utils, you agree that your contributions will be licensed under the MIT License.

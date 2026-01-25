# Testing

## Running Tests

```bash
bun test              # All tests
bun test:unit         # Unit tests (src/)
bun test:e2e          # E2E tests (test/e2e/)
bun test --watch      # Watch mode
bun test --coverage   # Coverage report
```

## Test File Location

- **Unit tests**: `*.test.ts` next to source file
- **E2E tests**: `test/e2e/*.test.ts`

## Unit Test Pattern

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test';

const mockExecuteCommand = mock();
mock.module('./executor.js', () => ({
  gitExecutor: { executeCommand: mockExecuteCommand },
}));

describe('Feature', () => {
  beforeEach(() => {
    mockExecuteCommand.mockClear();
  });

  it('should do something', async () => {
    mockExecuteCommand.mockResolvedValue({ stdout: 'output', stderr: '' });

    const result = await myFunction();

    expect(result).toEqual(expected);
    expect(mockExecuteCommand).toHaveBeenCalledWith('git command');
  });
});
```

## E2E Test Pattern

E2E tests use a sandbox utility for isolation:

```typescript
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('mycommand', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should do something', async () => {
    sandbox = createTestSandbox({ branches: ['feature-1'], commitCount: 3 });

    const result = await sandbox.runCLI(['mycommand']);
    expect(result.exitCode).toBe(0);
  });
});
```

## E2E Test Organization

| File | Commands | Tests |
|------|----------|-------|
| `cli.test.ts` | Basic CLI | --version, --help, invalid command |
| `branches.test.ts` | branches | List branches, current branch |
| `commits.test.ts` | commits | List commits, show messages |
| `tags.test.ts` | tags | No tags, list tags, annotated tags |
| `stashes.test.ts` | stashes, save | List stashes, clean directory |
| `remotes.test.ts` | remotes | No remotes, list remotes |
| `config.test.ts` | config | Show config, subcommand help |
| `worktrees.test.ts` | worktrees | Create, list, remove worktrees |

## Principles

1. **One file per command** - Keep tests organized
2. **3-5 tests per command** - Core functionality, not every detail
3. **Test different states** - Empty repo, with data, edge cases
4. **Use sandbox for isolation** - Each test creates its own sandbox
5. **No duplicates** - If tested in one file, don't repeat in another

## Adding Tests for a New Command

Create `test/e2e/<command>.test.ts` with 3-5 tests covering core functionality.

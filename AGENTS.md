# AGENTS.md - AI Agent Guide for git-cli-utils

## Project Overview

**git-cli-utils** is an interactive CLI toolset for Git with fuzzy search and smart highlighting. It provides user-friendly commands for branch management, commit exploration, stash handling, author analytics, worktree management, and git aliases.

- **Author**: Philipp Kief
- **License**: MIT
- **Repository**: https://github.com/PKief/git-cli-utils

### Target Users
Developers who want a more interactive, visual way to work with Git repositories from the command line.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Bun** | Runtime, test runner, package manager |
| **TypeScript** | Primary language (strict mode) |
| **Commander** | CLI argument parsing |
| **@clack/prompts** | Interactive prompts (confirm, text input) |
| **clipboardy** | Cross-platform clipboard support |
| **Biome** | Linting and formatting |
| **Sheriff** | Architecture boundary verification |
| **Husky** | Git hooks |

---

## Architecture

### Module Structure

```
src/
├── index.ts              # Entry point - command registration
├── core/                 # Business logic (no CLI dependencies)
│   ├── config.ts         # User configuration (~/.git-cli-utils/config.json)
│   └── git/              # Git operations
│       ├── executor.ts   # Singleton GitExecutor (command execution)
│       ├── operations.ts # Common operations (checkout, clipboard)
│       ├── branches.ts   # Branch queries
│       ├── commits.ts    # Commit queries
│       ├── stashes.ts    # Stash queries
│       ├── tags.ts       # Tag queries
│       ├── remotes.ts    # Remote queries
│       ├── worktrees.ts  # Worktree management
│       ├── aliases.ts    # Git alias management
│       └── authors.ts    # Author analytics
└── cli/                  # CLI layer (UI and commands)
    ├── commands/         # One folder per command
    │   ├── branches/
    │   ├── commits/
    │   ├── stashes/
    │   ├── tags/
    │   ├── remotes/
    │   ├── worktrees/
    │   ├── list-aliases/
    │   ├── top-authors/
    │   ├── save/
    │   ├── sync/
    │   ├── init/
    │   └── config/
    ├── ui/               # UI components
    │   ├── interactive-list.ts  # Main fuzzy search list
    │   ├── search-scoring.ts    # Search ranking algorithm
    │   ├── ansi.ts              # Color/styling utilities
    │   └── command-selector.ts  # Top-level command picker
    └── utils/            # CLI utilities
        ├── terminal.ts           # stdout/stderr helpers
        ├── prompts.ts            # @clack/prompts wrappers
        ├── action-helpers.ts     # Action result types
        ├── command-registration.ts # Command builder pattern
        ├── editor.ts             # External editor support
        └── pager.ts              # Paged output
```

### Sheriff Architecture Rules

The project uses Sheriff for architecture verification. Rules are defined in `sheriff.config.ts`:

```typescript
depRules: {
  core: ['core'],           // core can ONLY import from core
  cli: ['core', 'cli'],     // CLI can import from core and cli
  root: ['core', 'cli'],    // Entry point can import anything
}
```

**Critical**: `core/` modules must NEVER import from `cli/`. This ensures business logic is decoupled from presentation.

---

## Key Patterns

### 1. Command Registration Pattern

Every command follows this pattern in `src/cli/commands/<name>/index.ts`:

```typescript
import { Command } from 'commander';
import { createCommand, type CommandModule } from '../../utils/command-registration.js';

export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'command-name',
    description: 'What it does',
    action: async () => { /* implementation */ },
    // Optional: argument: { name: '[arg]', description: '...' }
  });
}
```

### 2. Action Pattern

Commands with interactive lists use actions. Actions are defined in `actions/index.ts`:

```typescript
import { createActions } from '../../../utils/action-helpers.js';

function createMyActions() {
  return createActions([
    {
      key: 'action-key',
      label: 'Display Label',
      description: 'Tooltip text',
      handler: async (item) => { /* returns ActionResult or boolean */ },
    },
  ]);
}
```

Action handlers must return:
- `actionSuccess(message)` - Action completed successfully
- `actionFailure(message)` - Action failed
- `boolean` - Simple success/failure

### 3. GitExecutor Singleton

All git commands go through the singleton `GitExecutor`:

```typescript
import { gitExecutor } from './executor.js';

// Simple command
const result = await gitExecutor.executeCommand('git status');

// Streaming (for large outputs like log)
const result = await gitExecutor.executeStreamingCommand(['log', '--oneline']);

// With custom parser
const data = await gitExecutor.executeFormattedCommand(
  'git branch --list',
  (output) => parseOutput(output)
);
```

### 4. Interactive List

The `interactiveList` function is the core UI component:

```typescript
const selected = await interactiveList<ItemType>(
  items,                          // Array of items
  (item) => renderString(item),   // Display renderer
  (item) => searchableText(item), // Optional: text to search
  'Header text',                  // Optional: header
  actions                         // Optional: Action[]
);
```

### 5. Terminal Output

Never use `console.log` directly. Use terminal utilities:

```typescript
import { writeLine, writeErrorLine, write, clearScreen } from '../utils/terminal.js';

writeLine('Normal output');
writeErrorLine('Error output to stderr');
write('Without newline');
```

### 6. ANSI Colors

Use the provided color helpers:

```typescript
import { green, red, yellow, blue, gray, bold } from '../ui/ansi.js';

writeLine(green('Success message'));
writeLine(red('Error message'));
writeLine(yellow('Warning'));
```

---

## Code Style

### Biome Configuration (biome.jsonc)

- **Indentation**: 2 spaces
- **Line width**: 80 characters
- **Quotes**: Single quotes for strings
- **Semicolons**: Always
- **Trailing commas**: ES5 style
- **Arrow functions**: Always use parentheses

### TypeScript Rules

- Strict mode enabled
- No `any` type (use `unknown` and narrow)
- No unused variables/imports
- Use `const` over `let`
- Arrow functions preferred over function expressions

### Naming Conventions

- **Files**: kebab-case (`interactive-list.ts`)
- **Functions**: camelCase (`getGitBranches`)
- **Classes**: PascalCase (`GitExecutor`)
- **Interfaces**: PascalCase with `Git` prefix for git types (`GitBranch`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE for true constants

### Import Order

Biome auto-organizes imports. Generally:
1. Node built-ins (`node:fs`, `node:path`)
2. External packages (`commander`, `@clack/prompts`)
3. Internal absolute imports
4. Relative imports

---

## Testing

### Running Tests

```bash
bun test              # All tests
bun test src          # Unit tests only
bun test test/e2e/    # E2E tests only
bun test --watch      # Watch mode
bun test --coverage   # Coverage report
```

### Test File Naming

- Unit tests: `*.test.ts` next to source file
- E2E tests: `test/e2e/*.test.ts`

### Testing Patterns

Tests use Bun's built-in test runner:

```typescript
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';

// Mock the GitExecutor
const mockExecuteCommand = mock();
mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
  },
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

### E2E Testing

E2E tests spawn the actual CLI process:

```typescript
async function runCLICommand(args: string[]): Promise<{ exitCode, stdout, stderr }> {
  // Spawns: bun run src/index.ts ...args
}
```

### Integration Test Guidelines

Follow the **test pyramid principle**: keep integration tests focused on core functionality, test details in unit tests.

**Test Files (one per command/feature):**
| File | Commands | Tests |
|------|----------|-------|
| `cli.test.ts` | Basic CLI | --version, --help, invalid command |
| `branches.test.ts` | branches | List branches, current branch |
| `commits.test.ts` | commits | List commits, show messages |
| `tags.test.ts` | tags | No tags, list tags, annotated tags |
| `stashes.test.ts` | stashes, save | List stashes, clean directory |
| `remotes.test.ts` | remotes | No remotes, list remotes |
| `config.test.ts` | config | Show config, subcommand help |
| `worktree-symlinks.test.ts` | worktrees | Create, list, remove worktrees |

**Sandbox Utility (`test/utils/sandbox.ts`):**
```typescript
import { createTestSandbox, createWorktreeSandbox, GitSandbox } from '../utils/sandbox.js';

describe('mycommand', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should do something', async () => {
    // Create sandbox with options
    sandbox = createTestSandbox({ branches: ['feature-1'], commitCount: 3 });

    // Or use worktree sandbox (includes .gitignore, node_modules, .env)
    sandbox = createWorktreeSandbox();

    // Run CLI and assert
    const result = await sandbox.runCLI(['mycommand']);
    expect(result.exitCode).toBe(0);
  });
});
```

**Key Principles:**
1. **One file per command** - Keep tests organized and easy to find
2. **3-5 tests per command** - Test core functionality, not every detail
3. **Test different states** - Empty repo, with data, edge cases
4. **Use sandbox for isolation** - Each test creates its own sandbox via `afterEach`
5. **No duplicates** - If tested in one file, don't repeat in another

**When adding a new command:** Create `test/e2e/<command>.test.ts` with 3-5 tests covering core functionality

---

## Common Tasks

### Adding a New Command

1. Create folder: `src/cli/commands/<name>/`
2. Create `index.ts` with `registerCommand` export
3. Register in `src/index.ts`:
   ```typescript
   import { registerCommand as registerNewCmd } from './cli/commands/<name>/index.js';
   // Add to commands array
   ```

### Adding an Action to a Command

1. Create `src/cli/commands/<name>/actions/<action>.ts`
2. Export from `src/cli/commands/<name>/actions/index.ts`
3. Add to the command's `createActions` array

### Adding a New Git Query

1. Create function in appropriate `src/core/git/*.ts` file
2. Use `gitExecutor.executeCommand()` or `executeStreamingCommand()`
3. Parse output and return typed interface
4. Add corresponding test file

### Modifying Search Behavior

Search scoring is in `src/cli/ui/search-scoring.ts`. The algorithm:
1. Exact substring match (best)
2. Contiguous fuzzy match (after removing separators)
3. Character-by-character fuzzy match (scattered)

---

## Gotchas and Pitfalls

### 1. Import Extensions Required
Always use `.js` extension in imports (TypeScript compiles to JS):
```typescript
// Correct
import { foo } from './bar.js';

// Wrong - will fail at runtime
import { foo } from './bar';
```

### 2. Core Cannot Import CLI
Sheriff will fail the build if `core/` imports from `cli/`. Run `bun run verify` to check.

### 3. process.exit() Usage
Commands call `process.exit()` directly. This is intentional for CLI behavior but makes unit testing harder. Mock process.exit or test at E2E level.

### 4. Non-Interactive Mode
The `interactiveList` detects non-TTY environments (CI, tests) and returns the first item automatically. Check for:
- `process.stdin.isTTY`
- `process.env.CI`
- `process.env.GITHUB_ACTIONS`

### 5. Git Command Escaping
When building git commands with user input, escape quotes:
```typescript
const escaped = userInput.replace(/"/g, '\\"');
await executor.executeCommand(`git stash push -m "${escaped}"`);
```

### 6. Clipboard May Fail
`clipboardy` can fail in headless environments. Always handle errors gracefully.

### 7. Streaming vs Regular Commands
Use streaming for potentially large outputs (commit log, branch list). Regular `executeCommand` has a 10MB buffer limit.

---

## Build & Run

### Development

```bash
bun install           # Install dependencies
bun run start         # Run from dist (requires build)
bun run src/index.ts  # Run directly from source

# Run specific command
bun run src/index.ts branches
bun run src/index.ts commits
```

### Build & Verify

```bash
bun run build         # TypeScript compilation
bun run verify        # Sheriff architecture check (runs automatically post-build)
bun run lint          # Biome lint check
bun run format        # Biome auto-format
```

### Testing

```bash
bun test              # Run all tests
bun test:unit         # Unit tests only
bun test:e2e          # E2E tests only
```

### Pre-commit

Husky runs lint-staged on commit. Ensure code passes `bun run lint` before committing.

---

## Configuration

User configuration stored at `~/.git-cli-utils/config.json`:

```json
{
  "editor": {
    "path": "/path/to/editor",
    "args": ["--new-window"]
  }
}
```

Access via:
```typescript
import { loadConfig, getEditorConfig, setEditorConfig } from '../core/config.js';
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, command registration |
| `src/core/git/executor.ts` | Singleton git command executor |
| `src/cli/ui/interactive-list.ts` | Main fuzzy search UI component |
| `src/cli/utils/command-registration.ts` | Command builder helpers |
| `src/cli/utils/action-helpers.ts` | Action result types |
| `sheriff.config.ts` | Architecture boundary rules |
| `biome.jsonc` | Linting and formatting rules |
| `tsconfig.json` | TypeScript configuration |

# AGENTS.md

Interactive CLI toolset for Git with fuzzy search and smart highlighting.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run build` | Build (auto-runs `verify`) |
| `bun test` | Run all tests |
| `bun run lint` | Check linting |

## Critical Rules

1. **Bun, not npm** - This project uses Bun as runtime, test runner, and package manager
2. **Architecture boundary** - `core/` must never import from `cli/`. Run `bun run verify` to check
3. **Import extensions** - Always use `.js` in imports (TypeScript compiles to JS):
   ```typescript
   import { foo } from './bar.js';  // Correct
   import { foo } from './bar';     // Wrong - fails at runtime
   ```

## Documentation

- [Architecture](docs/architecture.md) - Module structure, Sheriff rules, core/cli separation
- [Patterns](docs/patterns.md) - Command registration, actions, GitExecutor, interactive list
- [Testing](docs/testing.md) - Test commands, patterns, sandbox utility, E2E guidelines
- [Common Tasks](docs/common-tasks.md) - Adding commands, actions, git queries

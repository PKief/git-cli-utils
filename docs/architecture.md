# Architecture

## Module Structure

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

## Sheriff Architecture Rules

Rules defined in `sheriff.config.ts`:

```typescript
depRules: {
  core: ['core'],           // core can ONLY import from core
  cli: ['core', 'cli'],     // CLI can import from core and cli
  root: ['core', 'cli'],    // Entry point can import anything
}
```

**Critical**: `core/` modules must NEVER import from `cli/`. Run `bun run verify` to check.

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `interactive-list.ts` |
| Functions | camelCase | `getGitBranches` |
| Classes | PascalCase | `GitExecutor` |
| Git interfaces | PascalCase with `Git` prefix | `GitBranch` |

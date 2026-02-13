# Unified Actions Architecture

## Goal

Create a **single registration** system where global actions are defined once with all metadata, and CLI options are **automatically generated** from that definition. This ensures alignment between CLI and interactive UI without manual duplication.

## Problem Statement

Currently, CLI options and interactive global actions are disconnected:

| CLI (Commander.js) | Interactive UI (Global Actions) |
|---|---|
| `branches --help` shows no `new` option | "New branch" action available in UI |
| `commits --all` and `commits [file]` only on CLI | Not exposed in interactive UI |

When adding functionality in one place, it's easy to forget the other.

## Solution: Unified Action Definition

Define actions **once** with metadata that enables both CLI and interactive use:

```typescript
// branches/global-actions/index.ts
export function getBranchGlobalActions() {
  return createUnifiedActions([
    {
      key: 'new',
      label: 'New branch',
      description: 'Create a new branch from HEAD',
      cli: {
        option: '--new [name]',  // Auto-generates CLI option
      },
      handler: createBranch,
      promptForArgs: promptForBranchName,
    },
  ]);
}

// branches/index.ts - Single registration handles both CLI and interactive
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'branches',
    description: 'Interactive branch selection',
    action: searchBranches,
    globalActions: getBranchGlobalActions(),
  });
}
```

## Expected Results

```
$ git-utils branches --help
Usage: git-utils branches [options]

Interactive branch selection with fuzzy search

Options:
  --new [name]  Create a new branch from HEAD
  -h, --help    display help for command

$ git-utils commits --help  
Usage: git-utils commits [options]

Interactive commit selection with fuzzy search

Options:
  -a, --all       Search commits across all branches
  --file <path>   Show commits for a specific file
  -h, --help      display help for command
```

Both CLI options and interactive actions come from the same definition.

## Architecture

### Type Definition

```typescript
// src/cli/utils/unified-action.ts

/**
 * Configuration for a unified action that works both as CLI option and interactive action.
 * Single source of truth - define once, use everywhere.
 */
export interface UnifiedActionConfig<TArgs extends Record<string, unknown> = Record<string, never>> {
  /** Unique identifier for the action (used as hotkey in interactive mode) */
  key: string;
  
  /** Display name for the action */
  label: string;
  
  /** Description (used in both interactive UI and CLI --help) */
  description?: string;
  
  /** CLI option binding - if omitted, action is interactive-only */
  cli?: {
    /** 
     * Option format using Commander.js syntax:
     * - '--new'        → Boolean flag
     * - '--new [name]' → Optional argument
     * - '--new <name>' → Required argument  
     * - '-a, --all'    → Short + long alias
     */
    option: string;
    
    /** Override description for --help (defaults to action.description) */
    optionDescription?: string;
  };
  
  /** 
   * The action handler
   * - For actions without args: () => Promise<boolean>
   * - For actions with args: (args: TArgs) => Promise<boolean>
   */
  handler: keyof TArgs extends never
    ? () => Promise<boolean>
    : (args: TArgs) => Promise<boolean>;
  
  /** 
   * Prompts user for args when invoked interactively.
   * Required if handler takes args. Returns null if user cancels.
   */
  promptForArgs?: () => Promise<TArgs | null>;
}
```

### Flow Diagram

```
UnifiedActionConfig (single definition)
       │
       ├──► createCommand() ──► Auto-registers CLI options (Commander.js)
       │                              │
       │                              ▼
       │                     User runs: git-utils branches --new feat/test
       │                              │
       │                              ▼
       │                     Handler called with: { name: 'feat/test' }
       │
       └──► Converts to GlobalAction[] ──► Interactive UI (selection list)
                                                  │
                                                  ▼
                                          User selects "New branch"
                                                  │
                                                  ▼
                                          promptForArgs() → handler()
```

### CLI Option Handling Logic

In `createCommand`, when processing `globalActions`:

```typescript
// For each action with cli defined:
config.globalActions?.forEach((action) => {
  if (action.cli) {
    cmd.option(
      action.cli.option,
      action.cli.optionDescription ?? action.description
    );
  }
});

// In the action handler:
cmd.action(async (options: Record<string, unknown>) => {
  // Find if any global action's CLI option was triggered
  const triggeredAction = findTriggeredAction(config.globalActions, options);
  
  if (triggeredAction) {
    const args = extractArgsFromOptions(triggeredAction, options);
    
    if (needsArgs(triggeredAction) && !hasArgs(args)) {
      // CLI option provided without value, prompt for args
      const promptedArgs = await triggeredAction.promptForArgs?.();
      if (promptedArgs === null) return; // User cancelled
      await triggeredAction.handler(promptedArgs);
    } else {
      // Args provided via CLI or no args needed
      await triggeredAction.handler(args);
    }
  } else {
    // No global action triggered - run default interactive action
    await config.action();
  }
});
```

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Create UnifiedActionConfig type
**File:** `src/cli/utils/unified-action.ts` (NEW)

- Define `UnifiedActionConfig<TArgs>` interface
- Create `createUnifiedActions()` helper function
- Add utility functions:
  - `extractOptionKey(option: string)` - parses `'--new [name]'` → `'new'`
  - `parseOptionFormat(option: string)` - determines if arg is required/optional/none
  - `unifiedToGlobalAction(config)` - converts to `GlobalAction` for interactive UI

#### Task 1.2: Update command-registration.ts
**File:** `src/cli/utils/command-registration.ts` (MODIFY)

- Add `globalActions?: UnifiedActionConfig[]` to `CommandConfig`
- Update `createCommand()` to:
  1. Register CLI options from `globalActions[].cli`
  2. Detect when CLI options are provided and route to action handler
  3. Handle combined options (multiple can be active)
  4. Convert to `GlobalAction[]` for `CommandModule.commandActions`

#### Task 1.3: Update action-helpers.ts
**File:** `src/cli/utils/action-helpers.ts` (MODIFY)

- Add `unifiedToGlobalAction()` converter
- Keep `ItemActionConfig` unchanged (item actions don't have CLI equivalents)
- Mark `GlobalActionConfig` and `createGlobalActions` as deprecated (will remove after migration)

### Phase 2: Migrate Existing Global Actions

#### Task 2.1: Update branches global action
**Files:**
- `src/cli/commands/branches/global-actions/create-branch.ts`
- `src/cli/commands/branches/global-actions/index.ts`
- `src/cli/commands/branches/index.ts`

**Changes:**
- Split `createBranch()` into handler + `promptForBranchName()`
- Update to `UnifiedActionConfig<{ name: string }>`
- Add `cli: { option: '--new [name]' }`

**Result:** `git-utils branches --new feat/test` or `git-utils branches --new` (prompts)

#### Task 2.2: Update stashes global action
**Files:**
- `src/cli/commands/stashes/global-actions/create-stash.ts`
- `src/cli/commands/stashes/global-actions/index.ts`
- `src/cli/commands/stashes/index.ts`

**Changes:**
- Split `createStash()` into handler + `promptForStashOptions()`
- Update to `UnifiedActionConfig<{ message?: string }>`
- Add `cli: { option: '--new [message]' }`

**Result:** `git-utils stashes --new "WIP"` or `git-utils stashes --new` (prompts)

#### Task 2.3: Update tags global action
**Files:**
- `src/cli/commands/tags/global-actions/create-tag.ts`
- `src/cli/commands/tags/global-actions/index.ts`
- `src/cli/commands/tags/index.ts`

**Changes:**
- Split `createTag()` into handler + `promptForTagOptions()`
- Update to `UnifiedActionConfig<{ name: string }>`
- Add `cli: { option: '--new [name]' }`

**Result:** `git-utils tags --new v1.0.0` or `git-utils tags --new` (prompts)

#### Task 2.4: Update remotes global action
**Files:**
- `src/cli/commands/remotes/global-actions/add-remote.ts`
- `src/cli/commands/remotes/global-actions/index.ts`
- `src/cli/commands/remotes/index.ts`

**Changes:**
- Split `addRemote()` into handler + `promptForRemoteDetails()`
- Update to `UnifiedActionConfig<{ name: string; url: string }>`
- Add `cli: { option: '--add [name]' }` (URL prompted if not enough args)

**Result:** `git-utils remotes --add origin https://...` or `git-utils remotes --add` (prompts)

### Phase 3: Add Missing Commits Global Actions

#### Task 3.1: Create commits global-actions directory
**Files:**
- `src/cli/commands/commits/global-actions/index.ts` (NEW)
- `src/cli/commands/commits/global-actions/cross-branch-search.ts` (NEW)
- `src/cli/commands/commits/global-actions/file-history.ts` (NEW)

**Actions to add:**

1. **Cross-branch search**
   ```typescript
   {
     key: 'all',
     label: 'Cross-branch search',
     description: 'Search commits across all branches',
     cli: { option: '-a, --all' },
     handler: async () => {
       await searchCommits({ showAll: true });
       return true;
     },
   }
   ```

2. **File history**
   ```typescript
   {
     key: 'file',
     label: 'File history', 
     description: 'Show commits for a specific file',
     cli: { option: '--file <path>' },
     handler: async (args) => {
       await searchCommits({ filePath: args.file });
       return true;
     },
     promptForArgs: promptForFilePath,
   }
   ```

#### Task 3.2: Update commits/index.ts
**File:** `src/cli/commands/commits/index.ts`

**Changes:**
- Refactor to use `createCommand()` pattern
- Remove manual Commander.js option registration
- Export `searchCommits` with options parameter for reuse by global actions
- Register `globalActions: getCommitGlobalActions()`

### Phase 4: Cleanup

#### Task 4.1: Remove deprecated code
**File:** `src/cli/utils/action-helpers.ts`

- Remove `GlobalActionConfig` interface
- Remove `createGlobalAction()` function
- Remove `createGlobalActions()` function
- Remove legacy aliases (`ActionConfig`, `createAction`, `createActions`)

#### Task 4.2: Update tests
**Files:** `test/e2e/*.test.ts`

- Add tests for new CLI options:
  - `branches --new <name>`
  - `stashes --new [message]`
  - `tags --new <name>`
  - `remotes --add`
  - `commits --all`
  - `commits --file <path>`
- Test combined options where applicable

### Phase 5: Verification

#### Task 5.1: Run full test suite
```bash
bun test
```

#### Task 5.2: Run build and verify
```bash
bun run build  # Includes verify step
```

#### Task 5.3: Manual testing
- Test each command's `--help` output
- Test CLI invocation with and without args
- Test interactive mode still works

## Files Changed Summary

### New Files
- `src/cli/utils/unified-action.ts`
- `src/cli/commands/commits/global-actions/index.ts`
- `src/cli/commands/commits/global-actions/cross-branch-search.ts`
- `src/cli/commands/commits/global-actions/file-history.ts`

### Modified Files
- `src/cli/utils/command-registration.ts`
- `src/cli/utils/action-helpers.ts`
- `src/cli/commands/branches/global-actions/create-branch.ts`
- `src/cli/commands/branches/global-actions/index.ts`
- `src/cli/commands/branches/index.ts`
- `src/cli/commands/stashes/global-actions/create-stash.ts`
- `src/cli/commands/stashes/global-actions/index.ts`
- `src/cli/commands/stashes/index.ts`
- `src/cli/commands/tags/global-actions/create-tag.ts`
- `src/cli/commands/tags/global-actions/index.ts`
- `src/cli/commands/tags/index.ts`
- `src/cli/commands/remotes/global-actions/add-remote.ts`
- `src/cli/commands/remotes/global-actions/index.ts`
- `src/cli/commands/remotes/index.ts`
- `src/cli/commands/commits/index.ts`
- `test/e2e/branches.test.ts`
- `test/e2e/stashes.test.ts`
- `test/e2e/tags.test.ts`
- `test/e2e/remotes.test.ts`
- `test/e2e/commits.test.ts`

## Global Actions Inventory

| Command | Action | CLI Option | Args | Status |
|---------|--------|------------|------|--------|
| `branches` | New branch | `--new [name]` | `{ name: string }` | Migrate |
| `stashes` | New stash | `--new [message]` | `{ message?: string }` | Migrate |
| `tags` | New tag | `--new [name]` | `{ name: string }` | Migrate |
| `remotes` | Add remote | `--add [name]` | `{ name: string, url: string }` | Migrate |
| `commits` | Cross-branch search | `-a, --all` | (none) | **New** |
| `commits` | File history | `--file <path>` | `{ file: string }` | **New** |

## Open Questions

1. **Combined options behavior:** When user runs `commits --all --file src/foo.ts`, should we:
   - Search all branches for commits affecting that file (combine filters)
   - Error with "cannot combine these options"
   
   **Decision:** Allow combinations - they act as filters on the same search.

2. **Remotes --add syntax:** Should it be:
   - `--add [name]` and prompt for URL separately
   - `--add <name> <url>` requiring both
   
   **Recommendation:** `--add [name]` with URL prompted if not provided, since URLs are long and error-prone on CLI.

3. **Stash message prompt behavior:** Currently `createStash()` also asks about including untracked files. Should CLI support this?
   - `--new [message]` - just message, prompt for untracked
   - `--new [message] --include-untracked` - add separate flag
   
   **Recommendation:** Add `--include-untracked` as separate boolean flag for full CLI control.

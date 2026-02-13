# Commands Architecture

This document describes the structure for git-cli-utils commands.

## Folder Structure

```
src/cli/
├── utils/
│   ├── action-helpers.ts      # Type-safe action creation helpers
│   ├── global-action.ts       # Global actions (CLI + interactive UI)
│   └── command-registration.ts # Command registration helpers
└── commands/
├── branches/
│   ├── index.ts              # Main branches command
│   ├── global-actions/       # Actions that don't require selecting an item
│   │   ├── index.ts
│   │   └── create-branch.ts
│   └── item-actions/         # Actions that operate on selected items
│       ├── index.ts
│       ├── checkout.ts
│       ├── copy.ts
│       └── delete.ts
├── commits/
│   ├── index.ts              # Main commits command
│   ├── global-actions/       # Cross-branch search, file history
│   │   ├── index.ts
│   │   └── file-history.ts
│   └── actions/              # Item actions
│       ├── index.ts
│       ├── checkout.ts
│       ├── copy.ts
│       └── show.ts
├── stashes/
│   ├── index.ts              # Main stashes command
│   ├── global-actions/       # Create new stash
│   │   ├── index.ts
│   │   └── create-stash.ts
│   └── item-actions/
│       ├── index.ts
│       ├── apply.ts
│       ├── copy.ts
│       └── delete.ts
└── ...
```

## Key Concepts

### 1. **Unified Actions Architecture**

Global actions are defined once and automatically generate both CLI options and interactive UI actions:

```typescript
// branches/global-actions/index.ts
import { createGlobalActions } from '../../../utils/action-helpers.js';
import { createBranch, promptForBranchName } from './create-branch.js';

export function getBranchGlobalActions() {
  return createGlobalActions([
    {
      key: 'new',
      label: 'New branch',
      description: 'Create a new branch from HEAD',
      cli: { option: '--new [name]' },  // Auto-generates CLI option
      handler: createBranch,
      promptForArgs: promptForBranchName,
    },
  ]);
}
```

This automatically makes the action available:
- **CLI**: `git-utils branches --new feat/test` or `git-utils branches --new` (prompts)
- **Interactive**: Shows "New branch" in the action bar

### 2. **Item Actions**

Item actions operate on a selected item and use `createItemActions`:

```typescript
// branches/item-actions/index.ts
import { createItemActions } from '../../../utils/action-helpers.js';

export function getBranchItemActions() {
  return createItemActions([
    {
      key: 'checkout',
      label: 'Checkout',
      description: 'Switch to this branch',
      handler: checkoutBranch,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete this branch',
      handler: deleteBranch,
    },
  ]);
}
```

### 3. **Command Registration**

Commands use `createCommand` which auto-registers CLI options from global actions:

```typescript
// branches/index.ts
import { createCommand } from '../../utils/command-registration.js';
import { getBranchGlobalActions } from './global-actions/index.js';

export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'branches',
    description: 'Interactive branch selection with fuzzy search',
    action: searchBranches,
    globalActions: getBranchGlobalActions(),
  });
}
```

Result: `git-utils branches --help` shows:
```
Options:
  --new [name]  Create a new branch from HEAD
  -h, --help    display help for command
```

## Action Types

### Unified Action Config

For global actions that should be available both via CLI and interactive UI:

```typescript
interface GlobalActionConfig<TArgs> {
  key: string;           // Unique identifier
  label: string;         // Display name
  description?: string;  // For help text and tooltips
  cli?: {
    option: string;      // Commander.js option syntax
    optionDescription?: string;
  };
  handler: (args: TArgs) => Promise<boolean>;
  promptForArgs?: () => Promise<TArgs | null>;
}
```

CLI option formats:
- `'--flag'` - Boolean flag
- `'--option [value]'` - Optional argument
- `'--option <value>'` - Required argument
- `'-a, --all'` - Short + long alias

### Item Action Config

For actions on selected items:

```typescript
interface ItemActionConfig<T> {
  key: string;
  label: string;
  description?: string;
  handler: (item: T) => Promise<ActionResult<T> | boolean>;
}
```

### Action Results

Actions can return:
- `true/false` - Simple success/failure
- `ActionResult<T>` - With optional message and follow-up action

```typescript
// For failed actions that offer a follow-up
return actionFailure(
  'Cannot delete - not fully merged',
  createItemAction({
    key: 'force-delete',
    label: 'Force delete',
    handler: forceDeleteBranch,
  })
);
```

## Adding New Commands

### 1. Create the folder structure:
```
src/cli/commands/my-command/
├── index.ts
├── global-actions/
│   ├── index.ts
│   └── my-action.ts
└── item-actions/
    ├── index.ts
    └── my-item-action.ts
```

### 2. Define global actions (if needed):
```typescript
// global-actions/my-action.ts
export interface MyActionArgs {
  name: string;
}

export async function promptForMyArgs(): Promise<MyActionArgs | null> {
  // Interactive prompt
}

export async function myAction(args: MyActionArgs): Promise<boolean> {
  // Implementation
}

// global-actions/index.ts
export function getMyGlobalActions() {
  return createGlobalActions([
    {
      key: 'create',
      label: 'Create',
      description: 'Create something new',
      cli: { option: '--create [name]' },
      handler: myAction,
      promptForArgs: promptForMyArgs,
    },
  ]);
}
```

### 3. Register the command:
```typescript
// index.ts
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'my-command',
    description: 'My command description',
    action: myMainAction,
    globalActions: getMyGlobalActions(),
  });
}
```

### 4. Add to main index:
```typescript
// src/index.ts
import { registerCommand as registerMyCommand } from './cli/commands/my-command/index.js';

registerMyCommand(program);
commands.push(registerMyCommand(program));
```

## Benefits

1. **Single Source of Truth**: Define actions once, use everywhere
2. **CLI Alignment**: CLI options auto-generated from interactive actions
3. **Type Safety**: TypeScript ensures correct configuration
4. **Discoverability**: `--help` shows all available options
5. **Flexibility**: Actions work with or without arguments
6. **User Experience**: Consistent behavior between CLI and interactive modes

# Commands Architecture

This document describes the new, maintainable structure for git-cli-utils commands.

## Folder Structure

```
src/cli/
├── utils/
│   └── action-helpers.ts      # Type-safe action creation helpers
└── commands/
├── branches/
│   ├── index.ts              # Main branches command
│   └── actions/
│       ├── index.ts          # Action exports
│       ├── checkout.ts       # Checkout branch action
│       ├── copy.ts           # Copy branch name action
│       └── delete.ts         # Delete branch action (with force delete follow-up)
├── commits/
│   ├── index.ts              # Main commits command
│   └── actions/
│       ├── index.ts          # Action exports
│       ├── checkout.ts       # Checkout commit action
│       ├── copy.ts           # Copy commit hash action
│       └── show.ts           # Show commit details action
├── stashes/
│   ├── index.ts              # Main stashes command
│   └── actions/
│       ├── index.ts          # Action exports
│       ├── apply.ts          # Apply stash action
│       ├── copy.ts           # Copy stash reference action
│       └── delete.ts         # Delete stash action
├── init/
│   └── index.ts              # Git aliases setup command
├── list-aliases/
│   └── index.ts              # Interactive git aliases explorer
└── top-authors/
    └── index.ts              # Repository contributors analysis
```

## Key Features

### 1. **Maintainable Structure**
- Each command has its own folder
- Actions are split into individual files
- Clear separation of concerns
- Easy to locate and modify specific functionality

### 2. **Type-Safe Action Helpers**
The `cli/utils/action-helpers.ts` provides utilities for creating actions:

```typescript
// Create a single action
const action = createAction({
  key: 'checkout',
  label: 'Checkout branch',
  description: 'Switch to this branch',
  handler: checkoutBranch,
});

// Create multiple actions at once
const actions = createActions([
  { key: 'copy', label: 'Copy name', handler: copyBranchName },
  { key: 'delete', label: 'Delete branch', handler: deleteBranch },
]);
```

### 3. **Follow-Up Actions System**
Actions can now trigger follow-up actions. For example, when a branch deletion fails because it's not fully merged:

```typescript
// In delete.ts
if (errorMessage.includes('not fully merged')) {
  const forceDeleteAction = createAction({
    key: 'force-delete',
    label: 'Force delete branch',
    description: 'Force delete this branch (WARNING: will lose changes)',
    handler: (item: GitBranch) => forceDeleteBranch(item),
  });

  return actionFailure(
    `Cannot delete branch '${branch.name}' - it's not fully merged`,
    forceDeleteAction
  );
}
```

### 4. **Consistent Action Results**
All actions return `ActionResult<T>` which provides:
- `success: boolean` - Whether the action succeeded
- `message?: string` - Optional message to display
- `followUpAction?: Action<T>` - Optional follow-up action

Helper functions make this easy:
- `actionSuccess(message?, followUpAction?)` - For successful actions
- `actionFailure(message?, followUpAction?)` - For failed actions
- `actionCancelled(message?)` - For cancelled actions

## Example Usage

### Branch Delete with Force Delete Follow-up

When you try to delete a branch that's not fully merged:

1. **Initial Action**: Regular delete fails
2. **Follow-up Action**: System automatically offers "Force delete" option
3. **User Choice**: User can choose to force delete or cancel

```
[x] Delete branch
Delete this branch (local only)

✗ Error deleting branch: the branch 'feat/top-authors' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D feat/top-authors'

[x] Force delete branch
Force delete this branch (WARNING: will lose changes)

◆ Are you sure you want to delete branch "feat/top-authors" with FORCE (this will permanently lose any unmerged changes)?
│ ● Yes / ○ No
```

## Benefits

1. **Scalability**: Easy to add new commands and actions
2. **Maintainability**: Clear separation makes code easy to understand and modify
3. **Type Safety**: TypeScript ensures correct action configuration
4. **Reusability**: Shared helpers reduce code duplication
5. **User Experience**: Follow-up actions provide intelligent workflows
6. **Testing**: Individual action files are easier to test

## Command Types

### Interactive Commands (with actions)
- **branches/**, **commits/**, **stashes/**: Use the action system with individual action files
- Support follow-up actions and sophisticated user workflows
- Each action is in its own file for better maintainability

### Utility Commands (without actions)
- **init/**, **list-aliases/**, **top-authors/**: Simple command structure
- Single `index.ts` file containing the entire command logic
- No need for separate action files since they perform one main function

## Adding New Commands

All commands now use the **Plugin/Module Pattern** for consistent architecture:

### For Interactive Commands (with actions):
1. Create a new folder: `src/cli/commands/my-command/`
2. Create actions folder: `src/cli/commands/my-command/actions/`
3. Implement individual action files in the actions folder
4. Create `actions/index.ts` to export all actions
5. Create main command file: `src/cli/commands/my-command/index.ts`
6. Export a `registerCommand(program: Command): CommandModule` function
7. Add the command import and registration call in `src/index.ts`

### For Utility Commands (simple):
1. Create a new folder: `src/cli/commands/my-command/`
2. Create main command file: `src/cli/commands/my-command/index.ts`
3. Export a `registerCommand(program: Command): CommandModule` function
4. Add the command import and registration call in `src/index.ts`

### Plugin/Module Pattern Template:

```typescript
import { Command } from 'commander';
import type { CommandModule } from '../../utils/command-registration.js';

const myCommand = async () => {
  // Command implementation
};

/**
 * Register my-command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  program
    .command('my-command')
    .description('Description of my command')
    .action(myCommand);

  return {
    name: 'my-command',
    description: 'Description of my command',
    action: myCommand,
  };
}
```

### For Commands with Arguments:

```typescript
/**
 * Register command with arguments
 */
export function registerCommand(program: Command): CommandModule {
  const commandWithArgs = async (...args: unknown[]) => {
    const arg1 = args[0] as string | undefined;
    await myCommand(arg1);
  };

  program
    .command('my-command [arg1]')
    .description('Command with optional argument')
    .action(commandWithArgs);

  return {
    name: 'my-command',
    description: 'Command with optional argument',
    action: commandWithArgs,
    argument: {
      name: '[arg1]',
      description: 'Optional argument description',
    },
  };
}
```

### For Commands with Subcommands:

```typescript
/**
 * Register command with subcommands
 */
export function registerCommand(program: Command): CommandModule {
  const command = program
    .command('my-command')
    .description('Command with subcommands');

  // Add subcommands
  command
    .command('sub1')
    .description('First subcommand')
    .action(async () => { /* implementation */ });

  command
    .command('sub2 <arg>')
    .description('Second subcommand with argument')
    .action(async (arg: string) => { /* implementation */ });

  // Main command action (when called without subcommands)
  command.action(myMainCommand);

  return {
    name: 'my-command',
    description: 'Command with subcommands',
    action: myMainCommand,
  };
}

## Adding New Actions

1. Create a new action file: `src/cli/commands/[command]/actions/my-action.ts`
2. Implement the action function returning `ActionResult<T>`
3. Export the action in `actions/index.ts`
4. Add the action configuration in the main command file using `createActions()`

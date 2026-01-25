# Code Patterns

## Command Registration

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

## Action Pattern

Commands with interactive lists use actions defined in `actions/index.ts`:

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

## GitExecutor Singleton

All git commands go through the singleton:

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

**Note**: Use streaming for large outputs. Regular `executeCommand` has a 10MB buffer limit.

## Interactive List

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

**Non-interactive mode**: Detects non-TTY environments (CI, tests) and returns first item automatically. Checks `process.stdin.isTTY`, `process.env.CI`, `process.env.GITHUB_ACTIONS`.

## Terminal Output

Never use `console.log` directly:

```typescript
import { writeLine, writeErrorLine, write, clearScreen } from '../utils/terminal.js';

writeLine('Normal output');
writeErrorLine('Error output to stderr');
write('Without newline');
```

## ANSI Colors

```typescript
import { green, red, yellow, blue, gray, bold } from '../ui/ansi.js';

writeLine(green('Success message'));
writeLine(red('Error message'));
```

## Gotchas

### process.exit() in Commands
Commands call `process.exit()` directly. This is intentional for CLI behavior but makes unit testing harder. Test at E2E level or mock `process.exit`.

### Git Command Escaping
When building git commands with user input, escape quotes:
```typescript
const escaped = userInput.replace(/"/g, '\\"');
await executor.executeCommand(`git stash push -m "${escaped}"`);
```

### Clipboard May Fail
`clipboardy` can fail in headless environments. Always handle errors gracefully.

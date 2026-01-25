# Common Tasks

## Adding a New Command

1. Create folder: `src/cli/commands/<name>/`
2. Create `index.ts` with `registerCommand` export (see [patterns.md](patterns.md#command-registration))
3. Register in `src/index.ts`:
   ```typescript
   import { registerCommand as registerNewCmd } from './cli/commands/<name>/index.js';
   // Add to commands array
   ```
4. Create `test/e2e/<name>.test.ts` with 3-5 tests

## Adding an Action to a Command

1. Create `src/cli/commands/<name>/actions/<action>.ts`
2. Export from `src/cli/commands/<name>/actions/index.ts`
3. Add to the command's `createActions` array

## Adding a New Git Query

1. Create function in appropriate `src/core/git/*.ts` file
2. Use `gitExecutor.executeCommand()` or `executeStreamingCommand()`
3. Parse output and return typed interface
4. Add unit test file next to source

## Modifying Search Behavior

Search scoring is in `src/cli/ui/search-scoring.ts`. The algorithm:
1. Exact substring match (best)
2. Contiguous fuzzy match (after removing separators)
3. Character-by-character fuzzy match (scattered)

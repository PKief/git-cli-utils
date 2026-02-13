/**
 * Global Actions with CLI Support
 *
 * Single source of truth for actions that work both as CLI options and interactive UI actions.
 * Define once, use everywhere - no more manual duplication between CLI and interactive modes.
 *
 * @example
 * ```typescript
 * const newBranchAction = createGlobalAction({
 *   key: 'new',
 *   label: 'New branch',
 *   description: 'Create a new branch from HEAD',
 *   cli: { option: '--new [name]' },
 *   handler: createBranch,
 *   promptForArgs: promptForBranchName,
 * });
 * ```
 */

import type { GlobalAction } from '../ui/selection-list/index.js';

/**
 * Configuration for a global action that works both as CLI option and interactive action.
 * Single source of truth - define once, use everywhere.
 */
export interface GlobalActionConfig<TArgs = void> {
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
  handler: (args: TArgs) => Promise<boolean>;

  /**
   * Prompts user for args when invoked interactively or when CLI option has no value.
   * Required if handler takes args. Returns null if user cancels.
   */
  promptForArgs?: () => Promise<TArgs | null>;
}

/**
 * Internal representation of a global action with CLI metadata.
 * This is the normalized form used internally after type erasure.
 */
export interface GlobalActionWithCLI {
  key: string;
  label: string;
  description?: string;
  cli?: {
    option: string;
    optionDescription?: string;
  };
  handler: (args?: Record<string, unknown>) => Promise<boolean>;
  promptForArgs?: () => Promise<Record<string, unknown> | null>;
}

/**
 * Result of parsing a Commander.js option string
 */
export interface ParsedOption {
  /** The primary option key (e.g., 'new' from '--new [name]') */
  key: string;
  /** Short alias if provided (e.g., 'a' from '-a, --all') */
  shortKey?: string;
  /** Whether the option accepts an argument */
  hasArg: boolean;
  /** Whether the argument is required (false = optional) */
  argRequired: boolean;
  /** Name of the argument if present */
  argName?: string;
}

/**
 * Parse a Commander.js option string to extract metadata
 *
 * @example
 * parseOption('--new')           // { key: 'new', hasArg: false, argRequired: false }
 * parseOption('--new [name]')    // { key: 'new', hasArg: true, argRequired: false, argName: 'name' }
 * parseOption('--new <name>')    // { key: 'new', hasArg: true, argRequired: true, argName: 'name' }
 * parseOption('-a, --all')       // { key: 'all', shortKey: 'a', hasArg: false, argRequired: false }
 */
export function parseOption(optionStr: string): ParsedOption {
  // Match patterns like: '-a', '--all', '-a, --all', '--new [name]', '--new <name>'
  const shortMatch = optionStr.match(/-([a-zA-Z]),?\s*/);
  const longMatch = optionStr.match(/--([a-zA-Z][-a-zA-Z0-9]*)/);
  const optionalArgMatch = optionStr.match(/\[([^\]]+)\]/);
  const requiredArgMatch = optionStr.match(/<([^>]+)>/);

  const key = longMatch?.[1] ?? shortMatch?.[1] ?? '';
  const shortKey = shortMatch?.[1];

  return {
    key,
    shortKey: shortKey !== key ? shortKey : undefined,
    hasArg: !!(optionalArgMatch || requiredArgMatch),
    argRequired: !!requiredArgMatch,
    argName: requiredArgMatch?.[1] ?? optionalArgMatch?.[1],
  };
}

/**
 * Extract the option key from a Commander.js option string
 * Convenience wrapper around parseOption
 *
 * @example
 * extractOptionKey('--new [name]')  // 'new'
 * extractOptionKey('-a, --all')     // 'all'
 */
export function extractOptionKey(optionStr: string): string {
  return parseOption(optionStr).key;
}

/**
 * Convert a GlobalActionWithCLI to a GlobalAction for use in interactive UI
 */
export function toInteractiveAction(action: GlobalActionWithCLI): GlobalAction {
  return {
    type: 'global',
    key: action.key,
    label: action.label,
    description: action.description,
    handler: async () => {
      // In interactive mode, always prompt for args if handler expects them
      if (action.promptForArgs) {
        const args = await action.promptForArgs();
        if (args === null) {
          return false; // User cancelled
        }
        return action.handler(args);
      }
      return action.handler();
    },
  };
}

/**
 * Create a single global action with full type safety.
 * This is the type-safe way to create actions.
 *
 * @example
 * ```typescript
 * const newBranchAction = createGlobalAction({
 *   key: 'new',
 *   label: 'New branch',
 *   cli: { option: '--new [name]' },
 *   handler: createBranch,
 *   promptForArgs: promptForBranchName,
 * });
 * ```
 */
export function createGlobalAction<TArgs>(
  config: GlobalActionConfig<TArgs>
): GlobalActionWithCLI {
  return {
    key: config.key,
    label: config.label,
    description: config.description,
    cli: config.cli,
    handler: config.handler as (
      args?: Record<string, unknown>
    ) => Promise<boolean>,
    promptForArgs: config.promptForArgs as
      | (() => Promise<Record<string, unknown> | null>)
      | undefined,
  };
}

/**
 * Combine multiple global actions into an array.
 * Use createGlobalAction() to create each action with full type safety.
 *
 * @example
 * ```typescript
 * const actions = createGlobalActions([
 *   createGlobalAction({
 *     key: 'all',
 *     label: 'All branches',
 *     cli: { option: '-a, --all' },
 *     handler: async () => { ... },
 *   }),
 *   createGlobalAction({
 *     key: 'new',
 *     label: 'New branch',
 *     cli: { option: '--new [name]' },
 *     handler: createBranch,
 *     promptForArgs: promptForBranchName,
 *   }),
 * ]);
 * ```
 */
export function createGlobalActions(
  actions: GlobalActionWithCLI[]
): GlobalActionWithCLI[] {
  return actions;
}

/**
 * Convert global actions to interactive UI format (GlobalAction array)
 */
export function toInteractiveActions(
  actions: GlobalActionWithCLI[]
): GlobalAction[] {
  return actions.map(toInteractiveAction);
}

/**
 * Find which global action was triggered by CLI options
 *
 * @param actions - Array of global actions to check
 * @param options - Options object from Commander.js
 * @returns The triggered action and its CLI value, or null if none triggered
 */
export function findTriggeredAction(
  actions: GlobalActionWithCLI[],
  options: Record<string, unknown>
): { action: GlobalActionWithCLI; cliValue: unknown } | null {
  for (const action of actions) {
    if (!action.cli) continue;

    const parsed = parseOption(action.cli.option);
    const value = options[parsed.key];

    // Check if option was provided (true for flags, string for args)
    if (value !== undefined && value !== false) {
      return { action, cliValue: value };
    }
  }
  return null;
}

/**
 * Execute a triggered action with proper argument handling
 *
 * @param action - The global action to execute
 * @param cliValue - The value from CLI (true for flags, string for args)
 * @returns Result of the action handler
 */
export async function executeTriggeredAction(
  action: GlobalActionWithCLI,
  cliValue: unknown
): Promise<boolean> {
  if (!action.cli) {
    return action.handler();
  }

  const parsed = parseOption(action.cli.option);

  // Boolean flag (no argument)
  if (!parsed.hasArg) {
    return action.handler();
  }

  // Has argument - check if value was provided
  if (typeof cliValue === 'string' && cliValue.length > 0) {
    // Argument provided via CLI
    const args = { [parsed.argName ?? parsed.key]: cliValue };
    return action.handler(args);
  }

  // Argument not provided - prompt if available
  if (action.promptForArgs) {
    const args = await action.promptForArgs();
    if (args === null) {
      return false; // User cancelled
    }
    return action.handler(args);
  }

  // No promptForArgs defined but arg is optional - call with no args
  if (!parsed.argRequired) {
    return action.handler();
  }

  // Required arg missing and no prompt - this shouldn't happen with proper setup
  throw new Error(
    `Action '${action.key}' requires an argument but none was provided`
  );
}

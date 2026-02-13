import { Command } from 'commander';
import type { CommandAction, CommandResult } from '../ui/command-selector.js';
import { handleErrorAndExit } from './exit.js';
import {
  executeTriggeredAction,
  findTriggeredAction,
  type GlobalActionWithCLI,
  toInteractiveActions,
} from './global-action.js';

export interface CommandModule {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void | CommandResult>;
  argument?: {
    name: string;
    description: string;
  };
  /** Command-level actions (e.g., "new branch", "new tag") */
  commandActions?: CommandAction[];
}

/**
 * Generic command registration pattern
 * Each command module exports a registerCommand function that:
 * 1. Registers the main command with Commander
 * 2. Registers any subcommands
 * 3. Returns command metadata for the interactive selector
 */
export type CommandRegistration = (program: Command) => CommandModule;

export interface CommandConfig {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void | CommandResult>;
  argument?: {
    name: string;
    description: string;
  };
  /**
   * Global actions - automatically generates both CLI options and interactive actions.
   * Use createGlobalActions() to create these.
   */
  globalActions?: GlobalActionWithCLI[];
}

/**
 * Builder helper to eliminate duplication in command registration
 *
 * Automatically registers CLI options from globalActions and routes to appropriate handlers.
 *
 * @example
 * ```typescript
 * // Simple command
 * export function registerCommand(program: Command): CommandModule {
 *   return createCommand(program, {
 *     name: 'sync',
 *     description: 'Sync from a remote branch by selecting remote and branch interactively',
 *     action: syncCommand,
 *   });
 * }
 *
 * // Command with global actions
 * export function registerCommand(program: Command): CommandModule {
 *   return createCommand(program, {
 *     name: 'branches',
 *     description: 'Interactive branch selection with fuzzy search',
 *     action: searchBranches,
 *     globalActions: createGlobalActions([
 *       {
 *         key: 'new',
 *         label: 'New branch',
 *         description: 'Create a new branch from HEAD',
 *         cli: { option: '--new [name]' },
 *         handler: createBranch,
 *         promptForArgs: promptForBranchName,
 *       },
 *     ]),
 *   });
 * }
 * ```
 */
export function createCommand(
  program: Command,
  config: CommandConfig
): CommandModule {
  const cmd = new Command(config.name).description(config.description);

  // Add argument if provided
  if (config.argument) {
    cmd.argument(config.argument.name, config.argument.description);
  }

  // Register CLI options from global actions
  if (config.globalActions) {
    for (const action of config.globalActions) {
      if (action.cli) {
        cmd.option(
          action.cli.option,
          action.cli.optionDescription ?? action.description ?? ''
        );
      }
    }
  }

  // Set up the command action handler
  // Wrap in try/catch to handle errors before Commander.js prints them
  cmd.action(async (...args: unknown[]) => {
    try {
      // Commander.js passes: [argument1, argument2, ..., options, command]
      // Options is always second to last
      const optionsIndex = args.length - 2;
      const options = (args[optionsIndex] as Record<string, unknown>) ?? {};

      // Check if any global action was triggered via CLI
      if (config.globalActions) {
        const triggered = findTriggeredAction(config.globalActions, options);
        if (triggered) {
          await executeTriggeredAction(triggered.action, triggered.cliValue);
          return;
        }
      }

      // No global action triggered - run default action with original args
      // Strip options and command objects if action doesn't expect them
      await config.action(...args);
    } catch (error) {
      // Handle errors here to prevent Commander.js from printing stack traces
      handleErrorAndExit(error);
    }
  });

  program.addCommand(cmd);

  // Convert global actions to interactive UI format
  const commandActions = config.globalActions
    ? toInteractiveActions(config.globalActions)
    : [];

  return {
    name: config.name,
    description: config.description,
    action: config.action,
    argument: config.argument,
    commandActions: commandActions.length > 0 ? commandActions : undefined,
  };
}

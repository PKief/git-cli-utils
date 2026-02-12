import { Command } from 'commander';
import { AppError } from '../utils/exit.js';
import { writeLine } from '../utils/terminal.js';
import { yellow } from './ansi.js';
import {
  type Action,
  type GlobalAction,
  selectionList,
} from './selection-list/index.js';

/**
 * Global action that can be performed at the command level
 * (e.g., "new branch", "new tag" - actions that don't require selecting a specific item first)
 */
export type CommandAction = GlobalAction;

/**
 * Result from a command action indicating navigation intent
 */
export interface CommandResult {
  /** Whether to go back to the command selector */
  back?: boolean;
}

/**
 * Interface for commands available in git-utils
 */
export interface GitUtilsCommand {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void | CommandResult>;
  argument?: {
    name: string;
    description: string;
  };
  /** Optional function to register subcommands after main command registration */
  registerSubcommands?: (program: Command, command: Command) => void;
  /** Optional command-level actions (e.g., "new" to create a new branch/tag/etc.) */
  commandActions?: CommandAction[];
}

// Store the last command result for back navigation detection
let lastCommandResult: CommandResult | undefined = undefined;

/**
 * Creates actions for a command in the command selector
 * Includes a default "open" action plus any command-specific actions
 *
 * @param cmd - The command to create actions for
 */
function createCommandActions(
  cmd: GitUtilsCommand | null
): Action<GitUtilsCommand>[] {
  if (!cmd) {
    return [];
  }

  // Default "open" action - enters the command's list view
  const openAction: GlobalAction = {
    type: 'global',
    key: 'open',
    label: 'Open',
    description: `Open ${cmd.name}`,
    handler: async () => {
      const result = await cmd.action();
      lastCommandResult = result ?? undefined;
      return true;
    },
  };

  // Combine with command-specific actions
  const commandSpecificActions = cmd.commandActions || [];

  return [openAction, ...commandSpecificActions];
}

/**
 * Interactive command selector - the main landing page for git-utils
 * Shows a searchable list of available commands with actions
 * Loops back when a command returns { back: true }
 */
export async function showCommandSelector(
  commands: GitUtilsCommand[]
): Promise<void> {
  while (true) {
    // Reset last command result
    lastCommandResult = undefined;

    writeLine('Select a command to run:');
    writeLine();

    const result = await selectionList<GitUtilsCommand>({
      items: commands,
      renderItem: (cmd) => `${cmd.name.padEnd(12)} ${cmd.description}`,
      getSearchText: (cmd) => `${cmd.name} ${cmd.description}`,
      actions: createCommandActions,
      defaultActionKey: 'open',
    });

    if (!result.success && !result.action) {
      writeLine(yellow('No command selected. Exiting.'));
      throw AppError.silent();
    }

    // Check if the command requested to go back
    if (lastCommandResult && (lastCommandResult as CommandResult).back) {
      // Continue the loop to show command selector again
      continue;
    }

    // Command completed normally, exit
    break;
  }
}

import { Command } from 'commander';
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
 * Interface for commands available in git-utils
 */
export interface GitUtilsCommand {
  name: string;
  description: string;
  action: (...args: string[]) => Promise<void>;
  argument?: {
    name: string;
    description: string;
  };
  /** Optional function to register subcommands after main command registration */
  registerSubcommands?: (program: Command, command: Command) => void;
  /** Optional command-level actions (e.g., "new" to create a new branch/tag/etc.) */
  commandActions?: CommandAction[];
}

/**
 * Creates actions for a command in the command selector
 * Includes a default "open" action plus any command-specific actions
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
      writeLine();
      writeLine(yellow(`Executing: ${cmd.name}`));
      writeLine();
      await cmd.action();
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
 */
export async function showCommandSelector(
  commands: GitUtilsCommand[]
): Promise<void> {
  writeLine('Select a command to run:');
  writeLine();

  try {
    const result = await selectionList<GitUtilsCommand>({
      items: commands,
      renderItem: (cmd) => `${cmd.name.padEnd(12)} ${cmd.description}`,
      getSearchText: (cmd) => `${cmd.name} ${cmd.description}`,
      actions: createCommandActions,
      defaultActionKey: 'open',
    });

    if (!result.success && !result.action) {
      writeLine(yellow('No command selected. Exiting.'));
      process.exit(0);
    }
  } catch (error) {
    // Handle user cancellation gracefully
    if (error instanceof Error && error.message === 'Selection cancelled') {
      writeLine();
      writeLine(yellow('Selection cancelled. Exiting.'));
      process.exit(0);
    }
    // Re-throw other errors
    throw error;
  }
}

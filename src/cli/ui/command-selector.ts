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
  /** Optional command-level actions (e.g., "new" to create a new branch/tag/etc.) */
  commandActions?: CommandAction[];
}

/**
 * Creates actions for a command in the command selector
 * Uses the provided callback to communicate back-navigation intent.
 *
 * @param cmd - The command to create actions for
 * @param onBack - Called when the command signals back-navigation
 */
function createCommandActions(
  cmd: GitUtilsCommand | null,
  onBack: () => void
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
      if (result && (result as CommandResult).back) {
        onBack();
      }
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
    let shouldGoBack = false;
    const onBack = () => {
      shouldGoBack = true;
    };

    writeLine('Select a command to run:');
    writeLine();

    const result = await selectionList<GitUtilsCommand>({
      items: commands,
      renderItem: (cmd) => `${cmd.name.padEnd(12)} ${cmd.description}`,
      getSearchText: (cmd) => `${cmd.name} ${cmd.description}`,
      actions: (cmd) => createCommandActions(cmd, onBack),
      defaultActionKey: 'open',
    });

    if (!result.success && !result.action) {
      writeLine(yellow('No command selected. Exiting.'));
      throw AppError.silent();
    }

    // Check if the command requested to go back
    if (shouldGoBack) {
      continue;
    }

    // Command completed normally, exit
    break;
  }
}

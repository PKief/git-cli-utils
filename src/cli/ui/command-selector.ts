import { writeLine } from '../utils/terminal.js';
import { yellow } from './ansi.js';
import { interactiveList } from './interactive-list.js';

// Define available commands interface
export interface GitUtilsCommand {
  name: string;
  description: string;
  action: (...args: string[]) => Promise<void>;
  argument?: {
    name: string;
    description: string;
  };
}

/**
 * Interactive command selector - the main landing page for git-utils
 * Shows a searchable list of available commands and executes the selected one
 */
export async function showCommandSelector(
  commands: GitUtilsCommand[]
): Promise<void> {
  writeLine('Select a command to run:');
  writeLine();

  try {
    const selectedCommand = await interactiveList<GitUtilsCommand>(
      commands,
      (cmd: GitUtilsCommand) => `${cmd.name.padEnd(12)} ${cmd.description}`,
      (cmd: GitUtilsCommand) => `${cmd.name} ${cmd.description}` // Search both name and description
    );

    if (selectedCommand) {
      writeLine();
      writeLine(yellow(`Executing: ${selectedCommand.name}`));
      writeLine();
      await selectedCommand.action();
    } else {
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

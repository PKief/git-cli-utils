import * as p from '@clack/prompts';
import { Command } from 'commander';
import { GitExecutor } from '../../../core/git/executor.js';
import { green, red, yellow } from '../../ui/ansi.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';

/**
 * Save current working directory changes as a new stash
 */
const saveChanges = async () => {
  try {
    const executor = GitExecutor.getInstance();

    // First check if there are any changes to stash
    const statusResult = await executor.executeCommand(
      'git status --porcelain'
    );

    if (!statusResult.stdout.trim()) {
      writeLine(yellow('No changes to save. Working directory is clean.'));
      process.exit(0);
    }

    // Prompt for stash message
    const stashMessage = await p.text({
      message: 'Enter a message for the stash:',
      placeholder: 'WIP: feature in progress',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Stash message cannot be empty';
        }
        return undefined;
      },
    });

    // Check if user cancelled
    if (p.isCancel(stashMessage)) {
      writeLine(yellow(`Save cancelled.`));
      process.exit(0);
    }

    // Create the stash with the custom message
    await executor.executeCommand(
      `git stash push -m "${stashMessage.trim().replace(/"/g, '\\"')}"`
    );

    writeLine(green(`✓ Saved changes as stash: "${stashMessage.trim()}"`));
    process.exit(0);
  } catch (error) {
    const errorMessage = `Save failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    process.exit(1);
  }
};

/**
 * Register save command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'save',
    description: 'Save current working directory changes as a new stash',
    action: saveChanges,
  });
}

/**
 * Global action: Create a new stash from current changes
 */

import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Arguments for creating a stash
 */
export interface CreateStashArgs {
  message?: string;
  includeUntracked?: boolean;
}

/**
 * Prompt user for stash options
 * Returns null if user cancels
 */
export async function promptForStashOptions(): Promise<CreateStashArgs | null> {
  const message = await p.text({
    message: 'Enter stash message (optional):',
    placeholder: 'WIP: working on feature',
  });

  if (typeof message === 'symbol') {
    writeLine(yellow('Stash creation cancelled.'));
    return null;
  }

  const includeUntracked = await p.confirm({
    message: 'Include untracked files?',
    initialValue: false,
  });

  if (typeof includeUntracked === 'symbol') {
    writeLine(yellow('Stash creation cancelled.'));
    return null;
  }

  return {
    message: message?.trim() || undefined,
    includeUntracked,
  };
}

/**
 * Create a new stash from current changes
 * @param args - Stash creation arguments (all optional)
 */
export async function createStash(args: CreateStashArgs): Promise<boolean> {
  try {
    const executor = GitExecutor.getInstance();

    // Check if there are changes to stash
    const statusResult = await executor.executeCommand(
      'git status --porcelain'
    );
    if (!statusResult.stdout.trim()) {
      writeLine(yellow('No changes to stash.'));
      return false;
    }

    let command = 'git stash push';
    if (args.includeUntracked) {
      command += ' --include-untracked';
    }
    if (args.message) {
      command += ` -m "${args.message}"`;
    }

    await executor.executeCommand(command);
    writeLine(green('✓ Changes stashed successfully'));

    return true;
  } catch (error) {
    writeLine(
      red(
        `✗ Failed to create stash: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    return false;
  }
}

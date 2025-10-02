import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { GitStash } from '../../../../core/git/stashes.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionCancelled,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Create new stash action - creates a stash from current working directory changes
 * Note: This action doesn't use the GitStash parameter since it creates a new stash
 */
export async function createNewStash(
  _stash?: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    const executor = GitExecutor.getInstance();

    // First check if there are any changes to stash
    const statusResult = await executor.executeCommand(
      'git status --porcelain'
    );

    if (!statusResult.stdout.trim()) {
      writeLine(yellow('No changes to stash. Working directory is clean.'));
      return actionCancelled('No changes to stash');
    }

    // Prompt for stash message
    const stashMessage = await p.text({
      message: 'Enter a message for the new stash:',
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
      writeLine(yellow(`Stash creation cancelled.`));
      return actionCancelled('Stash creation cancelled');
    }

    // Create the stash with the custom message
    await executor.executeCommand(
      `git stash push -m "${stashMessage.trim().replace(/"/g, '\\"')}"`
    );

    writeLine(green(`✓ Created new stash: "${stashMessage.trim()}"`));

    return actionSuccess(`New stash created`);
  } catch (error) {
    const errorMessage = `Create stash failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

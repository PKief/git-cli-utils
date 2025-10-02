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
 * Create branch from stash action
 */
export async function createBranchFromStash(
  stash: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    // Prompt for branch name
    const branchName = await p.text({
      message: `Enter name for new branch from stash@{${stash.index}}:`,
      placeholder: 'feature-branch-name',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Branch name cannot be empty';
        }
        // Basic branch name validation
        if (!/^[a-zA-Z0-9/_-]+$/.test(value.trim())) {
          return 'Branch name can only contain letters, numbers, slashes, hyphens, and underscores';
        }
        return undefined;
      },
    });

    // Check if user cancelled
    if (p.isCancel(branchName)) {
      writeLine(yellow(`Branch creation cancelled.`));
      return actionCancelled('Branch creation cancelled');
    }

    const executor = GitExecutor.getInstance();

    // Create branch from stash using git stash branch
    await executor.executeCommand(
      `git stash branch ${branchName.trim()} stash@{${stash.index}}`
    );

    writeLine(
      green(
        `✓ Created branch '${branchName.trim()}' from stash@{${stash.index}}`
      )
    );
    writeLine(green(`✓ Stash has been applied and removed from stash list`));

    return actionSuccess(`Branch created from stash`);
  } catch (error) {
    const errorMessage = `Create branch failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

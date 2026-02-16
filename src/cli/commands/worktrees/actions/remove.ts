import { confirm } from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { GitWorktree } from '../../../../core/git/worktrees.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { createSpinner } from '../../../utils/spinner.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Remove a worktree after confirmation
 */
export async function removeWorktree(worktree: GitWorktree): Promise<boolean> {
  try {
    if (worktree.isMain) {
      writeLine(red('Cannot remove the main worktree!'));
      return false;
    }

    writeLine(`Removing worktree: ${worktree.path}`);
    writeLine(`Branch: ${worktree.branch || 'detached HEAD'}`);
    writeLine();
    writeLine(
      yellow('This will delete the worktree directory and all its files.')
    );
    writeLine(
      yellow('Your commits and branch will be preserved in Git history.')
    );
    writeLine();

    const confirmed = await confirm({
      message: `Are you sure you want to remove this worktree?`,
      initialValue: false, // Default to "No" for safety
    });

    if (!confirmed) {
      writeLine(yellow('Worktree removal cancelled.'));
      return true;
    }

    // Remove the worktree using git command
    const executor = GitExecutor.getInstance();
    const spinner = createSpinner();
    spinner.start(`Removing worktree at ${worktree.path}...`);

    await executor.executeCommand(
      `git worktree remove --force "${worktree.path}"`
    );

    spinner.stop(green(`Worktree removed successfully: ${worktree.path}`));
    writeLine(
      `Branch '${worktree.branch}' is still available in your main worktree.`
    );

    return true;
  } catch (error) {
    writeErrorLine(
      `Failed to remove worktree: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

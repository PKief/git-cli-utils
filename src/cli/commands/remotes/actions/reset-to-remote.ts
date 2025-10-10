import { GitExecutor } from '../../../../core/git/executor.js';
import { GitRemoteBranch } from '../../../../core/git/remotes.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Reset the current branch to match a remote branch
 * Aborts if there are any uncommitted changes (staged or unstaged)
 */
export async function resetToRemoteBranch(
  remoteBranch: GitRemoteBranch
): Promise<boolean> {
  try {
    writeLine(`Checking for uncommitted changes...`);

    // Check for staged changes
    const stagedResult = await GitExecutor.getInstance().executeCommand(
      'git diff --cached --quiet'
    );
    const hasStaged = !stagedResult.success;

    // Check for unstaged changes
    const unstagedResult =
      await GitExecutor.getInstance().executeCommand('git diff --quiet');
    const hasUnstaged = !unstagedResult.success;

    if (hasStaged || hasUnstaged) {
      writeErrorLine(red('✗ Cannot reset: You have uncommitted changes.'));

      if (hasStaged) {
        writeLine(yellow('  - You have staged changes'));
      }
      if (hasUnstaged) {
        writeLine(yellow('  - You have unstaged changes'));
      }

      writeLine(yellow('Please commit, stash, or discard your changes first.'));
      return false;
    }

    // Get current branch name
    const currentBranchResult = await GitExecutor.getInstance().executeCommand(
      'git rev-parse --abbrev-ref HEAD'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (currentBranch === 'HEAD') {
      writeErrorLine(red('✗ Cannot reset: You are in detached HEAD state.'));
      writeLine(yellow('Please checkout a branch first.'));
      return false;
    }

    writeLine(
      `Resetting branch '${currentBranch}' to match '${remoteBranch.fullName}'...`
    );

    // Perform the reset
    await GitExecutor.getInstance().executeCommand(
      `git reset --hard ${remoteBranch.fullName}`
    );

    writeLine(
      green(
        `✓ Successfully reset '${currentBranch}' to '${remoteBranch.fullName}'`
      )
    );
    writeLine(yellow(`Current branch now matches the remote branch.`));

    return true;
  } catch (error) {
    writeErrorLine(
      `Error resetting to remote branch: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

import { GitExecutor } from '../../../../core/git/executor.js';
import { GitWorktree } from '../../../../core/git/worktrees.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Show detailed information about a worktree
 */
export async function showWorktreeInfo(
  worktree: GitWorktree
): Promise<boolean> {
  try {
    writeLine(green(`Worktree Information`));
    writeLine();
    writeLine(`Path: ${worktree.path}`);
    writeLine(`Branch: ${worktree.branch || 'detached HEAD'}`);
    writeLine(`Commit: ${worktree.commit || 'unknown'}`);
    writeLine(
      `Type: ${worktree.isMain ? 'Main worktree' : 'Additional worktree'}`
    );
    writeLine();

    // Get additional git status information
    try {
      const executor = GitExecutor.getInstance();
      const statusResult = await executor.executeCommand(
        `git -C "${worktree.path}" status --porcelain`
      );

      if (statusResult.stdout.trim()) {
        const lines = statusResult.stdout.trim().split('\n');
        writeLine(yellow(`Working Directory Status:`));
        writeLine(`${lines.length} file(s) with changes`);

        // Show first few files
        const filesToShow = lines.slice(0, 5);
        for (const line of filesToShow) {
          const status = line.substring(0, 2);
          const file = line.substring(3);
          let statusText = '';

          if (status.includes('M')) statusText = 'modified';
          else if (status.includes('A')) statusText = 'added';
          else if (status.includes('D')) statusText = 'deleted';
          else if (status.includes('??')) statusText = 'untracked';
          else statusText = 'changed';

          writeLine(`  ${statusText}: ${file}`);
        }

        if (lines.length > 5) {
          writeLine(`  ... and ${lines.length - 5} more file(s)`);
        }
      } else {
        writeLine(green(`✓ Working directory is clean`));
      }
    } catch {
      writeLine(yellow(`Could not get working directory status`));
    }

    writeLine();
    if (!worktree.isMain) {
      writeLine(yellow(`To switch to this worktree: cd "${worktree.path}"`));
    }

    return true;
  } catch (error) {
    writeErrorLine(
      `Failed to show worktree info: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

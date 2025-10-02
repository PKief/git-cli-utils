import { GitCommit } from '../../../../core/git/commits.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { showInPager } from '../../../utils/pager.js';
import { writeErrorLine } from '../../../utils/terminal.js';

/**
 * Show commit details action
 */
export async function showCommitDetails(
  commit: GitCommit
): Promise<ActionResult<GitCommit>> {
  try {
    const executor = GitExecutor.getInstance();

    // Use git show with color output and better formatting
    const result = await executor.executeCommand(
      `git show --color=always --stat --patch --pretty=fuller ${commit.hash}`
    );

    // Display the colorized diff in a pager
    await showInPager(result.stdout);

    return actionSuccess(`Showed commit details`);
  } catch (error) {
    const errorMessage = `Show failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

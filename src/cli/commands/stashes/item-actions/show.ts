import { GitExecutor } from '../../../../core/git/executor.js';
import { GitStash } from '../../../../core/git/stashes.js';
import { red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { showInPager } from '../../../utils/pager.js';
import { writeErrorLine } from '../../../utils/terminal.js';

/**
 * Show stash details action - displays stash diff using colorized output and pager
 */
export async function showStashDetails(
  stash: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    const executor = GitExecutor.getInstance();

    // Use git stash show with color output, patch format, and statistics
    const result = await executor.executeCommand(
      `git stash show --color=always --stat --patch stash@{${stash.index}}`
    );

    // Display the colorized diff in a pager (reusing the same pager as commits)
    await showInPager(result.stdout);

    return actionSuccess(`Showed stash details`);
  } catch (error) {
    const errorMessage = `Show failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

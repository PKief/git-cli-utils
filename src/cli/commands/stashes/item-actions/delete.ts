import { GitExecutor } from '../../../../core/git/executor.js';
import { GitStash } from '../../../../core/git/stashes.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionCancelled,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { confirmDeletion } from '../../../utils/prompts.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Delete stash action
 */
export async function deleteStash(
  stash: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    // Ask for confirmation before deleting
    const confirmed = await confirmDeletion('stash', `stash@{${stash.index}}`);

    if (!confirmed) {
      writeLine(yellow(`Deletion cancelled.`));
      return actionCancelled('Deletion cancelled');
    }

    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git stash drop stash@{${stash.index}}`);
    writeLine(green(`✓ Deleted stash@{${stash.index}}`));
    return actionSuccess(`Stash deleted`);
  } catch (error) {
    const errorMessage = `Delete failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

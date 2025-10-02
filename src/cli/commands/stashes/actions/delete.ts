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
      writeLine(yellow(`Stash deletion cancelled.`));
      return actionCancelled('Stash deletion cancelled');
    }

    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git stash drop stash@{${stash.index}}`);
    writeLine(green(`✓ Stash@{${stash.index}} has been successfully deleted`));
    return actionSuccess(`Stash@{${stash.index}} deleted successfully`);
  } catch (error) {
    const errorMessage = `Error deleting stash: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

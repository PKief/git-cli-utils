import { GitExecutor } from '../../../../core/git/executor.js';
import { GitStash } from '../../../../core/git/stashes.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Apply stash action
 */
export async function applyStash(
  stash: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git stash apply stash@{${stash.index}}`);
    writeLine(green(`✓ Stash@{${stash.index}} has been successfully applied`));
    return actionSuccess(`Stash@{${stash.index}} applied successfully`);
  } catch (error) {
    const errorMessage = `Error applying stash: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

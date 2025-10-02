import { GitOperations } from '../../../../core/git/operations.js';
import { GitStash } from '../../../../core/git/stashes.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Copy stash reference to clipboard action
 */
export async function copyStashReference(
  stash: GitStash
): Promise<ActionResult<GitStash>> {
  try {
    await GitOperations.copyToClipboard(`stash@{${stash.index}}`);
    writeLine(green(`✓ Stash@{${stash.index}} reference copied to clipboard`));
    return actionSuccess(`Stash reference copied to clipboard`);
  } catch (error) {
    const errorMessage = `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

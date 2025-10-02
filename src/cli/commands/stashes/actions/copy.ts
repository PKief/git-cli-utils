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
    writeLine(green(`✓ Copied stash@{${stash.index}}`));
    return actionSuccess(`Reference copied`);
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

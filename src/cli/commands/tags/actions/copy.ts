import { GitOperations } from '../../../../core/git/operations.js';
import { GitTag } from '../../../../core/git/tags.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Copy tag name to clipboard action
 */
export async function copyTagName(tag: GitTag): Promise<ActionResult<GitTag>> {
  try {
    await GitOperations.copyToClipboard(tag.name);
    writeLine(green(`✓ Copied '${tag.name}'`));
    return actionSuccess(`Tag name copied`);
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

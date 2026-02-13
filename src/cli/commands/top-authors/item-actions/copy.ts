import { FileAuthor } from '../../../../core/git/authors.js';
import { GitOperations } from '../../../../core/git/operations.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Copy author name to clipboard action
 */
export async function copyAuthorName(
  author: FileAuthor
): Promise<ActionResult<FileAuthor>> {
  try {
    const result = await GitOperations.copyToClipboard(author.name);
    writeLine(green(`\u2713 ${result.message}`));
    return actionSuccess(`Author name copied`);
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`\u2717 ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

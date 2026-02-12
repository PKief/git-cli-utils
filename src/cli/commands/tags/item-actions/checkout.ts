import { GitExecutor } from '../../../../core/git/executor.js';
import { GitTag } from '../../../../core/git/tags.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Checkout tag action
 */
export async function checkoutTag(tag: GitTag): Promise<ActionResult<GitTag>> {
  try {
    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git checkout ${tag.name}`);
    writeLine(green(`✓ Checked out tag '${tag.name}'`));
    return actionSuccess(`Checked out tag`);
  } catch (error) {
    const errorMessage = `Checkout failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

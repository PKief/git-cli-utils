import { GitAlias } from '../../../../core/git/aliases.js';
import { GitOperations } from '../../../../core/git/operations.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

export async function copyAliasCommand(
  alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    await GitOperations.copyToClipboard(alias.command);
    writeLine(green(`✓ Copied alias command for '${alias.name}'`));
    return actionSuccess('Alias copied');
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

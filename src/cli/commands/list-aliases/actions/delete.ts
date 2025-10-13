import * as p from '@clack/prompts';
import { deleteGitAlias, GitAlias } from '../../../../core/git/aliases.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Delete a git alias after confirmation
 */
export async function deleteAlias(
  alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    // Ask for confirmation before deleting
    const confirm = await p.confirm({
      message: `Are you sure you want to delete alias '${alias.name}'?`,
      initialValue: false,
    });

    // Handle cancellation or no
    if (typeof confirm === 'symbol' || !confirm) {
      return actionFailure('Operation cancelled');
    }

    // Delete the alias
    await deleteGitAlias(alias.name);
    writeLine(green(`✓ Deleted alias '${alias.name}'`));
    return actionSuccess('Alias deleted');
  } catch (error) {
    const message = `Failed to delete alias: ${error instanceof Error ? error.message : String(error)}`;
    writeLine(red(`✗ ${message}`));
    return actionFailure(message);
  }
}

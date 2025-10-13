import * as p from '@clack/prompts';
import { GitAlias, setGitAlias } from '../../../../core/git/aliases.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Edit an existing git alias
 */
export async function editAlias(
  alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    // Get new command for the alias
    const commandResult = await p.text({
      message: `Enter new command for alias '${alias.name}'`,
      placeholder: alias.command,
      initialValue: alias.command,
    });

    // Handle cancellation
    if (typeof commandResult === 'symbol') {
      return actionFailure('Operation cancelled');
    }

    const command = commandResult.trim();
    if (!command) {
      return actionFailure('Command cannot be empty');
    }

    // Update the alias with new command
    await setGitAlias(alias.name, command);
    writeLine(
      green(`✓ Updated alias '${alias.name}' with new command: ${command}`)
    );

    // Ask if they want to try the edited alias
    const runNow = await p.confirm({
      message: `Do you want to run the updated alias '${alias.name}' now?`,
      initialValue: false,
    });

    if (typeof runNow === 'symbol') {
      return actionSuccess('Alias updated');
    }

    if (runNow) {
      const { executeAlias } = await import('./execute.js');
      return executeAlias({ ...alias, command });
    }

    return actionSuccess('Alias updated');
  } catch (error) {
    const message = `Failed to edit alias: ${error instanceof Error ? error.message : String(error)}`;
    writeLine(red(`✗ ${message}`));
    return actionFailure(message);
  }
}

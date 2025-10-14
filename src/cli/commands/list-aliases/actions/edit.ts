import * as p from '@clack/prompts';
import {
  deleteGitAlias,
  GitAlias,
  getGitAliases,
  setGitAlias,
} from '../../../../core/git/aliases.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeLine } from '../../../utils/terminal.js';
import { executeAlias } from './execute.js';

/**
 * Edit an existing git alias
 */
export async function editAlias(
  alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    // Pre-load all existing aliases for validation
    const existingAliases = await getGitAliases();
    const existingAliasNames = existingAliases.map((a) => a.name);

    // Get new alias name
    const nameResult = await p.text({
      message: `Enter alias name:`,
      placeholder: alias.name,
      initialValue: alias.name,
      validate: (value) => {
        if (!value || !value.trim()) {
          return 'Alias name cannot be empty';
        }

        const trimmedValue = value.trim();

        // Check if name contains invalid characters
        if (!/^[a-zA-Z0-9-_]+$/.test(trimmedValue)) {
          return 'Alias name can only contain letters, numbers, hyphens, and underscores';
        }

        // Check if the new name already exists (only if it's different from the current name)
        if (
          trimmedValue !== alias.name &&
          existingAliasNames.includes(trimmedValue)
        ) {
          return `The alias '${trimmedValue}' is not available as it's already used by another command`;
        }

        return undefined;
      },
    });

    // Handle cancellation
    if (typeof nameResult === 'symbol') {
      return actionFailure('Operation cancelled');
    }

    const newName = nameResult.trim();

    // Get new command for the alias
    const commandResult = await p.text({
      message: `Enter command for alias '${newName}':`,
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

    // If the alias name changed, we need to delete the old one and create a new one
    if (newName !== alias.name) {
      await deleteGitAlias(alias.name);
      await setGitAlias(newName, command);
      writeLine(
        green(
          `✓ Renamed alias '${alias.name}' to '${newName}' with command: ${command}`
        )
      );
    } else {
      // Just update the command for the existing alias
      await setGitAlias(alias.name, command);
      writeLine(
        green(`✓ Updated alias '${alias.name}' with new command: ${command}`)
      );
    }

    // Ask if they want to try the edited alias
    const runNow = await p.confirm({
      message: `Do you want to run the updated alias '${newName}' now?`,
      initialValue: false,
    });

    if (typeof runNow === 'symbol') {
      return actionSuccess('Alias updated');
    }

    if (runNow) {
      return executeAlias({ name: newName, command });
    }

    return actionSuccess('Alias updated');
  } catch (error) {
    const message = `Failed to edit alias: ${error instanceof Error ? error.message : String(error)}`;
    writeLine(red(`✗ ${message}`));
    return actionFailure(message);
  }
}

import * as p from '@clack/prompts';
import {
  aliasExists,
  GitAlias,
  setGitAlias,
} from '../../../../core/git/aliases.js';
import { gitExecutor } from '../../../../core/git/executor.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Create a new git alias by asking the user for the command and name.
 * If the name already exists the user will be re-prompted until a unique name is provided.
 */
export async function createNewAlias(
  _alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    // Ask for the alias command first
    const commandResult = await p.text({
      message: 'Enter the git command for the new alias (must start with git )',
      placeholder: 'checkout feature-branch',
    });

    // Handle cancellation or empty input
    if (typeof commandResult === 'symbol' || !commandResult) {
      return actionFailure('No command provided');
    }

    const command = commandResult.trim();
    if (!command) {
      return actionFailure('No command provided');
    }

    // Ask for alias name and validate uniqueness
    let name: string | undefined;
    while (true) {
      const nameResult = await p.text({
        message: 'Enter the alias name (e.g. co, st)',
        placeholder: 'co',
      });

      // Handle cancellation
      if (typeof nameResult === 'symbol') {
        return actionFailure('Operation cancelled');
      }

      // Handle empty input
      if (!nameResult || !nameResult.trim()) {
        await p.note('Alias name cannot be empty');
        continue;
      }

      name = nameResult.trim();
      const exists = await aliasExists(name);
      if (exists) {
        // warn and let user try again
        await p.note(
          `Alias name '${name}' already exists. Please choose another name.`
        );
        continue;
      }

      break;
    }

    // Persist alias
    await setGitAlias(name, command);
    writeLine(green(`✓ Created alias '${name}'`));

    // Ask user if they want to execute it now
    const runNow = await p.confirm({
      message: `Do you want to run alias '${name}' now?`,
      initialValue: false,
    });

    if (runNow) {
      // Attempt to execute using gitExecutor so stdout/stderr show up as normal
      try {
        const result = await gitExecutor.executeCommand(`git ${name!.trim()}`);
        if (result.stdout) writeLine(result.stdout);
        if (result.stderr) writeLine(result.stderr);
        writeLine(green(`Successfully executed: git ${name!.trim()}`));
      } catch (error) {
        writeErrorLine(
          red(
            `Error executing alias: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        return actionFailure('Created alias but execution failed');
      }
    }

    return actionSuccess('Alias created');
  } catch (error) {
    return actionFailure(
      error instanceof Error ? error.message : String(error)
    );
  }
}

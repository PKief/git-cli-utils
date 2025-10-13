import { GitAlias } from '../../../../core/git/aliases.js';
import { gitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

export async function executeAlias(
  alias: GitAlias
): Promise<ActionResult<GitAlias>> {
  try {
    writeLine();
    writeLine(yellow(`Executing: git ${alias.name}`));
    writeLine();

    const result = await gitExecutor.executeCommand(`git ${alias.name}`);

    if (result.stdout) writeLine(result.stdout);
    if (result.stderr) writeLine(result.stderr);

    writeLine();
    writeLine(green(`Successfully executed: git ${alias.name}`));
    return actionSuccess();
  } catch (error) {
    const message = `Error executing alias '${alias.name}': ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(message));
    return actionFailure(message);
  }
}

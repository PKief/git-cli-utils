import * as p from '@clack/prompts';
import { gitExecutor } from '../../../../core/git/executor.js';
import { GitRemote } from '../../../../core/git/remotes.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Rename a remote
 */
export async function renameRemote(remote: GitRemote): Promise<boolean> {
  try {
    const newName = await p.text({
      message: `Enter new name for remote '${remote.name}':`,
      placeholder: remote.name,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Remote name cannot be empty';
        }
        if (value.includes(' ')) {
          return 'Remote name cannot contain spaces';
        }
        if (value === remote.name) {
          return 'New name must be different from current name';
        }
        return undefined;
      },
    });

    if (p.isCancel(newName)) {
      writeLine(yellow('Rename cancelled.'));
      return false;
    }

    // Execute git remote rename command
    await gitExecutor.executeCommand(
      `git remote rename ${remote.name} ${newName}`
    );

    writeLine(
      green(`Successfully renamed remote '${remote.name}' to '${newName}'`)
    );
    return true;
  } catch (error) {
    throw new Error(
      `Failed to rename remote '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

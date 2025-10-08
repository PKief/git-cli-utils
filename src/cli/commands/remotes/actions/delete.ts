import { GitRemote, gitExecutor } from '../../../../core/git/index.js';
import { green, yellow } from '../../../ui/ansi.js';
import { confirmDeletion } from '../../../utils/prompts.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Delete a remote with confirmation
 */
export async function deleteRemote(remote: GitRemote): Promise<boolean> {
  try {
    const shouldDelete = await confirmDeletion('remote', remote.name);

    if (!shouldDelete) {
      writeLine(yellow('Deletion cancelled.'));
      return false;
    }

    // Execute git remote remove command
    await gitExecutor.executeCommand(`git remote remove ${remote.name}`);

    writeLine(green(`Successfully deleted remote '${remote.name}'`));
    return true;
  } catch (error) {
    throw new Error(
      `Failed to delete remote '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

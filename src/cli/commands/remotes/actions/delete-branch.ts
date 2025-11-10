import * as p from '@clack/prompts';
import { gitExecutor } from '../../../../core/git/executor.js';
import { GitRemoteBranch } from '../../../../core/git/remotes.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Delete a remote branch (with option to also delete locally)
 */
export async function deleteRemoteBranch(
  branch: GitRemoteBranch
): Promise<boolean> {
  try {
    // Extract remote name from fullName (e.g., "origin/main" -> "origin")
    const remoteName = branch.fullName.split('/')[0];

    // Ask user how they want to delete
    const deleteOption = await p.select({
      message: `How do you want to delete branch '${branch.name}'?`,
      options: [
        { value: 'remote', label: 'Delete on remote only' },
        { value: 'both', label: 'Delete on remote and local' },
      ],
      initialValue: 'remote',
    });

    if (p.isCancel(deleteOption)) {
      writeLine(yellow('Deletion cancelled.'));
      return false;
    }

    const deleteLocal = deleteOption === 'both';

    // Delete the remote branch
    writeLine(`Deleting branch '${branch.name}' on remote '${remoteName}'...`);
    try {
      await gitExecutor.executeCommand(
        `git push ${remoteName} --delete ${branch.name}`
      );
      writeLine(
        green(`✓ Deleted remote branch '${branch.name}' on '${remoteName}'`)
      );
    } catch (error) {
      // Remote branch might already be deleted, continue anyway
      writeLine(
        yellow(
          `Remote branch may not exist: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }

    // Delete the local branch if user chose to delete both
    if (deleteLocal) {
      try {
        await gitExecutor.executeCommand(`git branch -D ${branch.name}`);
        writeLine(green(`✓ Deleted local branch '${branch.name}'`));
      } catch {
        // Local branch might not exist, show warning
        writeLine(yellow(`Local branch '${branch.name}' does not exist`));
      }
    }

    // Sync with remote (prune deleted remote-tracking references)
    writeLine(`Syncing with remote '${remoteName}'...`);
    try {
      await gitExecutor.executeCommand(`git fetch ${remoteName} --prune`);
      writeLine(
        green(
          `✓ Synced with remote '${remoteName}' (remote-tracking references pruned)`
        )
      );
    } catch (error) {
      writeErrorLine(
        red(
          `Failed to sync: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }

    writeLine(green(`✓ Successfully deleted branch '${branch.name}'`));
    return true;
  } catch (error) {
    throw new Error(
      `Failed to delete branch '${branch.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

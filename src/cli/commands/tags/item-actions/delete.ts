import * as p from '@clack/prompts';
import { GitExecutor } from '../../../../core/git/executor.js';
import { GitTag } from '../../../../core/git/tags.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { createSpinner } from '../../../utils/spinner.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Delete a git tag (both locally and remotely)
 */
export async function deleteTag(tag: GitTag): Promise<ActionResult<GitTag>> {
  try {
    // Confirm deletion
    const confirmDelete = await p.confirm({
      message: `Are you sure you want to delete tag '${tag.name}'?`,
      initialValue: false,
    });

    if (typeof confirmDelete === 'symbol' || !confirmDelete) {
      return actionFailure('Tag deletion cancelled');
    }

    // Ask if they want to delete from remote as well
    const deleteFromRemote = await p.confirm({
      message: `Also delete '${tag.name}' from remote repositories?`,
      initialValue: false,
    });

    if (typeof deleteFromRemote === 'symbol') {
      return actionFailure('Tag deletion cancelled');
    }

    const executor = GitExecutor.getInstance();

    // Delete local tag
    await executor.executeCommand(`git tag -d "${tag.name}"`);
    writeLine(green(`✓ Deleted local tag '${tag.name}'`));

    // Delete from remote if requested
    if (deleteFromRemote) {
      try {
        // Get list of remotes
        const remotesResult = await executor.executeCommand('git remote');
        const remotes = remotesResult.stdout
          .trim()
          .split('\n')
          .filter((r) => r.trim());

        if (remotes.length === 0) {
          writeLine(yellow('No remotes found - skipping remote deletion'));
        } else {
          // Delete from all remotes
          for (const remote of remotes) {
            const spinner = createSpinner();
            spinner.start(
              `Deleting tag '${tag.name}' from remote '${remote}'...`
            );
            try {
              await executor.executeCommand(
                `git push "${remote}" --delete "${tag.name}"`
              );
              spinner.stop(
                green(`Deleted tag '${tag.name}' from remote '${remote}'`)
              );
            } catch (error) {
              spinner.fail(
                yellow(
                  `Could not delete tag '${tag.name}' from remote '${remote}': ${error instanceof Error ? error.message : String(error)}`
                )
              );
            }
          }
        }
      } catch (error) {
        writeLine(
          yellow(
            `⚠ Warning: Could not delete from remotes: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    return actionSuccess(`Tag '${tag.name}' deleted successfully`);
  } catch (error) {
    const message = `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`;
    writeLine(red(`✗ ${message}`));
    return actionFailure(message);
  }
}

import * as p from '@clack/prompts';
import { GitCommit, getGitCommits } from '../../../../core/git/commits.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { GitTag } from '../../../../core/git/tags.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import { selectionList } from '../../../ui/selection-list/index.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Change a tag to point to a different commit
 */
export async function changeTagCommit(
  tag: GitTag
): Promise<ActionResult<GitTag>> {
  try {
    // Get commits for selection
    writeLine(yellow(`Loading commits for tag '${tag.name}' selection...`));
    const commits = await getGitCommits();

    if (commits.length === 0) {
      return actionFailure('No commits found');
    }

    // Let user select the target commit
    const result = await selectionList<GitCommit>({
      items: commits,
      renderItem: (commit) => {
        const branchInfo = commit.branch ? ` (${commit.branch})` : '';
        return `${commit.date} - ${commit.hash} - ${commit.subject}${branchInfo}`;
      },
      getSearchText: (commit) =>
        `${commit.hash} ${commit.subject} ${commit.branch}`,
      header: yellow(`Select commit to change tag '${tag.name}' to:`),
    });

    if (!result.success || !result.item) {
      return actionFailure('No commit selected');
    }

    const selectedCommit = result.item;
    const trimmedCommit = selectedCommit.hash;

    // Show selected commit info
    writeLine(
      `Selected commit: ${selectedCommit.hash} - ${selectedCommit.subject}`
    );

    // Confirm the change
    const confirmChange = await p.confirm({
      message: `Change tag '${tag.name}' from current position to this commit?`,
      initialValue: false,
    });

    if (typeof confirmChange === 'symbol' || !confirmChange) {
      return actionFailure('Tag change cancelled');
    }

    const executor = GitExecutor.getInstance();

    // The commit is already verified since it came from git log, so we can proceed directly

    // Change the tag (this will overwrite the existing tag)
    await executor.executeCommand(
      `git tag -f "${tag.name}" "${trimmedCommit}"`
    );
    writeLine(
      green(`✓ Changed tag '${tag.name}' to commit '${trimmedCommit}'`)
    );

    // Ask if they want to update the remote
    const updateRemote = await p.confirm({
      message: `Push the updated tag '${tag.name}' to remote repositories?`,
      initialValue: false,
    });

    if (typeof updateRemote === 'symbol') {
      return actionSuccess(`Tag '${tag.name}' changed locally`);
    }

    if (updateRemote) {
      try {
        // Get list of remotes
        const remotesResult = await executor.executeCommand('git remote');
        const remotes = remotesResult.stdout
          .trim()
          .split('\n')
          .filter((r) => r.trim());

        if (remotes.length === 0) {
          writeLine(red('No remotes found - tag updated locally only'));
        } else {
          // Push to all remotes (force push since we're moving the tag)
          for (const remote of remotes) {
            try {
              await executor.executeCommand(
                `git push "${remote}" "${tag.name}" --force`
              );
              writeLine(
                green(`✓ Updated tag '${tag.name}' on remote '${remote}'`)
              );
            } catch (error) {
              writeLine(
                red(
                  `✗ Could not update tag '${tag.name}' on remote '${remote}': ${error instanceof Error ? error.message : String(error)}`
                )
              );
            }
          }
        }
      } catch (error) {
        writeLine(
          red(
            `Warning: Could not update remotes: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    }

    return actionSuccess(`Tag '${tag.name}' changed successfully`);
  } catch (error) {
    const message = `Failed to change tag: ${error instanceof Error ? error.message : String(error)}`;
    writeLine(red(`✗ ${message}`));
    return actionFailure(message);
  }
}

import { GitCommit, getGitCommits } from '../../../core/git/commits.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import {
  checkoutCommit,
  copyCommitHash,
  showCommitDetails,
} from './actions/index.js';

/**
 * Creates actions available for commit items
 */
function createCommitActions() {
  return createActions([
    {
      key: 'copy',
      label: 'Copy hash',
      description: 'Copy commit hash to clipboard',
      handler: copyCommitHash,
    },
    {
      key: 'show',
      label: 'Show details',
      description: 'Show full commit details and diff',
      handler: showCommitDetails,
    },
    {
      key: 'checkout',
      label: 'Checkout commit',
      description: 'Checkout this specific commit (detached HEAD)',
      handler: checkoutCommit,
    },
  ]);
}

export const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      writeLine(yellow('No commits found!'));
      process.exit(0);
    }

    try {
      const selectedCommit = await interactiveList<GitCommit>(
        commits,
        (commit: GitCommit) =>
          `${commit.date} - ${commit.subject} (${commit.hash})`,
        (commit: GitCommit) => `${commit.subject} ${commit.hash}`, // Search both subject and hash
        undefined, // No header
        createCommitActions() // Actions
      );

      if (selectedCommit) {
        writeLine();
        writeLine(`Selected commit: ${selectedCommit.hash}`);
        // Action has already been executed by the interactive list
        process.exit(0);
      } else {
        writeLine(yellow('No commit selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        process.exit(0);
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeErrorLine(
      `Error fetching commits: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

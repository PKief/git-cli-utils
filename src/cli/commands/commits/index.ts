import { Command } from 'commander';
import { GitCommit, getGitCommits } from '../../../core/git/commits.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { checkoutCommitInWorktree } from '../../utils/worktree-actions.js';
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
      label: 'Copy',
      description: 'Copy hash to clipboard',
      handler: copyCommitHash,
    },
    {
      key: 'show',
      label: 'Details',
      description: 'Show details and diff',
      handler: showCommitDetails,
    },
    {
      key: 'checkout',
      label: 'Checkout',
      description: 'Checkout (detached HEAD)',
      handler: checkoutCommit,
    },
    {
      key: 'worktree',
      label: 'Open in editor',
      description: 'Open commit in worktree (create if needed)',
      handler: checkoutCommitInWorktree,
    },
  ]);
}

const searchCommits = async () => {
  try {
    const commits = await getGitCommits();

    if (commits.length === 0) {
      writeLine(yellow('No commits found!'));
      process.exit(0);
    }

    try {
      const selectedCommit = await interactiveList<GitCommit>(
        commits,
        (commit: GitCommit) => {
          const tagInfo =
            commit.tags.length > 0 ? ` [${commit.tags.join(', ')}]` : '';
          return `${commit.date} - ${commit.subject}${tagInfo} (${commit.hash})`;
        },
        (commit: GitCommit) =>
          `${commit.subject} ${commit.hash} ${commit.tags.join(' ')}`, // Search subject, hash, and tags
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

/**
 * Register commits command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'commits',
    description: 'Interactive commit selection with fuzzy search',
    action: searchCommits,
  });
}

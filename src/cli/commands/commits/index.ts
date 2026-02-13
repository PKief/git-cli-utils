import { Command } from 'commander';
import {
  GitCommit,
  getGitCommits,
  getReflogCommits,
} from '../../../core/git/commits.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import { createItemActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { AppError } from '../../utils/exit.js';
import { writeLine } from '../../utils/terminal.js';
import { checkoutCommitInWorktree } from '../../utils/worktree-actions.js';
import {
  checkoutCommit,
  copyCommitHash,
  showCommitDetails,
} from './actions/index.js';
import {
  type CommitSearchOptions,
  getCommitGlobalActions,
  setSearchCallback,
} from './global-actions/index.js';

/**
 * Creates actions available for commit items
 */
function createCommitActions() {
  return createItemActions([
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy hash to clipboard',
      handler: copyCommitHash,
      exitAfterExecution: true,
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

/**
 * Search commits with configurable options
 */
export const searchCommits = async (
  options: CommitSearchOptions = {}
): Promise<void | CommandResult> => {
  const { filePath, showAll = false, reflog = false } = options;

  try {
    const commits = reflog
      ? await getReflogCommits()
      : await getGitCommits(filePath, showAll);

    if (commits.length === 0) {
      const message = reflog
        ? 'No reflog entries found!'
        : filePath
          ? `No commits found for file: ${filePath}`
          : 'No commits found!';
      writeLine(yellow(message));
      return;
    }

    const header = reflog
      ? yellow('Select a reflog entry:')
      : filePath
        ? yellow(`Select a commit that modified: ${filePath}`)
        : showAll
          ? yellow('Select a commit from all branches:')
          : yellow('Select a commit from current branch:');

    const result = await selectionList<GitCommit>({
      items: commits,
      renderItem: (commit) => {
        const tagInfo =
          commit.tags.length > 0 ? ` [${commit.tags.join(', ')}]` : '';
        return `${commit.date} - ${commit.subject}${tagInfo} (${commit.hash})`;
      },
      getSearchText: (commit) =>
        `${commit.subject} ${commit.hash} ${commit.tags.join(' ')}`,
      header,
      actions: createCommitActions(),
      allowBack: true,
    });

    if (result.back) {
      return { back: true };
    }

    if (result.success && result.item) {
      writeLine();
      writeLine(`Selected commit: ${result.item.hash}`);
    } else {
      writeLine(yellow('No commit selected.'));
    }
  } catch (error) {
    throw AppError.fromError(error, 'Failed to fetch commits');
  }
};

// Register callback for global actions to use
setSearchCallback(async (options) => {
  await searchCommits(options);
  return true;
});

/**
 * Register commits command with the CLI program
 * Uses unified actions - CLI options auto-generated from globalActions
 */
export function registerCommand(program: Command): CommandModule {
  // Wrap searchCommits to match expected signature
  const action = async (): Promise<void | CommandResult> => {
    return searchCommits();
  };

  return createCommand(program, {
    name: 'commits',
    description: 'Interactive commit selection with fuzzy search',
    action,
    globalActions: getCommitGlobalActions(),
  });
}

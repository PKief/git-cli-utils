import { Command } from 'commander';
import { GitCommit, getGitCommits } from '../../../core/git/commits.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import { createItemActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
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
  return createItemActions([
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

const searchCommits = async (
  filePath?: string,
  showAll = false
): Promise<void | CommandResult> => {
  try {
    const commits = await getGitCommits(filePath, showAll);

    if (commits.length === 0) {
      const message = filePath
        ? `No commits found for file: ${filePath}`
        : 'No commits found!';
      writeLine(yellow(message));
      return;
    }

    try {
      const header = filePath
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
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Selection cancelled.'));
        return;
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
  const commitsCommand = async (...args: unknown[]) => {
    // Commander.js passes: [argument1, options, command]
    // When argument is not provided, it's undefined
    const filePath =
      typeof args[0] === 'string' && args[0] ? args[0] : undefined;
    // Options is always at index 1 (after the optional argument)
    const options = args[1] as { all?: boolean };
    const showAll = options?.all ?? false;
    return searchCommits(filePath, showAll);
  };

  // Wrap action for Commander.js compatibility (strip CommandResult)
  const wrappedAction = async (...args: unknown[]): Promise<void> => {
    await commitsCommand(...args);
  };

  // Register the command with Commander
  const _cmd = program
    .command('commits')
    .description('Browse and select commits from current branch')
    .argument('[file]', 'file path to filter commits (optional)')
    .option('--all', 'show commits from all branches')
    .action(wrappedAction);

  // Return the CommandModule format for the command selector
  return {
    name: 'commits',
    description: 'Browse and select commits from current branch',
    action: commitsCommand,
    argument: {
      name: '[file]',
      description: 'file path to filter commits (optional)',
    },
  };
}

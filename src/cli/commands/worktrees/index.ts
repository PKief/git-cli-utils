import { Command } from 'commander';
import { GitWorktree, getGitWorktrees } from '../../../core/git/worktrees.js';
import { yellow } from '../../ui/ansi.js';
import type { CommandResult } from '../../ui/command-selector.js';
import { selectionList } from '../../ui/selection-list/index.js';
import { createItemActions } from '../../utils/action-helpers.js';
import type { CommandModule } from '../../utils/command-registration.js';
import { createCommand } from '../../utils/command-registration.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import {
  openWorktreeInEditor,
  removeWorktree,
  showWorktreeInfo,
} from './actions/index.js';

/**
 * Creates actions available for worktree items
 */
function createWorktreeActions() {
  return createItemActions([
    {
      key: 'open',
      label: 'Open',
      description: 'Open this worktree in configured editor',
      handler: openWorktreeInEditor,
    },
    {
      key: 'info',
      label: 'Show info',
      description: 'Display worktree details',
      handler: showWorktreeInfo,
    },
    {
      key: 'remove',
      label: 'Remove',
      description: 'Remove this worktree (commits are preserved)',
      handler: removeWorktree,
    },
  ]);
}

/**
 * Format worktree display string
 */
function formatWorktreeDisplay(worktree: GitWorktree): string {
  const isMainIndicator = worktree.isMain ? ' (main)' : '';
  const branchInfo = worktree.branch || 'detached';
  return `${branchInfo} - ${worktree.path}${isMainIndicator}`;
}

/**
 * Main worktrees management command
 */
const manageWorktrees = async (): Promise<void | CommandResult> => {
  try {
    const worktrees = await getGitWorktrees();

    if (worktrees.length === 0) {
      writeLine(yellow('No additional worktrees found.'));
      writeLine('Create additional worktrees to see management options.');
      writeLine('You can create worktrees using:');
      writeLine(
        '  - git-utils branches → select branch → "Checkout in worktree"'
      );
      writeLine(
        '  - git-utils commits → select commit → "Checkout in worktree"'
      );
      writeLine(
        '  - git-utils remotes → show branches → "Checkout in worktree"'
      );
      return;
    }

    try {
      const result = await selectionList<GitWorktree>({
        items: worktrees,
        renderItem: formatWorktreeDisplay,
        getSearchText: (worktree) => `${worktree.branch} ${worktree.path}`,
        header: yellow('Select a worktree:'),
        actions: createWorktreeActions(),
        allowBack: true,
      });

      if (result.back) {
        return { back: true };
      }

      if (!result.success) {
        writeLine(yellow('No worktree selected.'));
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Worktree selection cancelled.'));
        return;
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeErrorLine(
      `Error managing worktrees: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

/**
 * Register worktrees command with the CLI program
 */
export function registerCommand(program: Command): CommandModule {
  return createCommand(program, {
    name: 'worktrees',
    description: 'Interactive worktree management with actions',
    action: manageWorktrees,
  });
}

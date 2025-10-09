import { Command } from 'commander';
import { GitWorktree, getGitWorktrees } from '../../../core/git/worktrees.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
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
  return createActions([
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
const manageWorktrees = async () => {
  try {
    const worktrees = await getGitWorktrees();

    if (worktrees.length === 0) {
      writeLine(yellow('No worktrees found!'));
      writeLine('You can create worktrees using:');
      writeLine(
        '  • git-utils branches → select branch → "Checkout in worktree"'
      );
      writeLine(
        '  • git-utils commits → select commit → "Checkout in worktree"'
      );
      writeLine(
        '  • git-utils remotes → show branches → "Checkout in worktree"'
      );
      process.exit(0);
    }

    if (worktrees.length === 1) {
      writeLine(yellow('Only main worktree exists.'));
      writeLine('Create additional worktrees to see management options.');
      writeLine('You can create worktrees using:');
      writeLine(
        '  • git-utils branches → select branch → "Checkout in worktree"'
      );
      writeLine(
        '  • git-utils commits → select commit → "Checkout in worktree"'
      );
      writeLine(
        '  • git-utils remotes → show branches → "Checkout in worktree"'
      );
      process.exit(0);
    }

    try {
      const selectedWorktree = await interactiveList<GitWorktree>(
        worktrees,
        formatWorktreeDisplay,
        (worktree: GitWorktree) => `${worktree.branch} ${worktree.path}`, // Search both branch and path
        yellow('Select a worktree:'),
        createWorktreeActions()
      );

      if (selectedWorktree) {
        // Action has already been executed by the interactive list
        process.exit(0);
      } else {
        writeLine(yellow('No worktree selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Worktree selection cancelled.'));
        process.exit(0);
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

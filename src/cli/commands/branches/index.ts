import { GitBranch, getGitBranches } from '../../../core/git/branches.js';
import { yellow } from '../../ui/ansi.js';
import { interactiveList } from '../../ui/interactive-list.js';
import { createActions } from '../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../utils/terminal.js';
import { checkoutBranchInWorktree } from '../../utils/worktree-actions.js';
import {
  checkoutBranch,
  copyBranchName,
  createBranchFrom,
  deleteBranch,
} from './actions/index.js';

/**
 * Creates actions available for branch items
 */
function createBranchActions() {
  return createActions([
    {
      key: 'checkout',
      label: 'Switch',
      description: 'Switch to branch',
      handler: checkoutBranch,
    },
    {
      key: 'worktree',
      label: 'Open in editor',
      description: 'Open branch in worktree (create if needed)',
      handler: checkoutBranchInWorktree,
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy to clipboard',
      handler: copyBranchName,
    },
    {
      key: 'create',
      label: 'Create new branch from',
      description: 'Create new branch based on selected',
      handler: createBranchFrom,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete branch',
      handler: deleteBranch,
    },
  ]);
}

export const searchBranches = async () => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      writeLine(yellow('No branches found!'));
      process.exit(0);
    }

    try {
      const selectedBranch = await interactiveList<GitBranch>(
        branches,
        (branch: GitBranch) =>
          `${branch.date} - ${branch.name}${branch.current ? ' (current)' : ''}`,
        (branch: GitBranch) => branch.name, // Only search branch names, not dates
        undefined, // No header
        createBranchActions() // Actions
      );

      if (selectedBranch) {
        // Action has already been executed by the interactive list
        // and provided its own success message
        process.exit(0);
      } else {
        writeLine(yellow('No branch selected.'));
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
      `Error fetching branches: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
};

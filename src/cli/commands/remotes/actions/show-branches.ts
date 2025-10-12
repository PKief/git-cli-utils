import {
  GitRemote,
  GitRemoteBranch,
  getRemoteBranches,
} from '../../../../core/git/index.js';
import { yellow } from '../../../ui/ansi.js';
import { interactiveList } from '../../../ui/interactive-list.js';
import { createActions } from '../../../utils/action-helpers.js';
import { compareBranches } from '../../../utils/compare-branches.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';
import { checkoutRemoteBranchInWorktree } from '../../../utils/worktree-actions.js';
import { checkoutRemoteBranch } from './checkout-branch.js';
import { resetToRemoteBranch } from './reset-to-remote.js';
import { setAsUpstream } from './set-as-upstream.js';

/**
 * Creates actions available for branch items from a remote
 */
function createBranchActions() {
  return createActions([
    {
      key: 'checkout',
      label: 'Checkout',
      description: 'Checkout this branch',
      handler: checkoutRemoteBranch,
    },
    {
      key: 'compare',
      label: 'Compare with current',
      description: 'Compare selected branch with currently checked out branch',
      handler: compareBranches,
    },
    {
      key: 'worktree',
      label: 'Open in editor',
      description: 'Open branch in worktree (create if needed)',
      handler: checkoutRemoteBranchInWorktree,
    },
    {
      key: 'set-upstream',
      label: 'Set as upstream',
      description: 'Set this branch as upstream for current branch',
      handler: setAsUpstream,
    },
    {
      key: 'reset',
      label: 'Reset current branch',
      description:
        'Reset current branch to match this remote branch (hard reset)',
      handler: resetToRemoteBranch,
    },
  ]);
}

/**
 * Show branches from a selected remote with actions
 */
export async function showRemoteBranches(remote: GitRemote): Promise<boolean> {
  try {
    writeLine(`Fetching branches from remote '${remote.name}'...`);

    const branches = await getRemoteBranches(remote.name);

    if (branches.length === 0) {
      writeLine(yellow(`No branches found on remote '${remote.name}'!`));
      return true;
    }

    try {
      const selectedBranch = await interactiveList<GitRemoteBranch>(
        branches,
        (branch: GitRemoteBranch) => {
          const relativeDate = branch.lastCommitDate || 'unknown';
          return `${relativeDate} - ${branch.name} (${branch.lastCommit})`;
        },
        (branch: GitRemoteBranch) => branch.name,
        yellow(`Select a branch from '${remote.name}':`),
        createBranchActions()
      );

      if (selectedBranch) {
        // Action has already been executed by the interactive list
        return true;
      } else {
        writeLine(yellow('No branch selected.'));
        return true;
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine(yellow('Branch selection cancelled.'));
        return true;
      }
      throw error;
    }
  } catch (error) {
    writeErrorLine(
      `Error fetching branches from remote '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

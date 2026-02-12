import {
  GitRemote,
  GitRemoteBranch,
  getRemoteBranches,
} from '../../../../core/git/remotes.js';
import { yellow } from '../../../ui/ansi.js';
import { selectionList } from '../../../ui/selection-list/index.js';
import { createItemActions } from '../../../utils/action-helpers.js';
import { compareBranches } from '../../../utils/compare-branches.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';
import { checkoutRemoteBranchInWorktree } from '../../../utils/worktree-actions.js';
import { checkoutRemoteBranch } from './checkout-branch.js';
import { deleteRemoteBranch } from './delete-branch.js';
import { resetToRemoteBranch } from './reset-to-remote.js';
import { setAsUpstream } from './set-as-upstream.js';

/**
 * Creates actions available for branch items from a remote
 */
function createBranchActions() {
  return createItemActions([
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
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete this branch on remote (optionally local too)',
      handler: deleteRemoteBranch,
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

    const result = await selectionList<GitRemoteBranch>({
      items: branches,
      renderItem: (branch) => {
        const relativeDate = branch.lastCommitDate || 'unknown';
        return `${relativeDate} - ${branch.name} (${branch.lastCommit})`;
      },
      getSearchText: (branch) => branch.name,
      header: yellow(`Select a branch from '${remote.name}':`),
      actions: createBranchActions(),
    });

    if (result.success) {
      // Action has already been executed by the selection list
      return true;
    } else {
      writeLine(yellow('No branch selected.'));
      return true;
    }
  } catch (error) {
    writeErrorLine(
      `Error fetching branches from remote '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

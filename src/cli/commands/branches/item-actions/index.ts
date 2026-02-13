/**
 * Item actions for branches command
 * These actions operate on a selected branch
 */

import { createItemActions } from '../../../utils/action-helpers.js';
import { compareBranches } from '../../../utils/compare-branches.js';
import { checkoutBranchInWorktree } from '../../../utils/worktree-actions.js';
import { checkoutBranch } from './checkout.js';
import { copyBranchName } from './copy.js';
import { createBranchFrom } from './create-from.js';
import { deleteBranch } from './delete.js';

/**
 * Get all item actions for the branches command
 */
export function getBranchItemActions() {
  return createItemActions([
    {
      key: 'checkout',
      label: 'Switch',
      description: 'Switch to branch',
      handler: checkoutBranch,
    },
    {
      key: 'copy',
      label: 'Copy name',
      description: 'Copy to clipboard',
      handler: copyBranchName,
      exitAfterExecution: true,
    },
    {
      key: 'compare',
      label: 'Compare with current',
      description: 'Compare selected branch with currently checked out branch',
      handler: compareBranches,
    },
    {
      key: 'create',
      label: 'Create new branch from',
      description: 'Create new branch based on selected',
      handler: createBranchFrom,
    },
    {
      key: 'worktree',
      label: 'Open in editor',
      description: 'Open branch in worktree (create if needed)',
      handler: checkoutBranchInWorktree,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete branch',
      handler: deleteBranch,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { checkoutBranch } from './checkout.js';
export { copyBranchName } from './copy.js';
export { createBranchFrom } from './create-from.js';
export { deleteBranch, forceDeleteBranch } from './delete.js';

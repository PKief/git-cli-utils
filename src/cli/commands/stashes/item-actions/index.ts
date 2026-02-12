/**
 * Item actions for stashes command
 * These actions operate on a selected stash
 */

import { createItemActions } from '../../../utils/action-helpers.js';
import { applyStash } from './apply.js';
import { copyStashReference } from './copy.js';
import { createBranchFromStash } from './create-branch.js';
import { deleteStash } from './delete.js';
import { showStashDetails } from './show.js';

/**
 * Get all item actions for the stashes command
 */
export function getStashItemActions() {
  return createItemActions([
    {
      key: 'show',
      label: 'Show',
      description: 'View stash diff',
      handler: showStashDetails,
    },
    {
      key: 'apply',
      label: 'Apply',
      description: 'Apply to working directory',
      handler: applyStash,
    },
    {
      key: 'branch',
      label: 'Create Branch',
      description: 'Create branch from stash',
      handler: createBranchFromStash,
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy to clipboard',
      handler: copyStashReference,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete stash permanently',
      handler: deleteStash,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { applyStash } from './apply.js';
export { copyStashReference } from './copy.js';
export { createBranchFromStash } from './create-branch.js';
export { deleteStash } from './delete.js';
export { showStashDetails } from './show.js';

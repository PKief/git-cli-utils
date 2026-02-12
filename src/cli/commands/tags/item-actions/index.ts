/**
 * Item actions for tags command
 * These actions operate on a selected tag
 */

import { createItemActions } from '../../../utils/action-helpers.js';
import { checkoutTag } from './checkout.js';
import { copyTagName } from './copy.js';
import { deleteTag } from './delete.js';
import { changeTagCommit } from './move.js';
import { showTagDetails } from './show.js';

/**
 * Get all item actions for the tags command
 */
export function getTagItemActions() {
  return createItemActions([
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy tag name to clipboard',
      handler: copyTagName,
    },
    {
      key: 'show',
      label: 'Details',
      description: 'Show tag details',
      handler: showTagDetails,
    },
    {
      key: 'checkout',
      label: 'Checkout',
      description: 'Checkout tag',
      handler: checkoutTag,
    },
    {
      key: 'change',
      label: 'Change commit',
      description: 'Change tag to point to a different commit',
      handler: changeTagCommit,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete tag (locally and optionally from remotes)',
      handler: deleteTag,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { checkoutTag } from './checkout.js';
export { copyTagName } from './copy.js';
export { deleteTag } from './delete.js';
export { changeTagCommit } from './move.js';
export { showTagDetails } from './show.js';

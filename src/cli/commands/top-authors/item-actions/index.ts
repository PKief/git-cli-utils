/**
 * Item actions for top-authors command
 * These actions operate on a selected author
 */

import { FileAuthor } from '../../../../core/git/authors.js';
import { createItemActions } from '../../../utils/action-helpers.js';
import { copyAuthorName } from './copy.js';
import { showAuthorDetails } from './details.js';

/**
 * Get all item actions for the authors command
 */
export function getAuthorItemActions(filePath?: string) {
  return createItemActions<FileAuthor>([
    {
      key: 'details',
      label: 'Details',
      description: 'Show author details and activity timeline',
      handler: (author) => showAuthorDetails(author, filePath),
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy author name to clipboard',
      handler: copyAuthorName,
      exitAfterExecution: true,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { copyAuthorName } from './copy.js';
export { showAuthorDetails } from './details.js';

/**
 * Global actions for tags command
 * These actions don't require selecting a specific tag first
 */

import { createGlobalActions } from '../../../utils/action-helpers.js';
import { createTag } from './create-tag.js';

/**
 * Get all global actions for the tags command
 */
export function getTagGlobalActions() {
  return createGlobalActions([
    {
      key: 'new',
      label: 'New tag',
      description: 'Create a new tag at HEAD',
      handler: createTag,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { createTag };

/**
 * Global actions for stashes command
 * These actions don't require selecting a specific stash first
 */

import { createGlobalActions } from '../../../utils/action-helpers.js';
import { createStash } from './create-stash.js';

/**
 * Get all global actions for the stashes command
 */
export function getStashGlobalActions() {
  return createGlobalActions([
    {
      key: 'new',
      label: 'New stash',
      description: 'Stash current changes',
      handler: createStash,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { createStash };

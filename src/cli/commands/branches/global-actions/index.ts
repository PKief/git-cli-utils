/**
 * Global actions for branches command
 * These actions don't require selecting a specific branch first
 */

import { createGlobalActions } from '../../../utils/action-helpers.js';
import { createBranch } from './create-branch.js';

/**
 * Get all global actions for the branches command
 */
export function getBranchGlobalActions() {
  return createGlobalActions([
    {
      key: 'new',
      label: 'New branch',
      description: 'Create a new branch from HEAD',
      handler: createBranch,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { createBranch };

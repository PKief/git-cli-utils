/**
 * Global actions for branches command
 * These actions don't require selecting a specific branch first
 */

import {
  createGlobalAction,
  createGlobalActions,
} from '../../../utils/action-helpers.js';
import {
  type CreateBranchArgs,
  createBranch,
  promptForBranchName,
} from './create-branch.js';

/**
 * Get all global actions for the branches command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getBranchGlobalActions() {
  return createGlobalActions([
    createGlobalAction<CreateBranchArgs>({
      key: 'new',
      label: 'New branch',
      description: 'Create a new branch from HEAD',
      cli: {
        option: '--new [name]',
      },
      handler: createBranch,
      promptForArgs: promptForBranchName,
    }),
  ]);
}

// Re-export individual actions for direct use if needed
export { createBranch, promptForBranchName, type CreateBranchArgs };

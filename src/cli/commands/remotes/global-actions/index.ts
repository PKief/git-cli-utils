/**
 * Global actions for remotes command
 * These actions don't require selecting a specific remote first
 */

import { createGlobalActions } from '../../../utils/action-helpers.js';
import { addRemote } from './add-remote.js';

/**
 * Get all global actions for the remotes command
 */
export function getRemoteGlobalActions() {
  return createGlobalActions([
    {
      key: 'add',
      label: 'Add remote',
      description: 'Add a new remote repository',
      handler: addRemote,
    },
  ]);
}

// Re-export individual actions for direct use if needed
export { addRemote };

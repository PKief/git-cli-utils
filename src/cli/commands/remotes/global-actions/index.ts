/**
 * Global actions for remotes command
 * These actions don't require selecting a specific remote first
 */

import {
  createGlobalAction,
  createGlobalActions,
} from '../../../utils/action-helpers.js';
import {
  type AddRemoteArgs,
  addRemote,
  promptForRemoteDetails,
} from './add-remote.js';

/**
 * Get all global actions for the remotes command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getRemoteGlobalActions() {
  return createGlobalActions([
    createGlobalAction<AddRemoteArgs>({
      key: 'add',
      label: 'Add remote',
      description: 'Add a new remote repository',
      cli: {
        option: '--add [name]',
      },
      handler: addRemote,
      promptForArgs: promptForRemoteDetails,
    }),
  ]);
}

// Re-export individual actions for direct use if needed
export { addRemote, promptForRemoteDetails, type AddRemoteArgs };

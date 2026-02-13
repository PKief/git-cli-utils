/**
 * Global actions for stashes command
 * These actions don't require selecting a specific stash first
 */

import {
  createGlobalAction,
  createGlobalActions,
} from '../../../utils/action-helpers.js';
import {
  type CreateStashArgs,
  createStash,
  promptForStashOptions,
} from './create-stash.js';

/**
 * Get all global actions for the stashes command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getStashGlobalActions() {
  return createGlobalActions([
    createGlobalAction<CreateStashArgs>({
      key: 'new',
      label: 'New stash',
      description: 'Stash current changes',
      cli: {
        option: '--new [message]',
      },
      handler: createStash,
      promptForArgs: promptForStashOptions,
    }),
  ]);
}

// Re-export individual actions for direct use if needed
export { createStash, promptForStashOptions, type CreateStashArgs };

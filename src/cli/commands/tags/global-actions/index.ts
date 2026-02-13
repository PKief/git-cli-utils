/**
 * Global actions for tags command
 * These actions don't require selecting a specific tag first
 */

import {
  createGlobalAction,
  createGlobalActions,
} from '../../../utils/action-helpers.js';
import {
  type CreateTagArgs,
  createTag,
  promptForTagName,
} from './create-tag.js';

/**
 * Get all global actions for the tags command
 * Uses unified action pattern - automatically generates CLI options
 */
export function getTagGlobalActions() {
  return createGlobalActions([
    createGlobalAction<CreateTagArgs>({
      key: 'new',
      label: 'New tag',
      description: 'Create a new tag at HEAD',
      cli: {
        option: '--new [name]',
      },
      handler: createTag,
      promptForArgs: promptForTagName,
    }),
  ]);
}

// Re-export individual actions for direct use if needed
export { createTag, promptForTagName, type CreateTagArgs };

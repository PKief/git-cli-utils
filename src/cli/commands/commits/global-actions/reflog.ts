/**
 * Global action: Search reflog entries (includes orphaned commits)
 */

import { createGlobalAction } from '../../../utils/action-helpers.js';
import type { SearchCallback } from './types.js';

export function createReflogAction(searchWithOptions: SearchCallback) {
  return createGlobalAction<void>({
    key: 'reflog',
    label: 'Reflog search',
    description: 'Search reflog entries (includes orphaned commits)',
    cli: {
      option: '--reflog',
    },
    handler: async () => {
      return searchWithOptions({ reflog: true });
    },
  });
}

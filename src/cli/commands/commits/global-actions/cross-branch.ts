/**
 * Global action: Search commits across all branches
 */

import { createGlobalAction } from '../../../utils/action-helpers.js';
import type { SearchCallback } from './types.js';

export function createCrossBranchAction(searchWithOptions: SearchCallback) {
  return createGlobalAction<void>({
    key: 'all',
    label: 'Cross-branch search',
    description: 'Search commits across all branches',
    cli: {
      option: '-a, --all',
    },
    handler: async () => {
      return searchWithOptions({ showAll: true });
    },
  });
}

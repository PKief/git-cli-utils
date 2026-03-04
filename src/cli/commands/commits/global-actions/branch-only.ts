/**
 * Global action: Show commits not in the default branch
 */

import { createGlobalAction } from '../../../utils/action-helpers.js';
import type { SearchCallback } from './types.js';

export function createBranchOnlyAction(searchWithOptions: SearchCallback) {
  return createGlobalAction<void>({
    key: 'branch',
    label: 'Branch only',
    description: 'Show commits not in default branch',
    cli: {
      option: '-b, --branch-only',
    },
    handler: async () => {
      return searchWithOptions({ branchOnly: true });
    },
  });
}

import type { GitBranch } from '../../../../core/git/branches.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy branch name to clipboard action
 */
export const copyBranchName = createCopyAction<GitBranch>({
  getText: (branch) => branch.name,
  successMessage: 'Branch name copied',
});

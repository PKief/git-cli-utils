import type { GitCommit } from '../../../../core/git/commits.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy commit hash to clipboard action
 */
export const copyCommitHash = createCopyAction<GitCommit>({
  getText: (commit) => commit.hash,
  successMessage: 'Hash copied',
});

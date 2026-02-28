import type { GitRemote } from '../../../../core/git/remotes.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy remote name to clipboard
 */
export const copyRemoteName = createCopyAction<GitRemote>({
  getText: (remote) => remote.name,
  successMessage: 'Remote name copied',
});

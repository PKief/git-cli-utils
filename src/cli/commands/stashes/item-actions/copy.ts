import type { GitStash } from '../../../../core/git/stashes.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy stash reference to clipboard action
 */
export const copyStashReference = createCopyAction<GitStash>({
  getText: (stash) => `stash@{${stash.index}}`,
  successMessage: 'Reference copied',
});

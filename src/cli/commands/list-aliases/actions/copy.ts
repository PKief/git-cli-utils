import type { GitAlias } from '../../../../core/git/aliases.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy alias command to clipboard action
 */
export const copyAliasCommand = createCopyAction<GitAlias>({
  getText: (alias) => alias.command,
  successMessage: 'Alias copied',
});

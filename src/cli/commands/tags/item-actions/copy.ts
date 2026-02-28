import type { GitTag } from '../../../../core/git/tags.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy tag name to clipboard action
 */
export const copyTagName = createCopyAction<GitTag>({
  getText: (tag) => tag.name,
  successMessage: 'Tag name copied',
});

import type { FileAuthor } from '../../../../core/git/authors.js';
import { createCopyAction } from '../../../utils/action-helpers.js';

/**
 * Copy author name to clipboard action
 */
export const copyAuthorName = createCopyAction<FileAuthor>({
  getText: (author) => author.name,
  successMessage: 'Author name copied',
});

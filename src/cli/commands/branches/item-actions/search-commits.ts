import { GitBranch } from '../../../../core/git/branches.js';
import { ActionResult, actionSuccess } from '../../../utils/action-helpers.js';
import { searchCommits } from '../../commits/index.js';

/**
 * Search commits on the selected branch
 */
export async function searchBranchCommits(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  await searchCommits({ branch: branch.name });
  return actionSuccess();
}

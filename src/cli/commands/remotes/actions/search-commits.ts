import { GitRemoteBranch } from '../../../../core/git/remotes.js';
import { ActionResult, actionSuccess } from '../../../utils/action-helpers.js';
import { searchCommits } from '../../commits/index.js';

/**
 * Search commits on the selected remote branch
 */
export async function searchRemoteBranchCommits(
  branch: GitRemoteBranch
): Promise<ActionResult<GitRemoteBranch>> {
  await searchCommits({ branch: branch.fullName });
  return actionSuccess();
}

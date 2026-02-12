import { GitBranch } from '../../../../core/git/branches.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionCancelled,
  actionFailure,
  actionSuccess,
  createAction,
} from '../../../utils/action-helpers.js';
import { confirmDeletion } from '../../../utils/prompts.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Regular delete branch action
 */
export async function deleteBranch(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    // Ask for confirmation before deleting
    const confirmed = await confirmDeletion('branch', branch.name);

    if (!confirmed) {
      writeLine(yellow(`Deletion cancelled.`));
      return actionCancelled('Deletion cancelled');
    }

    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git branch -d ${branch.name}`);
    writeLine(green(`✓ Deleted '${branch.name}'`));
    return actionSuccess(`Branch deleted`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    writeErrorLine(red(`✗ Delete failed: ${errorMessage}`));

    // Check if this is a "not fully merged" error that could be force deleted
    if (
      errorMessage.includes('not fully merged') ||
      errorMessage.includes('git branch -D')
    ) {
      // Create a follow-up force delete action
      const forceDeleteAction = createAction({
        key: 'force-delete',
        label: 'Force delete',
        description: 'Force delete (WARNING: loses changes)',
        handler: (item: GitBranch) => forceDeleteBranch(item),
      });

      return actionFailure(
        `Cannot delete '${branch.name}' - not fully merged`,
        forceDeleteAction
      );
    }

    return actionFailure(`Delete failed: ${errorMessage}`);
  }
}

/**
 * Force delete branch action (follow-up action)
 */
export async function forceDeleteBranch(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    // Ask for confirmation with a stronger warning
    const confirmed = await confirmDeletion(
      'branch',
      `${branch.name}" with FORCE (this will permanently lose any unmerged changes)`
    );

    if (!confirmed) {
      writeLine(yellow(`Force deletion cancelled.`));
      return actionCancelled('Force deletion cancelled');
    }

    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git branch -D ${branch.name}`);
    writeLine(green(`✓ Force deleted '${branch.name}'`));
    return actionSuccess(`Branch force deleted`);
  } catch (error) {
    const errorMessage = `Force delete failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

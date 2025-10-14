import * as p from '@clack/prompts';
import { GitBranch } from '../../../../core/git/branches.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red, yellow } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionCancelled,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Create new branch from selected branch action
 */
export async function createBranchFrom(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    const executor = GitExecutor.getInstance();

    // Get list of existing branches for validation
    const existingBranchesResult = await executor.executeStreamingCommand(
      'git branch --format=%(refname:short)'
    );
    const existingBranches = existingBranchesResult.data
      .map((b) => b.trim())
      .filter((b) => b !== '');

    // Generate default branch name with "-copy" suffix
    const defaultBranchName = `${branch.name}-copy`;

    // Prompt for new branch name
    const newBranchName = await p.text({
      message: `Enter name for new branch based on '${branch.name}':`,
      initialValue: defaultBranchName,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Branch name cannot be empty';
        }
        // Basic branch name validation
        if (!/^[a-zA-Z0-9/_.-]+$/.test(value.trim())) {
          return 'Branch name can only contain letters, numbers, slashes, dots, hyphens, and underscores';
        }
        // Check if it's the same as the source branch
        if (value.trim() === branch.name) {
          return 'New branch name cannot be the same as the source branch';
        }
        // Check if branch already exists
        if (existingBranches.includes(value.trim())) {
          return `Branch '${value.trim()}' already exists`;
        }
        return undefined;
      },
    });

    // Check if user cancelled
    if (p.isCancel(newBranchName)) {
      writeLine(yellow(`Branch creation cancelled.`));
      return actionCancelled('Branch creation cancelled');
    }

    // Create and checkout new branch from the selected branch
    await executor.executeCommand(
      `git checkout -b "${newBranchName.trim()}" "${branch.name}"`
    );

    writeLine(
      green(
        `✓ Created and switched to branch '${newBranchName.trim()}' from '${branch.name}'`
      )
    );

    return actionSuccess(`Branch created from '${branch.name}'`);
  } catch (error) {
    const errorMessage = `Create branch failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}

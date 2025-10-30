import { GitOperations } from '../../../../core/git/operations.js';
import { GitRemoteBranch } from '../../../../core/git/remotes.js';
import { green } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Checkout a branch from a remote
 */
export async function checkoutRemoteBranch(
  branch: GitRemoteBranch
): Promise<boolean> {
  try {
    // Checkout the branch
    const result = await GitOperations.checkoutBranch(branch.name);
    // Output the git command result
    const output = result.stdout?.trim() || result.stderr?.trim() || '';
    if (output) {
      writeLine(output);
    }

    writeLine(green(`Successfully checked out branch '${branch.name}'`));
    return true;
  } catch (error) {
    throw new Error(
      `Failed to checkout branch '${branch.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

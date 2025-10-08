import * as p from '@clack/prompts';
import { GitRemote, gitExecutor } from '../../../../core/git/index.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Set a remote as the default upstream for the current branch
 */
export async function setAsDefault(remote: GitRemote): Promise<boolean> {
  try {
    // Get current branch name
    const currentBranchResult = await gitExecutor.executeCommand(
      'git branch --show-current'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (!currentBranch) {
      throw new Error('Could not determine current branch');
    }

    // Get remote branches to choose from
    const remoteBranchesResult = await gitExecutor.executeCommand(
      `git ls-remote --heads ${remote.name}`
    );

    if (!remoteBranchesResult.stdout) {
      writeLine(yellow(`No branches found on remote '${remote.name}'`));
      return false;
    }

    const lines = remoteBranchesResult.stdout
      .split('\n')
      .filter((line) => line.trim());
    const branches = lines
      .map((line) => {
        const parts = line.split('\t');
        if (parts.length === 2) {
          const refName = parts[1];
          return refName.replace('refs/heads/', '');
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (branches.length === 0) {
      writeLine(yellow(`No branches found on remote '${remote.name}'`));
      return false;
    }

    // Ask user to select which remote branch to set as upstream
    const selectedBranch = await p.select({
      message: `Select branch from '${remote.name}' to set as upstream for '${currentBranch}':`,
      options: branches.map((branch) => ({
        value: branch,
        label: branch,
        hint:
          branch === currentBranch ? 'Same name as current branch' : undefined,
      })),
    });

    if (p.isCancel(selectedBranch)) {
      writeLine(yellow('Set as default cancelled.'));
      return false;
    }

    // Execute git branch --set-upstream-to command
    await gitExecutor.executeCommand(
      `git branch --set-upstream-to=${remote.name}/${selectedBranch} ${currentBranch}`
    );

    writeLine(
      green(
        `Successfully set '${remote.name}/${selectedBranch}' as upstream for '${currentBranch}'`
      )
    );
    return true;
  } catch (error) {
    throw new Error(
      `Failed to set '${remote.name}' as default: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

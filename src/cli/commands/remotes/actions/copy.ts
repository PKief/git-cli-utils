import { GitOperations } from '../../../../core/git/operations.js';
import { GitRemote } from '../../../../core/git/remotes.js';

/**
 * Copy remote name to clipboard
 */
export async function copyRemoteName(remote: GitRemote): Promise<boolean> {
  try {
    await GitOperations.copyToClipboard(remote.name);
    return true;
  } catch (error) {
    throw new Error(
      `Failed to copy remote name '${remote.name}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

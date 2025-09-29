import clipboardy from 'clipboardy';
import { gitExecutor } from './executor.js';

/**
 * Git operations utility functions
 */
export class GitOperations {
  /**
   * Checkout a git branch
   */
  static async checkoutBranch(branchName: string): Promise<void> {
    try {
      const result = await gitExecutor.executeCommand(
        `git checkout "${branchName}"`
      );

      // If we reach here, git exited with code 0. Git sometimes writes informational
      // messages to stderr even on success (hints, advice). Treat those as non-fatal.
      if (result.stdout) console.log(result.stdout);
      if (result.stderr) console.log(result.stderr);
      console.log(`Switched to branch '${branchName}'`);
    } catch (error) {
      throw new Error(
        `Failed to checkout branch '${branchName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Copy text to clipboard using clipboardy library for cross-platform support
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      await clipboardy.write(text);
      console.log(`Copied to clipboard: ${text}`);
    } catch (error) {
      throw new Error(
        `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

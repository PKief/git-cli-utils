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

      if (
        result.stderr &&
        !result.stderr.includes('Switched to branch') &&
        !result.stderr.includes('Already on')
      ) {
        throw new Error(result.stderr);
      }

      console.log(`Switched to branch '${branchName}'`);
      if (result.stdout) {
        console.log(result.stdout);
      }
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

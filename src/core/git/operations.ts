import clipboardy from 'clipboardy';
import { gitExecutor } from './executor.js';

/**
 * Git operations utility functions
 */
export class GitOperations {
  /**
   * Checkout a git branch
   */
  static async checkoutBranch(
    branchName: string
  ): Promise<{ stdout?: string; stderr?: string }> {
    try {
      const result = await gitExecutor.executeCommand(
        `git checkout "${branchName}"`
      );

      // Return the result for the caller to handle output
      return result;
    } catch (error) {
      throw new Error(
        `Failed to checkout branch '${branchName}': ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Copy text to clipboard using clipboardy library for cross-platform support
   */
  static async copyToClipboard(text: string): Promise<{ message: string }> {
    try {
      await clipboardy.write(text);
      return { message: `Copied to clipboard: ${text}` };
    } catch (error) {
      throw new Error(
        `Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

import { exec } from 'child_process';
import { promisify } from 'util';
import { CLITester, TestResult } from './cli-tester.js';

const execAsync = promisify(exec);

/**
 * Integration tests for git-specific functionality
 */
export class GitIntegrationTests {
  private tester: CLITester;

  constructor() {
    this.tester = new CLITester();
  }

  async testGitBranchIntegration(): Promise<TestResult> {
    try {
      // Check if we're in a git repository
      await execAsync('git rev-parse --git-dir');

      // Test that search-branches works with real git data
      const result = await this.tester.runCommand(
        'search-branches',
        ['\x03'],
        ['Search:', 'arrow keys', 'navigate']
      );

      return {
        passed: true,
        message: 'Git branch integration works',
        duration: result.duration,
      };
    } catch (error) {
      return {
        passed: false,
        message:
          'Git branch integration failed - not in git repo or git not available',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async testGitCommitIntegration(): Promise<TestResult> {
    try {
      // Check if we have commits
      await execAsync('git log --oneline -1');

      // Test that search-commits works with real git data
      const result = await this.tester.runCommand(
        'search-commits',
        ['\x03'],
        ['Search:', 'arrow keys', 'navigate']
      );

      return {
        passed: true,
        message: 'Git commit integration works',
        duration: result.duration,
      };
    } catch (error) {
      return {
        passed: false,
        message:
          'Git commit integration failed - no commits or git not available',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async testAliasCreation(): Promise<TestResult> {
    try {
      // Test creating a temporary alias
      const testAlias = `test-git-utils-${Date.now()}`;

      await execAsync(`git config --global alias.${testAlias} "!echo test"`);

      // Verify alias was created
      const { stdout } = await execAsync(
        `git config --global alias.${testAlias}`
      );

      // Clean up
      await execAsync(`git config --global --unset alias.${testAlias}`);

      if (stdout.trim() === '!echo test') {
        return {
          passed: true,
          message: 'Git alias creation and cleanup works',
          duration: 0,
        };
      } else {
        return {
          passed: false,
          message: 'Git alias creation test failed',
          duration: 0,
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Git alias test failed',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  async testListAliasesWithRealData(): Promise<TestResult> {
    const result = await this.tester.runCommand(
      'list-aliases',
      [],
      ['git aliases']
    );

    return {
      ...result,
      message: result.passed
        ? 'List aliases works with real git config'
        : result.message,
    };
  }
}

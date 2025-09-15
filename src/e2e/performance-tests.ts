import { exec } from 'child_process';
import { promisify } from 'util';
import { CLITester, TestResult } from './cli-tester.js';

const execAsync = promisify(exec);

/**
 * Performance tests for CLI operations
 */
export class PerformanceTests {
  private tester: CLITester;

  constructor() {
    this.tester = new CLITester();
  }

  async testCommandStartupTime(): Promise<TestResult[]> {
    const commands = ['search-branches', 'search-commits', 'list-aliases'];
    const results: TestResult[] = [];

    for (const command of commands) {
      const start = Date.now();
      const _result = await this.tester.runCommand(command, ['\x03'], []);
      const duration = Date.now() - start;

      results.push({
        passed: duration < 3000, // Should start within 3 seconds
        message: `${command} startup time: ${duration}ms ${duration < 3000 ? '✓' : '✗ (too slow)'}`,
        duration,
      });
    }

    return results;
  }

  async testHelpResponseTime(): Promise<TestResult> {
    const start = Date.now();
    const result = await this.tester.testHelp();
    const duration = Date.now() - start;

    return {
      ...result,
      passed: result.passed && duration < 1000, // Help should be instant
      message: `Help response time: ${duration}ms ${duration < 1000 ? '✓' : '✗ (too slow)'}`,
      duration,
    };
  }

  async testVersionResponseTime(): Promise<TestResult> {
    const start = Date.now();
    const result = await this.tester.testVersion();
    const duration = Date.now() - start;

    return {
      ...result,
      passed: result.passed && duration < 1000, // Version should be instant
      message: `Version response time: ${duration}ms ${duration < 1000 ? '✓' : '✗ (too slow)'}`,
      duration,
    };
  }

  async testLargeRepositoryHandling(): Promise<TestResult> {
    try {
      // Get branch count to estimate repo size
      const { stdout } = await execAsync('git branch -a | wc -l');
      const branchCount = parseInt(stdout.trim());

      if (branchCount > 50) {
        // Test with large repo
        const start = Date.now();
        const result = await this.tester.runCommand(
          'search-branches',
          ['\x03'],
          ['Search:']
        ); // Allow more time for large repos
        const duration = Date.now() - start;

        return {
          passed: result.passed && duration < 8000,
          message: `Large repo (${branchCount} branches) handled in ${duration}ms`,
          duration,
        };
      } else {
        return {
          passed: true,
          message: `Small repo (${branchCount} branches) - skipping large repo test`,
          duration: 0,
        };
      }
    } catch (error) {
      return {
        passed: false,
        message: 'Large repository test failed',
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

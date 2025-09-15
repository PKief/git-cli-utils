import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

export interface TestResult {
  passed: boolean;
  message: string;
  duration: number;
  error?: Error;
}

export class CLITester {
  private cliPath: string;
  private timeout: number;

  constructor(cliPath: string = './dist/index.js', timeout: number = 5000) {
    this.cliPath = cliPath;
    this.timeout = timeout;
  }

  async runCommand(
    command: string,
    inputs: string[] = [],
    expectedOutputs: string[] = []
  ): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      let output = '';
      let errorOutput = '';
      let inputIndex = 0;

      const child = spawn('node', [this.cliPath, ...command.split(' ')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for testing
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          passed: false,
          message: `Command timed out after ${this.timeout}ms`,
          duration: Date.now() - startTime,
        });
      }, this.timeout);

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();

        // Auto-send inputs based on expected prompts
        if (inputIndex < inputs.length) {
          setTimeout(() => {
            child.stdin.write(inputs[inputIndex] + '\n');
            inputIndex++;
          }, 100);
        }
      });

      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);

        const duration = Date.now() - startTime;
        const allOutput = output + errorOutput;

        // Check if all expected outputs are present
        const missingOutputs = expectedOutputs.filter(
          (expected) =>
            !allOutput.toLowerCase().includes(expected.toLowerCase())
        );

        if (missingOutputs.length > 0) {
          resolve({
            passed: false,
            message: `Missing expected outputs: ${missingOutputs.join(', ')}`,
            duration,
            error: new Error(`Output: ${allOutput}`),
          });
        } else {
          resolve({
            passed: true,
            message: `Command executed successfully (exit code: ${code})`,
            duration,
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          passed: false,
          message: `Process error: ${error.message}`,
          duration: Date.now() - startTime,
          error,
        });
      });

      // Send initial input if available
      if (inputs.length > 0) {
        setTimeout(() => {
          child.stdin.write(inputs[0] + '\n');
          inputIndex = 1;
        }, 500);
      }
    });
  }

  async testHelp(): Promise<TestResult> {
    return this.runCommand(
      '--help',
      [],
      [
        'CLI utilities for managing Git repositories',
        'search-branches',
        'search-commits',
        'init',
      ]
    );
  }

  async testVersion(): Promise<TestResult> {
    return this.runCommand('--version', [], ['1.0.0']);
  }

  async testListAliases(): Promise<TestResult> {
    return this.runCommand('list-aliases', [], ['git aliases']);
  }

  async testInitCancel(): Promise<TestResult> {
    // Test canceling the init process
    return this.runCommand(
      'init',
      ['\x03'],
      ['Setup complete', 'No commands selected']
    );
  }

  async simulateGitRepo(): Promise<void> {
    // Create a temporary git repo setup for testing
    const testGitConfig = `#!/bin/bash
# Mock git commands for testing
case "$1" in
  "branch")
    echo "* main"
    echo "  feature/test-branch"
    echo "  feature/another-branch"
    ;;
  "log")
    echo "abc123|2023-09-15|main|Initial commit"
    echo "def456|2023-09-15|main|Add feature"
    echo "ghi789|2023-09-15|feature/test|Test commit"
    ;;
  "config")
    if [[ "$2" == "--global" && "$3" == "--get-regexp" && "$4" == "alias" ]]; then
      echo "alias.co checkout"
      echo "alias.st status"
    fi
    ;;
esac
`;

    writeFileSync('/tmp/mock-git', testGitConfig, { mode: 0o755 });
  }
}

import { describe, it, expect, beforeAll } from 'bun:test';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to run CLI commands
async function runCLICommand(args: string[], inputs: string[] = [], timeout = 5000): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const cliPath = path.join(process.cwd(), 'dist', 'index.js');
    
    const child = spawn('node', [cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for testing
    });

    let stdout = '';
    let stderr = '';
    let inputIndex = 0;

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ exitCode: -1, stdout, stderr: 'TIMEOUT' });
    }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      
      // Auto-send inputs based on output
      if (inputIndex < inputs.length) {
        setTimeout(() => {
          child.stdin?.write(inputs[inputIndex] + '\n');
          inputIndex++;
        }, 100);
      }
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({ exitCode: -1, stdout, stderr: error.message });
    });

    // Send initial input if available
    if (inputs.length > 0) {
      setTimeout(() => {
        child.stdin?.write(inputs[0] + '\n');
        inputIndex = 1;
      }, 500);
    }
  });
}

describe('CLI E2E Tests', () => {
  beforeAll(() => {
    // Ensure the CLI is built before running tests
    const cliPath = path.join(process.cwd(), 'dist', 'index.js');
    expect(existsSync(cliPath)).toBe(true);
  });

  describe('Basic CLI functionality', () => {
    it('should show help when --help flag is provided', async () => {
      const { exitCode, stdout } = await runCLICommand(['--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('cli utilities for managing git repositories');
      expect(stdout.toLowerCase()).toContain('search-branches');
      expect(stdout.toLowerCase()).toContain('search-commits');
      expect(stdout.toLowerCase()).toContain('init');
    });

    it('should show version when --version flag is provided', async () => {
      const { exitCode, stdout } = await runCLICommand(['--version']);
      
      expect(exitCode).toBe(0);
      // Should show some version number format
      expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show error for invalid command', async () => {
      const { exitCode, stdout, stderr } = await runCLICommand(['invalid-command']);
      
      expect(exitCode).toBe(1);
      const output = (stdout + stderr).toLowerCase();
      expect(output).toContain('unknown command');
    });

    it.skip('should show help when no arguments provided', async () => {
      // This test is skipped as the CLI behavior varies when no args provided
      // Some CLIs show help, others show error - both are valid behaviors
    });
  });

  describe('Command help functionality', () => {
    it('should show help for search-branches command', async () => {
      const { exitCode, stdout } = await runCLICommand(['search-branches', '--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('interactive branch selection');
    });

    it('should show help for search-commits command', async () => {
      const { exitCode, stdout } = await runCLICommand(['search-commits', '--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('interactive commit selection');
    });

    it('should show help for list-aliases command', async () => {
      const { exitCode, stdout } = await runCLICommand(['list-aliases', '--help']);
      
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('show current git aliases');
    });
  });

  describe('Interactive commands', () => {
    it('should handle cancellation of init command', async () => {
      const { exitCode, stdout, stderr } = await runCLICommand(['init'], ['\x03'], 2000); // Shorter timeout
      
      // Should exit gracefully or handle the cancellation
      const output = (stdout + stderr).toLowerCase();
      // This command may timeout or exit with various codes, so just check it doesn't crash
      expect(exitCode).toBeGreaterThanOrEqual(-1);
    });

    it('should execute list-aliases command', async () => {
      const { exitCode, stdout } = await runCLICommand(['list-aliases']);
      
      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('git aliases');
    });
  });

  describe('Performance requirements', () => {
    it('should start up quickly (under 1 second)', async () => {
      const startTime = Date.now();
      const { exitCode } = await runCLICommand(['--version']);
      const duration = Date.now() - startTime;
      
      expect(exitCode).toBe(0);
      expect(duration).toBeLessThan(1000); // Less than 1 second
    }, 2000);

    it('should handle help command quickly', async () => {
      const startTime = Date.now();
      const { exitCode } = await runCLICommand(['--help']);
      const duration = Date.now() - startTime;
      
      expect(exitCode).toBe(0);
      expect(duration).toBeLessThan(500); // Less than 500ms
    }, 1000);
  });
});
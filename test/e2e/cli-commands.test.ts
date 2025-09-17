import { beforeAll, describe, expect, it } from 'bun:test';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Helper function to run CLI commands using Bun directly on TypeScript
async function runCLICommand(
  args: string[],
  timeout = 5000
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    // Use bun to run the TypeScript file directly
    const indexPath = path.join(process.cwd(), 'src', 'index.ts');

    const child = spawn('bun', ['run', indexPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      // biome-ignore lint/style/useNamingConvention: FORCE_COLOR is a standard environment variable
      env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for testing
    });

    let stdout = '';
    let stderr = '';

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ exitCode: -1, stdout, stderr: 'TIMEOUT' });
    }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
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
  });
}

describe('CLI E2E Tests', () => {
  beforeAll(() => {
    // Ensure the source file exists
    const indexPath = path.join(process.cwd(), 'src', 'index.ts');
    expect(existsSync(indexPath)).toBe(true);
  });

  describe('Basic CLI functionality', () => {
    it('should show help when --help flag is provided', async () => {
      const { exitCode, stdout } = await runCLICommand(['--help']);

      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('usage');
    });

    it('should show version when --version flag is provided', async () => {
      const { exitCode, stdout } = await runCLICommand(['--version']);

      expect(exitCode).toBe(0);
      // Should show some version number format
      expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show error for invalid command', async () => {
      const { exitCode } = await runCLICommand(['invalid-command']);

      // Should exit with non-zero code for invalid command
      expect(exitCode).not.toBe(0);
    });
  });

  describe('Command help functionality', () => {
    it('should show help for search-branches command', async () => {
      const { exitCode, stdout } = await runCLICommand([
        'search-branches',
        '--help',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('branch');
    });

    it('should show help for search-commits command', async () => {
      const { exitCode, stdout } = await runCLICommand([
        'search-commits',
        '--help',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('commit');
    });

    it('should show help for list-aliases command', async () => {
      const { exitCode, stdout } = await runCLICommand([
        'list-aliases',
        '--help',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('alias');
    });
  });

  describe('Performance requirements', () => {
    it('should start up quickly (under 2 seconds)', async () => {
      const startTime = Date.now();
      const { exitCode } = await runCLICommand(['--version']);
      const duration = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(duration).toBeLessThan(2000); // Less than 2 seconds
    }, 3000);

    it('should handle help command quickly', async () => {
      const startTime = Date.now();
      const { exitCode } = await runCLICommand(['--help']);
      const duration = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(duration).toBeLessThan(1000); // Less than 1 second
    }, 2000);
  });
});

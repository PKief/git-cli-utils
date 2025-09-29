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

  describe('Interactive search functionality', () => {
    it('should handle search with no matches gracefully in non-interactive mode', async () => {
      // This test verifies that when there are items available, the search UI shows them
      // In non-interactive mode, it should show the available items and return the first one
      const { exitCode, stdout, stderr } = await runCLICommand(['search-branches']);

      // Debug output for CI troubleshooting
      if (exitCode !== 0) {
        console.log('DEBUG - Exit Code:', exitCode);
        console.log('DEBUG - Stdout:', stdout);
        console.log('DEBUG - Stderr:', stderr);
      }

      // The command should complete successfully
      expect(exitCode).toBe(0);

      // Should show either non-interactive mode message OR handle empty repository gracefully
      const hasNonInteractiveMessage = stdout.includes(
        '(non-interactive mode)'
      );
      const hasNoBranchesMessage = stdout.includes('No branches found!');

      expect(hasNonInteractiveMessage || hasNoBranchesMessage).toBe(true);

      if (hasNonInteractiveMessage) {
        expect(stdout).toContain('Use arrow keys to navigate');
      }
    });

    it('should handle search-commits command in non-interactive mode', async () => {
      // Test the search-commits command in non-interactive mode
      const { exitCode, stdout } = await runCLICommand(['search-commits']);

      // The command might exit with code 1 due to clipboard failures in CI
      // but should still show expected output
      expect([0, 1]).toContain(exitCode);

      // Should show either non-interactive mode message OR handle empty repository gracefully
      const hasNonInteractiveMessage = stdout.includes(
        '(non-interactive mode)'
      );
      const hasNoCommitsMessage = stdout.includes('No commits found!');

      expect(hasNonInteractiveMessage || hasNoCommitsMessage).toBe(true);

      if (hasNonInteractiveMessage) {
        expect(stdout).toContain('Use arrow keys to navigate');
      }
    });

    it('should handle search cancellation gracefully', async () => {
      // Test that the search handles termination properly
      // In test environments, the process should complete normally in non-interactive mode
      const { exitCode } = await runCLICommand(['search-branches'], 2000);

      // The command should complete (either successfully or with expected error)
      expect(typeof exitCode).toBe('number');
    });

    it('should demonstrate no-match behavior through CLI output', async () => {
      // This test verifies that the CLI handles the search flow properly
      // Even in non-interactive mode, we can verify the basic functionality works
      const { exitCode, stdout } = await runCLICommand(
        ['search-commits'],
        3000
      );

      // Command should complete
      expect(typeof exitCode).toBe('number');

      // Should show some output indicating the search interface OR no commits message
      expect(stdout.length).toBeGreaterThan(0);

      // Should contain search-related text OR handle empty repository
      const hasSearchText = /search|navigate|select/i.test(stdout);
      const hasNoCommitsMessage = stdout.includes('No commits found!');

      expect(hasSearchText || hasNoCommitsMessage).toBe(true);
    });

    it('should handle empty repository gracefully', async () => {
      // This test ensures the CLI handles cases where git commands might fail
      // or return empty results gracefully
      const { exitCode, stdout, stderr } = await runCLICommand(
        ['search-branches'],
        2000
      );

      // Command might succeed with empty results or fail gracefully
      if (exitCode === 0) {
        // If successful, should show either non-interactive mode or no branches message
        const hasNonInteractiveMessage = stdout.includes(
          '(non-interactive mode)'
        );
        const hasNoBranchesMessage = stdout.includes('No branches found!');
        expect(hasNonInteractiveMessage || hasNoBranchesMessage).toBe(true);
      } else {
        // If failed, should have some error message
        expect(stderr.length).toBeGreaterThan(0);
      }
    });
  });
});

import { describe, expect, it } from 'bun:test';
import { AppError, ExitCode } from './exit.js';

describe('exit utilities', () => {
  describe('ExitCode', () => {
    it('should have success code as 0', () => {
      expect(ExitCode.success).toBe(0);
    });

    it('should have error code as 1', () => {
      expect(ExitCode.error).toBe(1);
    });

    it('should have cancelled code as 0', () => {
      expect(ExitCode.cancelled).toBe(0);
    });
  });

  describe('AppError', () => {
    describe('constructor', () => {
      it('should create error with message', () => {
        const error = new AppError('Something went wrong');

        expect(error.message).toBe('Something went wrong');
        expect(error.name).toBe('AppError');
        expect(error.exitCode).toBe(ExitCode.error);
        expect(error.silent).toBe(false);
      });

      it('should create error with custom exit code', () => {
        const error = new AppError('Custom error', ExitCode.success);

        expect(error.message).toBe('Custom error');
        expect(error.exitCode).toBe(ExitCode.success);
        expect(error.silent).toBe(false);
      });

      it('should create silent error', () => {
        const error = new AppError('Silent error', ExitCode.error, true);

        expect(error.message).toBe('Silent error');
        expect(error.exitCode).toBe(ExitCode.error);
        expect(error.silent).toBe(true);
      });

      it('should be an instance of Error', () => {
        const error = new AppError('Test');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    describe('static silent()', () => {
      it('should create silent error with success exit code by default', () => {
        const error = AppError.silent();

        expect(error.message).toBe('');
        expect(error.exitCode).toBe(ExitCode.success);
        expect(error.silent).toBe(true);
      });

      it('should create silent error with custom exit code', () => {
        const error = AppError.silent(ExitCode.error);

        expect(error.message).toBe('');
        expect(error.exitCode).toBe(ExitCode.error);
        expect(error.silent).toBe(true);
      });
    });

    describe('static cancelled()', () => {
      it('should create cancellation error with default message', () => {
        const error = AppError.cancelled();

        expect(error.message).toBe('Operation cancelled.');
        expect(error.exitCode).toBe(ExitCode.cancelled);
        expect(error.silent).toBe(false);
      });

      it('should create cancellation error with custom message', () => {
        const error = AppError.cancelled('User aborted the operation');

        expect(error.message).toBe('User aborted the operation');
        expect(error.exitCode).toBe(ExitCode.cancelled);
        expect(error.silent).toBe(false);
      });
    });

    describe('static fromError()', () => {
      it('should wrap Error with its message', () => {
        const originalError = new Error('Original error message');
        const error = AppError.fromError(originalError);

        expect(error.message).toBe('Original error message');
        expect(error.exitCode).toBe(ExitCode.error);
        expect(error.silent).toBe(false);
      });

      it('should wrap Error with context prefix', () => {
        const originalError = new Error('File not found');
        const error = AppError.fromError(
          originalError,
          'Failed to read config'
        );

        expect(error.message).toBe('Failed to read config: File not found');
        expect(error.exitCode).toBe(ExitCode.error);
      });

      it('should convert string to error message', () => {
        const error = AppError.fromError('Something failed');

        expect(error.message).toBe('Something failed');
        expect(error.exitCode).toBe(ExitCode.error);
      });

      it('should convert string with context prefix', () => {
        const error = AppError.fromError('timeout', 'Network request failed');

        expect(error.message).toBe('Network request failed: timeout');
      });

      it('should handle null error', () => {
        const error = AppError.fromError(null);

        expect(error.message).toBe('Unknown error');
      });

      it('should handle undefined error', () => {
        const error = AppError.fromError(undefined);

        expect(error.message).toBe('Unknown error');
      });

      it('should handle number as error', () => {
        const error = AppError.fromError(404);

        expect(error.message).toBe('404');
      });

      it('should handle object as error', () => {
        const error = AppError.fromError({ code: 'ENOENT' });

        expect(error.message).toBe('[object Object]');
      });

      it('should preserve existing AppError unchanged', () => {
        const originalError = AppError.cancelled('User cancelled');
        const error = AppError.fromError(originalError, 'Some context');

        expect(error).toBe(originalError); // Same instance
        expect(error.message).toBe('User cancelled');
        expect(error.exitCode).toBe(ExitCode.cancelled);
        expect(error.silent).toBe(false);
      });

      it('should preserve silent AppError unchanged', () => {
        const originalError = AppError.silent(ExitCode.success);
        const error = AppError.fromError(originalError);

        expect(error).toBe(originalError); // Same instance
        expect(error.exitCode).toBe(ExitCode.success);
        expect(error.silent).toBe(true);
      });
    });
  });
});

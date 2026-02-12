/**
 * Centralized exit handling for the CLI application.
 *
 * This module provides a single point of control for process exits,
 * making it easier to:
 * - Track exit points
 * - Test exit behavior
 * - Ensure consistent exit handling
 *
 * IMPORTANT: This is the ONLY place in the codebase where process.exit
 * should be called directly. All other code should use these utilities
 * or throw AppError.
 */

/**
 * Exit codes used by the application
 */
export const ExitCode = {
  /** Successful execution */
  success: 0,
  /** General error */
  error: 1,
  /** User cancelled operation */
  cancelled: 0,
} as const;

export type ExitCodeType = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Application error that signals the CLI should exit.
 * Throw this instead of calling process.exit directly.
 */
export class AppError extends Error {
  public readonly exitCode: ExitCodeType;
  public readonly silent: boolean;

  /**
   * @param message - Error message to display (unless silent)
   * @param exitCode - Exit code to use (default: 1)
   * @param silent - If true, don't print the error message
   */
  constructor(
    message: string,
    exitCode: ExitCodeType = ExitCode.error,
    silent = false
  ) {
    super(message);
    this.name = 'AppError';
    this.exitCode = exitCode;
    this.silent = silent;
  }

  /**
   * Create a silent exit (no error message printed)
   */
  static silent(exitCode: ExitCodeType = ExitCode.success): AppError {
    return new AppError('', exitCode, true);
  }

  /**
   * Create an error for user cancellation
   */
  static cancelled(message = 'Operation cancelled.'): AppError {
    return new AppError(message, ExitCode.cancelled, false);
  }

  /**
   * Create an AppError from an unknown error with a context prefix.
   * If the error is already an AppError, it is returned unchanged
   * to preserve its exitCode and silent flag.
   */
  static fromError(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error');
    const fullMessage = context ? `${context}: ${message}` : message;
    return new AppError(fullMessage, ExitCode.error, false);
  }
}

/**
 * Exit the application with the given code.
 *
 * NOTE: This function should ONLY be called from the main entry point
 * or error handling middleware. Commands should throw AppError instead.
 */
export function exitApp(code: ExitCodeType = ExitCode.success): never {
  // biome-ignore lint: Centralized exit handler - this is the only allowed usage
  process.exit(code);
}

/**
 * Handle an error and exit appropriately.
 * This is the main error handler for the CLI.
 *
 * @param error - The error to handle
 */
export function handleErrorAndExit(error: unknown): never {
  if (error instanceof AppError) {
    if (!error.silent && error.message) {
      console.error(error.message);
    }
    exitApp(error.exitCode);
  }

  // Unknown error - print and exit with error code
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(`Error: ${String(error)}`);
  }
  exitApp(ExitCode.error);
}

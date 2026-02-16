import * as p from '@clack/prompts';

/**
 * Spinner instance returned by createSpinner
 */
export interface Spinner {
  /** Start the spinner with an optional message */
  start: (msg?: string) => void;
  /** Stop the spinner with a success message */
  stop: (msg?: string) => void;
  /** Stop the spinner with a failure message */
  fail: (msg?: string) => void;
  /** Update the spinner message */
  message: (msg?: string) => void;
}

/**
 * Create a spinner for long-running operations
 *
 * @example
 * ```ts
 * const spinner = createSpinner();
 * spinner.start('Pulling from remote...');
 * try {
 *   await gitExecutor.executeCommand('git pull');
 *   spinner.stop('Successfully pulled changes');
 * } catch (error) {
 *   spinner.fail('Failed to pull changes');
 * }
 * ```
 */
export function createSpinner(): Spinner {
  const s = p.spinner();

  return {
    start: (msg?: string) => s.start(msg),
    stop: (msg?: string) => s.stop(msg, 0),
    fail: (msg?: string) => s.stop(msg, 1),
    message: (msg?: string) => s.message(msg),
  };
}

/**
 * Run an async operation with a spinner
 *
 * @param options - Options for the spinner operation
 * @returns The result of the operation
 *
 * @example
 * ```ts
 * const result = await withSpinner({
 *   start: 'Fetching branches...',
 *   success: 'Branches fetched',
 *   failure: 'Failed to fetch branches',
 *   task: () => gitExecutor.executeCommand('git fetch'),
 * });
 * ```
 */
export async function withSpinner<T>(options: {
  /** Message to show while the operation is running */
  start: string;
  /** Message to show on success (optional - uses start message if not provided) */
  success?: string;
  /** Message to show on failure (optional - uses error message if not provided) */
  failure?: string;
  /** The async operation to run */
  task: () => Promise<T>;
}): Promise<T> {
  const spinner = createSpinner();
  spinner.start(options.start);

  try {
    const result = await options.task();
    spinner.stop(options.success ?? options.start);
    return result;
  } catch (error) {
    const errorMsg =
      options.failure ??
      (error instanceof Error ? error.message : String(error));
    spinner.fail(errorMsg);
    throw error;
  }
}

import * as readline from 'readline';

/**
 * Terminal output utilities for consistent stdout handling
 */

/**
 * Utility function to write text to stdout
 */
export function write(text: string): void {
  process.stdout.write(text);
}

/**
 * Utility function to write text to stdout with a newline
 */
export function writeLine(text: string = ''): void {
  process.stdout.write(text + '\n');
}

/**
 * Clear the screen from current cursor position down (preserves command prompt)
 */
export function clearScreen(): void {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

/**
 * Utility function to write error text to stderr
 */
export function writeError(text: string): void {
  process.stderr.write(text);
}

/**
 * Utility function to write error text to stderr with a newline
 */
export function writeErrorLine(text: string = ''): void {
  process.stderr.write(text + '\n');
}

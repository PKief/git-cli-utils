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
 * Clear the entire screen and move cursor to top-left corner
 */
export function clearScreen(): void {
  write('\u001b[2J\u001b[0;0H');
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

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  reverse: '\x1b[7m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  black: '\x1b[30m',
  gray: '\x1b[90m', // Bright black / dark gray
  blue: '\x1b[34m', // Blue
  brightWhite: '\x1b[97m',
  bgWhite: '\x1b[47m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgMagenta: '\x1b[45m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
};

// Helper functions for colored text
export const colorText = (text: string, color: keyof typeof ANSI): string => {
  return `${ANSI[color]}${text}${ANSI.reset}`;
};

// Multi-color combination helper
export const multiColor = (
  text: string,
  ...colors: (keyof typeof ANSI)[]
): string => {
  const colorCodes = colors.map((color) => ANSI[color]).join('');
  return `${colorCodes}${text}${ANSI.reset}`;
};

// Common single-color helpers
export const yellow = (text: string): string => colorText(text, 'yellow');
export const green = (text: string): string => colorText(text, 'green');
export const red = (text: string): string => colorText(text, 'red');
export const bold = (text: string): string => colorText(text, 'bold');
export const gray = (text: string): string => colorText(text, 'gray');
export const blue = (text: string): string => colorText(text, 'blue');

// Complex highlighting helpers for interactive list
export const highlightExact = (text: string): string =>
  multiColor(text, 'bgMagenta', 'brightWhite', 'bold');

export const highlightFuzzy = (text: string): string =>
  multiColor(text, 'bgCyan', 'brightWhite', 'bold');

export const highlightSelected = (text: string): string =>
  multiColor(text, 'bgGreen', 'brightWhite', 'bold');

export default ANSI;

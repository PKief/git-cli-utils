import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline';

/**
 * Paged display utility similar to Unix 'less' command
 */
export class Pager {
  private lines: string[] = [];
  private currentLine = 0;
  private terminalHeight!: number;
  private terminalWidth!: number;
  private rl: readline.Interface | null = null;
  private onKeypress: ((chunk: Buffer) => void) | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.updateTerminalSize();
  }

  /**
   * Update terminal dimensions
   */
  private updateTerminalSize(): void {
    this.terminalHeight = (process.stdout.rows || 24) - 1; // Reserve one line for prompt
    this.terminalWidth = process.stdout.columns || 80;
  }

  /**
   * Handle terminal resize events
   */
  private setupResizeHandling(): void {
    this.resizeHandler = () => {
      const oldHeight = this.terminalHeight;
      this.updateTerminalSize();

      // Adjust current line position if terminal got smaller
      if (this.terminalHeight < oldHeight) {
        const maxStart = Math.max(0, this.lines.length - this.terminalHeight);
        this.currentLine = Math.min(this.currentLine, maxStart);
      }

      // Redraw the display with new dimensions
      this.displayCurrentPage();
      this.showPrompt();
    };

    process.stdout.on('resize', this.resizeHandler);
  }

  /**
   * Display content in a paged format
   */
  async display(content: string): Promise<void> {
    if (!content) {
      console.log('No content to display');
      return;
    }

    this.lines = content.split('\n');
    this.currentLine = 0;

    // Update terminal size in case it changed since constructor
    this.updateTerminalSize();

    if (this.lines.length <= this.terminalHeight) {
      // Content fits on one screen, just display it
      console.log(content);
      return;
    }

    // Check if we're in a TTY (interactive terminal)
    if (!stdin.isTTY || !stdout.isTTY) {
      // Not interactive, just print everything
      console.log(content);
      return;
    }

    // Setup readline for keyboard input
    this.rl = readline.createInterface({
      input: stdin,
      output: stdout,
      terminal: true,
    });

    // Setup resize handling
    this.setupResizeHandling();

    // Enable raw mode for immediate key response
    stdin.setRawMode(true);

    try {
      await this.startPaging();
    } finally {
      this.cleanup();
    }
  }

  private async startPaging(): Promise<void> {
    return new Promise((resolve) => {
      this.displayCurrentPage();
      this.showPrompt();

      const onKeypress = (chunk: Buffer) => {
        const key = chunk.toString();

        // Handle arrow keys (escape sequences)
        if (key === '\u001b[A') {
          // Up arrow
          this.previousLine();
        } else if (key === '\u001b[B') {
          // Down arrow
          this.nextLine();
        } else if (key === '\u001b[5~') {
          // Page Up
          this.previousPage();
        } else if (key === '\u001b[6~') {
          // Page Down
          this.nextPage();
        } else {
          switch (key) {
            case 'q':
            case 'Q':
            case '\u0003': // Ctrl+C
              resolve();
              break;
            case ' ':
            case 'f':
              this.nextPage();
              break;
            case 'b':
              this.previousPage();
              break;
            case 'j':
            case '\r':
            case '\n':
              this.nextLine();
              break;
            case 'k':
              this.previousLine();
              break;
            case 'g':
              this.goToTop();
              break;
            case 'G':
              this.goToBottom();
              break;
            case 'h':
            case '?':
              this.showHelp().then(() => {
                this.displayCurrentPage();
                this.showPrompt();
              });
              return; // Don't continue with normal display
            case 'r':
            case '\u000C': // Ctrl+L
              // Refresh/redraw
              this.updateTerminalSize();
              this.displayCurrentPage();
              this.showPrompt();
              return;
            default:
              // Ignore other keys
              break;
          }
        }

        if (key !== 'q' && key !== 'Q' && key !== '\u0003') {
          this.displayCurrentPage();
          this.showPrompt();
        }
      };

      stdin.on('data', onKeypress);

      // Store the handler so we can remove it later
      this.onKeypress = onKeypress;
    });
  }

  private displayCurrentPage(): void {
    // Clear screen
    console.clear();

    const endLine = Math.min(
      this.currentLine + this.terminalHeight,
      this.lines.length
    );

    for (let i = this.currentLine; i < endLine; i++) {
      // Handle long lines that exceed terminal width
      const line = this.lines[i];
      if (line.length > this.terminalWidth) {
        // For now, just truncate. Could add horizontal scrolling later
        console.log(line.substring(0, this.terminalWidth - 3) + '...');
      } else {
        console.log(line);
      }
    }
  }

  private showPrompt(): void {
    const percentage = Math.round(
      ((this.currentLine + this.terminalHeight) / this.lines.length) * 100
    );
    const isEnd = this.currentLine + this.terminalHeight >= this.lines.length;

    // Calculate current position info
    const currentLineNum = this.currentLine + 1;
    const endLineNum = Math.min(
      this.currentLine + this.terminalHeight,
      this.lines.length
    );
    const totalLines = this.lines.length;

    if (isEnd) {
      process.stdout.write(
        `\x1b[7m(END) Lines ${currentLineNum}-${endLineNum}/${totalLines} - Press q to quit\x1b[0m`
      );
    } else {
      process.stdout.write(
        `\x1b[7m:${Math.min(percentage, 100)}% Lines ${currentLineNum}-${endLineNum}/${totalLines} - Press q to quit, h for help\x1b[0m`
      );
    }
  }

  private nextPage(): void {
    const maxStart = Math.max(0, this.lines.length - this.terminalHeight);
    this.currentLine = Math.min(
      this.currentLine + this.terminalHeight,
      maxStart
    );
  }

  private previousPage(): void {
    this.currentLine = Math.max(0, this.currentLine - this.terminalHeight);
  }

  private nextLine(): void {
    const maxStart = Math.max(0, this.lines.length - this.terminalHeight);
    if (this.currentLine < maxStart) {
      this.currentLine++;
    }
  }

  private previousLine(): void {
    if (this.currentLine > 0) {
      this.currentLine--;
    }
  }

  private goToTop(): void {
    this.currentLine = 0;
  }

  private goToBottom(): void {
    this.currentLine = Math.max(0, this.lines.length - this.terminalHeight);
  }

  private async showHelp(): Promise<void> {
    console.clear();
    console.log('\x1b[1mPager Help:\x1b[0m');
    console.log('');
    console.log('  \x1b[1mNavigation:\x1b[0m');
    console.log('    Space, f, PgDn      - Next page');
    console.log('    b, PgUp             - Previous page');
    console.log('    j, Enter, ↓ arrow   - Next line');
    console.log('    k, ↑ arrow          - Previous line');
    console.log('    g                   - Go to top');
    console.log('    G                   - Go to bottom');
    console.log('');
    console.log('  \x1b[1mOther:\x1b[0m');
    console.log('    h, ?                - Show this help');
    console.log('    r, Ctrl+L          - Refresh/redraw');
    console.log('    q, Q, Ctrl+C        - Quit');
    console.log('');
    console.log(
      `  \x1b[1mTerminal:\x1b[0m ${this.terminalWidth}x${this.terminalHeight + 1} characters`
    );
    console.log('');
    console.log('\x1b[7mPress any key to continue...\x1b[0m');

    // Wait for any key to continue
    await new Promise<void>((resolve) => {
      const onKeypress = () => {
        stdin.removeListener('data', onKeypress);
        resolve();
      };
      stdin.once('data', onKeypress);
    });
  }

  private cleanup(): void {
    if (this.onKeypress) {
      stdin.removeListener('data', this.onKeypress);
    }

    if (this.resizeHandler) {
      process.stdout.removeListener('resize', this.resizeHandler);
    }

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }

    // Clear the prompt line
    console.log('');
  }
}

/**
 * Convenience function to display content in a pager
 */
export async function showInPager(content: string): Promise<void> {
  const pager = new Pager();
  await pager.display(content);
}

import { type GitAlias, getGitAliases } from '../../core/git/aliases.js';
import { gitExecutor } from '../../core/git/executor.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';
import { writeErrorLine, writeLine } from '../utils/terminal.js';

export const listAliases = async (): Promise<void> => {
  try {
    const aliases = await getGitAliases();

    if (aliases.length === 0) {
      writeLine(yellow('No git aliases found.'));
      writeLine('Run "git-utils init" to create some!');
      return;
    }

    writeLine(green('🔧 Git Aliases'));
    writeLine('Select an alias to execute:');
    writeLine();

    try {
      const selectedAlias = await interactiveList<GitAlias>(
        aliases,
        (alias: GitAlias) => `git ${alias.name.padEnd(12)} → ${alias.command}`,
        (alias: GitAlias) => `${alias.name} ${alias.command}` // Search both name and command
      );

      if (selectedAlias) {
        writeLine();
        writeLine(yellow(`Executing: git ${selectedAlias.name}`));
        writeLine();

        try {
          // Execute the git alias
          const result = await gitExecutor.executeCommand(
            `git ${selectedAlias.name}`
          );

          // Display output
          if (result.stdout) {
            writeLine(result.stdout);
          }
          if (result.stderr) {
            writeLine(result.stderr);
          }

          writeLine();
          writeLine(green(`Successfully executed: git ${selectedAlias.name}`));
          process.exit(0);
        } catch (error) {
          writeErrorLine(
            red(
              `Error executing alias '${selectedAlias.name}': ${error instanceof Error ? error.message : String(error)}`
            )
          );
          process.exit(1);
        }
      } else {
        writeLine(yellow('No alias selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        writeLine();
        writeLine(yellow('Selection cancelled.'));
        process.exit(0);
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    writeLine(
      red(
        `Error fetching git aliases: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    writeLine('Run "git-utils init" to create some!');
    process.exit(1);
  }
};

import { type GitAlias, getGitAliases } from '../../core/git/aliases.js';
import { gitExecutor } from '../../core/git/executor.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';

export const listAliases = async (): Promise<void> => {
  try {
    const aliases = await getGitAliases();

    if (aliases.length === 0) {
      console.log(yellow('No git aliases found.'));
      console.log('Run "git-utils init" to create some!');
      return;
    }

    console.log(green('🔧 Git Aliases'));
    console.log('Select an alias to execute:\n');

    try {
      const selectedAlias = await interactiveList<GitAlias>(
        aliases,
        (alias: GitAlias) => `git ${alias.name.padEnd(12)} → ${alias.command}`,
        (alias: GitAlias) => `${alias.name} ${alias.command}` // Search both name and command
      );

      if (selectedAlias) {
        console.log(yellow(`\nExecuting: git ${selectedAlias.name}\n`));

        try {
          // Execute the git alias
          const result = await gitExecutor.executeCommand(
            `git ${selectedAlias.name}`
          );

          // Display output
          if (result.stdout) {
            console.log(result.stdout);
          }
          if (result.stderr) {
            console.log(result.stderr);
          }

          console.log(
            green(`\nSuccessfully executed: git ${selectedAlias.name}`)
          );
          process.exit(0);
        } catch (error) {
          console.error(
            red(
              `Error executing alias '${selectedAlias.name}': ${error instanceof Error ? error.message : String(error)}`
            )
          );
          process.exit(1);
        }
      } else {
        console.log(yellow('No alias selected.'));
        process.exit(0);
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === 'Selection cancelled') {
        console.log(yellow('\nSelection cancelled.'));
        process.exit(0);
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    console.log(
      red(
        `Error fetching git aliases: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    console.log('Run "git-utils init" to create some!');
    process.exit(1);
  }
};

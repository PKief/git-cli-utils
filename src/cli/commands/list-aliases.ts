import { getGitAliases } from '../../core/git/aliases.js';

export const listAliases = async (): Promise<void> => {
  try {
    const aliases = await getGitAliases();

    if (aliases.length > 0) {
      console.log('Current git aliases:\n');
      aliases.forEach((alias) => {
        console.log(`  git ${alias.name} → ${alias.command}`);
      });
    } else {
      console.log('No git aliases found.');
      console.log('Run "git-utils init" to create some!');
    }
  } catch (_error) {
    console.log('No git aliases found or error reading config.');
    console.log('Run "git-utils init" to create some!');
  }
};

const { commitSelector } = require('../src/modules/commit-selector');

async function main() {
  try {
    const commit = await commitSelector();
    console.log(`You selected commit: ${commit.hash}`);
  } catch (error) {
    console.error('Error selecting commit:', error.message);
  }
}

main();
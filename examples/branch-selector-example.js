const { chooseBranch } = require('../src/modules/branch-selector');

async function main() {
  try {
    const selectedBranch = await chooseBranch();
    console.log(`You selected the branch: ${selectedBranch}`);
  } catch (error) {
    console.error('Error selecting branch:', error.message);
  }
}

main();
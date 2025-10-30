import { SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  version: 1,
  entryFile: 'src/index.ts',

  // Enable barrel-less mode to allow free internal imports within modules
  // Only files in internal/ subdirectories will be encapsulated
  enableBarrelLess: true,

  modules: {
    'src/core': 'core',
    'src/cli': 'cli',
  },

  depRules: {
    core: ['core'], // core can only import from core
    cli: ['core', 'cli', 'noTag'], // CLI can import from core, cli, and auto-detected command modules
    root: ['core', 'cli', 'noTag'], // root (src/index.ts) can import from anywhere
    noTag: ['core', 'cli', 'noTag'], // auto-detected command modules can import from anywhere
  },
};

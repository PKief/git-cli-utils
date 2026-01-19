import * as p from '@clack/prompts';
import { Command } from 'commander';
import {
  getDefaultSymlinkPatterns,
  getWorktreeSymlinkConfig,
  setWorktreeSymlinkConfig,
  type WorktreeMode,
} from '../../../core/config.js';
import { blue, gray, green, yellow } from '../../ui/ansi.js';
import type { CommandRegistration } from '../../utils/command-registration.js';
import { configureEditor, showEditorConfig } from '../../utils/editor.js';
import { writeLine } from '../../utils/terminal.js';

interface ConfigSection {
  name: string;
  description: string;
  showAction: () => void;
  setAction: (value: string, options?: Record<string, unknown>) => void;
  interactiveSetup: () => Promise<void>;
}

// Symlinks config helpers
function showSymlinksConfig(): void {
  const config = getWorktreeSymlinkConfig();
  writeLine('Symlink configuration for new worktrees:');
  writeLine(
    `  Mode: ${config.mode === 'selective' ? green('selective') : yellow('plain')}`
  );
  if (config.mode === 'selective') {
    writeLine(`  Default patterns: ${blue(config.defaultPatterns.join(', '))}`);
  }
  writeLine('');
  writeLine(gray('Modes:'));
  writeLine(
    gray(
      '  selective - Prompt to symlink git-ignored files when creating worktrees'
    )
  );
  writeLine(
    gray('  plain     - Create worktrees without symlinking any files')
  );
}

async function interactiveSymlinksSetup(): Promise<void> {
  const currentConfig = getWorktreeSymlinkConfig();

  // Step 1: Select mode
  const mode = await p.select({
    message: 'Select worktree creation mode',
    options: [
      {
        label: 'Selective',
        value: 'selective',
        hint: 'Prompt to symlink git-ignored files (node_modules, .env, etc.)',
      },
      {
        label: 'Plain',
        value: 'plain',
        hint: 'Create worktrees without any symlinks',
      },
    ],
    initialValue: currentConfig.mode,
  });

  if (p.isCancel(mode)) return;

  const selectedMode = mode as WorktreeMode;

  // Step 2: If selective mode, configure default patterns
  if (selectedMode === 'selective') {
    const configurePatterns = await p.confirm({
      message: 'Configure default symlink patterns?',
      initialValue: true,
    });

    if (p.isCancel(configurePatterns)) return;

    if (configurePatterns) {
      await configureSymlinkPatterns(currentConfig.defaultPatterns);
    } else {
      // Just save the mode change
      setWorktreeSymlinkConfig({
        mode: selectedMode,
        defaultPatterns: currentConfig.defaultPatterns,
      });
      writeLine(green('Worktree mode set to: selective'));
    }
  } else {
    // Plain mode - save without patterns prompt
    setWorktreeSymlinkConfig({
      mode: 'plain',
      defaultPatterns: currentConfig.defaultPatterns, // Preserve patterns for later
    });
    writeLine(green('Worktree mode set to: plain'));
    writeLine(gray('Worktrees will be created without symlinks'));
  }
}

async function configureSymlinkPatterns(
  currentPatterns: string[]
): Promise<void> {
  const defaultPatterns = getDefaultSymlinkPatterns();

  writeLine('');
  writeLine('Enter patterns for files/folders to symlink by default.');
  writeLine(gray('Examples: node_modules, .env, .env.*, dist'));
  writeLine('');

  const patternsInput = await p.text({
    message: 'Default symlink patterns (comma separated)',
    placeholder: defaultPatterns.join(', '),
    initialValue: currentPatterns.join(', '),
    validate: (v) => {
      if (!v?.trim()) {
        return 'At least one pattern is required for selective mode';
      }
      return undefined;
    },
  });

  if (p.isCancel(patternsInput)) return;

  const patterns = patternsInput
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  setWorktreeSymlinkConfig({
    mode: 'selective',
    defaultPatterns: patterns,
  });

  writeLine(green('Worktree configuration saved:'));
  writeLine(`  Mode: ${green('selective')}`);
  writeLine(`  Default patterns: ${blue(patterns.join(', '))}`);
}

// Available config sections
const CONFIG_SECTIONS: ConfigSection[] = [
  {
    name: 'editor',
    description: 'Configure which editor opens new worktrees',
    showAction: showEditorConfig,
    setAction: (path: string, options?: { args?: string }) => {
      const args = options?.args
        ? options.args.split(' ').filter(Boolean)
        : undefined;
      configureEditor(path, args);
    },
    interactiveSetup: async () => {
      const path = await p.text({
        message: 'Enter editor binary path (e.g. /usr/local/bin/code)',
        placeholder: '/usr/local/bin/code',
        validate: (v) => (!v?.trim() ? 'Path is required' : undefined),
      });
      if (p.isCancel(path)) return;

      const argsInput = await p.text({
        message: 'Optional default args (space separated)',
        placeholder: '--new-window',
      });
      if (p.isCancel(argsInput)) return;
      const args = argsInput?.trim()
        ? argsInput.trim().split(/\s+/)
        : undefined;
      configureEditor(path.trim(), args);
    },
  },
  {
    name: 'symlinks',
    description:
      'Configure symlinks for new worktrees (node_modules, .env, etc.)',
    showAction: showSymlinksConfig,
    setAction: (value: string) => {
      // Handle CLI set command: config symlinks set <mode>
      const mode = value.toLowerCase();
      if (mode !== 'plain' && mode !== 'selective') {
        writeLine(
          yellow(`Invalid mode: ${value}. Use 'plain' or 'selective'.`)
        );
        return;
      }
      const currentConfig = getWorktreeSymlinkConfig();
      setWorktreeSymlinkConfig({
        mode: mode as WorktreeMode,
        defaultPatterns: currentConfig.defaultPatterns,
      });
      writeLine(green(`Worktree mode set to: ${mode}`));
    },
    interactiveSetup: interactiveSymlinksSetup,
  },
];

async function interactiveConfigAction(
  sectionName: string
): Promise<'show' | 'set' | null> {
  const section = CONFIG_SECTIONS.find((s) => s.name === sectionName);
  if (!section) return null;

  const res = await p.select({
    message: `${section.name} configuration – choose an action`,
    options: [
      { label: `Show current ${section.name}`, value: 'show' },
      { label: `Set / change ${section.name}`, value: 'set' },
    ],
  });
  if (p.isCancel(res)) return null;
  return res as 'show' | 'set';
}

async function interactiveSectionSelection(): Promise<string | null> {
  if (CONFIG_SECTIONS.length === 1) {
    // If only one section, use it directly
    return CONFIG_SECTIONS[0].name;
  }

  const res = await p.select({
    message: 'Select configuration section',
    options: CONFIG_SECTIONS.map((section) => ({
      label: section.name,
      value: section.name,
      hint: section.description,
    })),
  });
  if (p.isCancel(res)) return null;
  return res as string;
}

export async function configCommand(): Promise<void> {
  const isInteractiveEnv = process.stdin.isTTY && process.stdout.isTTY;

  if (!isInteractiveEnv) {
    console.log('Interactive mode required for config command');
    return;
  }

  // Select config section
  const sectionName = await interactiveSectionSelection();
  if (!sectionName) return;

  // Select action for the section
  const action = await interactiveConfigAction(sectionName);
  if (!action) return;

  const section = CONFIG_SECTIONS.find((s) => s.name === sectionName);
  if (!section) return;

  if (action === 'show') {
    section.showAction();
    return;
  }

  if (action === 'set') {
    await section.interactiveSetup();
    return;
  }
}

/**
 * Plugin/Module Pattern Registration
 * Self-contained command registration that handles both main command and subcommands
 */
export const registerCommand: CommandRegistration = (program: Command) => {
  // Register the main config command
  const configCmd = program
    .command('config')
    .description('Manage git-cli-utils configuration')
    .action(configCommand);

  // Register all subcommands (this logic is self-contained in this module)
  CONFIG_SECTIONS.forEach((section) => {
    // Create section command (e.g., "editor")
    const sectionCmd = configCmd
      .command(section.name)
      .description(`Configure ${section.name} settings`)
      .action(async () => {
        const action = await interactiveConfigAction(section.name);
        if (!action) return;

        if (action === 'show') {
          section.showAction();
        } else if (action === 'set') {
          await section.interactiveSetup();
        }
      });

    // Add "show" subcommand (e.g., "editor show")
    sectionCmd
      .command('show')
      .description(`Show current ${section.name} configuration`)
      .action(section.showAction);

    // Add "set" subcommand (e.g., "editor set")
    if (section.name === 'editor') {
      sectionCmd
        .command('set <path>')
        .description(`Set ${section.name} binary path`)
        .option('--args <args>', `Additional arguments for the ${section.name}`)
        .action((path: string, options: { args?: string }) => {
          section.setAction(path, options);
        });
    } else {
      sectionCmd
        .command('set <value>')
        .description(`Set ${section.name} value`)
        .action((value: string, options: Record<string, unknown>) => {
          section.setAction(value, options);
        });
    }
  });

  // Return command metadata for interactive selector
  return {
    name: 'config',
    description: 'Manage git-cli-utils configuration (editor, etc.)',
    action: configCommand,
  };
};

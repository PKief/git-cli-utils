import * as p from '@clack/prompts';
import { Command } from 'commander';
import { configureEditor, showEditorConfig } from '../../utils/editor.js';

interface ConfigSection {
  name: string;
  description: string;
  showAction: () => void;
  setAction: (value: string, options?: Record<string, unknown>) => void;
  interactiveSetup: () => Promise<void>;
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

export function registerConfigSubcommand(cmd: Command) {
  const configCmd = cmd
    .command('config')
    .description('Manage git-cli-utils configuration')
    .action(configCommand);

  // Register subcommands for each config section
  CONFIG_SECTIONS.forEach((section) => {
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

    sectionCmd
      .command('show')
      .description(`Show current ${section.name} configuration`)
      .action(section.showAction);

    // Generic set command - for editor this takes <path> and --args
    if (section.name === 'editor') {
      sectionCmd
        .command('set <path>')
        .description(`Set ${section.name} binary path`)
        .option('--args <args>', `Additional arguments for the ${section.name}`)
        .action((path: string, options: { args?: string }) => {
          section.setAction(path, options);
        });
    } else {
      // For future sections, add a generic set command
      sectionCmd
        .command('set <value>')
        .description(`Set ${section.name} value`)
        .action((value: string, options: Record<string, unknown>) => {
          section.setAction(value, options);
        });
    }
  });
}

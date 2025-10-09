import { Command } from 'commander';

export interface CommandModule {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void>;
  argument?: {
    name: string;
    description: string;
  };
}

/**
 * Generic command registration pattern
 * Each command module exports a registerCommand function that:
 * 1. Registers the main command with Commander
 * 2. Registers any subcommands
 * 3. Returns command metadata for the interactive selector
 */
export type CommandRegistration = (program: Command) => CommandModule;

export interface CommandConfig {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void>;
  argument?: {
    name: string;
    description: string;
  };
}

/**
 * Builder helper to eliminate duplication in command registration
 *
 * @example
 * ```typescript
 * // Simple command
 * export function registerCommand(program: Command): CommandModule {
 *   return createCommand(program, {
 *     name: 'sync',
 *     description: 'Sync from a remote branch by selecting remote and branch interactively',
 *     action: syncCommand,
 *   });
 * }
 *
 * // Command with arguments
 * export function registerCommand(program: Command): CommandModule {
 *   return createCommand(program, {
 *     name: 'authors',
 *     description: 'Show top contributors by commit count, optionally for a specific file',
 *     action: authorsCommand,
 *     argument: {
 *       name: '[file]',
 *       description: 'file path to analyze (optional)',
 *     },
 *   });
 * }
 * ```
 */
export function createCommand(
  program: Command,
  config: CommandConfig
): CommandModule {
  const commandName = config.argument
    ? `${config.name} ${config.argument.name}`
    : config.name;

  program
    .command(commandName)
    .description(config.description)
    .action(config.action);

  return {
    name: config.name,
    description: config.description,
    action: config.action,
    argument: config.argument,
  };
}

export interface SubcommandConfig {
  name: string;
  description: string;
  action: (...args: unknown[]) => Promise<void>;
  options?: Array<{
    flags: string;
    description: string;
    defaultValue?: string | boolean | string[];
  }>;
}

/**
 * Builder helper for commands with subcommands
 *
 * @example
 * ```typescript
 * export function registerCommand(program: Command): CommandModule {
 *   return createCommandWithSubcommands(program, {
 *     name: 'branches',
 *     description: 'Interactive branch selection with fuzzy search',
 *     action: searchBranches,
 *     subcommands: [
 *       {
 *         name: 'list',
 *         description: 'List all branches without interactive selection',
 *         action: listBranches,
 *       },
 *       {
 *         name: 'delete <name>',
 *         description: 'Delete a branch',
 *         action: deleteBranchCommand,
 *       },
 *     ],
 *   });
 * }
 * ```
 */
export function createCommandWithSubcommands(
  program: Command,
  config: CommandConfig & { subcommands?: SubcommandConfig[] }
): CommandModule {
  const command = program
    .command(config.name)
    .description(config.description)
    .action(config.action);

  // Add subcommands if provided
  config.subcommands?.forEach((sub) => {
    const subcommand = command.command(sub.name).description(sub.description);

    // Add options if provided
    sub.options?.forEach((option) => {
      subcommand.option(option.flags, option.description, option.defaultValue);
    });

    subcommand.action(sub.action);
  });

  return {
    name: config.name,
    description: config.description,
    action: config.action,
    argument: config.argument,
  };
}

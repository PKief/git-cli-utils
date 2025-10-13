import type { GitAlias } from '../../../../core/git/aliases.js';
import { createActions } from '../../../utils/action-helpers.js';
import { copyAliasCommand } from './copy.js';
import { deleteAlias } from './delete.js';
import { editAlias } from './edit.js';
import { executeAlias } from './execute.js';
import { createNewAlias } from './new.js';

export function getAliasActions(): ReturnType<typeof createActions<GitAlias>> {
  return createActions([
    {
      key: 'execute',
      label: 'Execute',
      description: 'Run the selected git alias',
      handler: executeAlias,
    },
    {
      key: 'copy',
      label: 'Copy',
      description: 'Copy alias command to clipboard',
      handler: copyAliasCommand,
    },
    {
      key: 'edit',
      label: 'Edit',
      description: 'Edit alias command',
      handler: editAlias,
    },
    {
      key: 'delete',
      label: 'Delete',
      description: 'Delete this alias',
      handler: deleteAlias,
    },
    {
      key: 'new',
      label: 'New',
      description: 'Create a new git alias',
      handler: createNewAlias,
    },
  ]);
}

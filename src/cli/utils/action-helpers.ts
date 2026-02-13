import type {
  Action,
  GlobalAction,
  ItemAction,
} from '../ui/selection-list/index.js';
import { AppError } from './exit.js';

/**
 * Result of an action execution with optional follow-up
 */
export interface ActionResult<T> {
  /** Whether the action was successful */
  success: boolean;
  /** Optional follow-up action to execute */
  followUpAction?: ItemAction<T>;
  /** Optional message to display */
  message?: string;
}

/**
 * Configuration for creating an item action
 */
export interface ItemActionConfig<T> {
  /** Unique identifier for the action */
  key: string;
  /** Display name for the action */
  label: string;
  /** Optional description for the action */
  description?: string;
  /** Exit the CLI immediately after successful execution */
  exitAfterExecution?: boolean;
  /** The action handler function - receives the selected item */
  handler: (
    item: T
  ) => Promise<ActionResult<T> | boolean> | ActionResult<T> | boolean;
}

/**
 * Creates a type-safe item action with follow-up support
 */
export function createItemAction<T>(
  config: ItemActionConfig<T>
): ItemAction<T> {
  // Wrap the handler to convert ActionResult to boolean for compatibility
  const wrappedHandler = async (item: T): Promise<boolean> => {
    const result = await config.handler(item);

    // If it's a simple boolean, return it
    if (typeof result === 'boolean') {
      if (result && config.exitAfterExecution) {
        throw AppError.silent();
      }
      return result;
    }

    // If it's an ActionResult, handle follow-up actions and return success status
    if (result.followUpAction) {
      // Execute the follow-up action
      const followUpResult = await result.followUpAction.handler(item);
      return typeof followUpResult === 'boolean' ? followUpResult : true;
    }

    if (result.success && config.exitAfterExecution) {
      throw AppError.silent();
    }

    return result.success;
  };

  return {
    type: 'item',
    key: config.key,
    label: config.label,
    description: config.description,
    handler: wrappedHandler,
  };
}

/**
 * Creates multiple item actions in a type-safe way
 */
export function createItemActions<T>(
  configs: ItemActionConfig<T>[]
): ItemAction<T>[] {
  return configs.map((config) => createItemAction(config));
}

/**
 * Helper to create a successful action result
 */
export function actionSuccess<T>(
  message?: string,
  followUpAction?: ItemAction<T>
): ActionResult<T> {
  return {
    success: true,
    message,
    followUpAction,
  };
}

/**
 * Helper to create a failed action result
 */
export function actionFailure<T>(
  message?: string,
  followUpAction?: ItemAction<T>
): ActionResult<T> {
  return {
    success: false,
    message,
    followUpAction,
  };
}

/**
 * Helper to create a cancelled action result
 */
export function actionCancelled<T>(message?: string): ActionResult<T> {
  return {
    success: false,
    message,
  };
}

// Re-export types for convenience
export type { Action, GlobalAction, ItemAction };

// Re-export global action utilities for convenience
export {
  createGlobalAction,
  createGlobalActions,
  type GlobalActionConfig,
  type GlobalActionWithCLI,
} from './global-action.js';

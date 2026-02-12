import type {
  Action,
  GlobalAction,
  ItemAction,
} from '../ui/selection-list/index.js';

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
  /** The action handler function - receives the selected item */
  handler: (
    item: T
  ) => Promise<ActionResult<T> | boolean> | ActionResult<T> | boolean;
}

/**
 * Configuration for creating a global action
 */
export interface GlobalActionConfig {
  /** Unique identifier for the action */
  key: string;
  /** Display name for the action */
  label: string;
  /** Optional description for the action */
  description?: string;
  /** The action handler function - no item parameter */
  handler: () => Promise<boolean> | boolean;
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
      return result;
    }

    // If it's an ActionResult, handle follow-up actions and return success status
    if (result.followUpAction) {
      // Execute the follow-up action
      const followUpResult = await result.followUpAction.handler(item);
      return typeof followUpResult === 'boolean' ? followUpResult : true;
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
 * Creates a type-safe global action (no item required)
 */
export function createGlobalAction(config: GlobalActionConfig): GlobalAction {
  return {
    type: 'global',
    key: config.key,
    label: config.label,
    description: config.description,
    handler: config.handler,
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
 * Creates multiple global actions in a type-safe way
 */
export function createGlobalActions(
  configs: GlobalActionConfig[]
): GlobalAction[] {
  return configs.map((config) => createGlobalAction(config));
}

// Legacy aliases for backward compatibility during migration
// TODO: Remove these after all commands are updated

/**
 * @deprecated Use ItemActionConfig instead
 */
export type ActionConfig<T> = ItemActionConfig<T>;

/**
 * @deprecated Use createItemAction instead
 */
export function createAction<T>(config: ItemActionConfig<T>): ItemAction<T> {
  return createItemAction(config);
}

/**
 * @deprecated Use createItemActions instead
 */
export function createActions<T>(
  configs: ItemActionConfig<T>[]
): ItemAction<T>[] {
  return createItemActions(configs);
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

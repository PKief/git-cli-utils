import { Action } from '../ui/interactive-list.js';

/**
 * Result of an action execution with optional follow-up
 */
export interface ActionResult<T> {
  /** Whether the action was successful */
  success: boolean;
  /** Optional follow-up action to execute */
  followUpAction?: Action<T>;
  /** Optional message to display */
  message?: string;
}

/**
 * Configuration for creating an action
 */
export interface ActionConfig<T> {
  /** Unique identifier for the action */
  key: string;
  /** Display name for the action */
  label: string;
  /** Optional description for the action */
  description?: string;
  /** The action handler function */
  handler: (
    item: T
  ) => Promise<ActionResult<T> | boolean> | ActionResult<T> | boolean;
}

/**
 * Creates a type-safe action with follow-up support
 */
export function createAction<T>(config: ActionConfig<T>): Action<T> {
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
    key: config.key,
    label: config.label,
    description: config.description,
    handler: wrappedHandler,
  };
}

/**
 * Creates multiple actions in a type-safe way
 */
export function createActions<T>(configs: ActionConfig<T>[]): Action<T>[] {
  return configs.map((config) => createAction(config));
}

/**
 * Helper to create a successful action result
 */
export function actionSuccess<T>(
  message?: string,
  followUpAction?: Action<T>
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
  followUpAction?: Action<T>
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

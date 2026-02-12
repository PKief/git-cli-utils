/**
 * Type definitions for the SelectionList component
 */

/**
 * Base action interface - common properties for all action types
 */
export interface BaseAction {
  /** Unique identifier for the action */
  key: string;
  /** Display name for the action */
  label: string;
  /** Optional description shown when action is selected */
  description?: string;
}

/**
 * Item-bound action - requires a selected item to execute
 * Used for actions like "checkout branch", "copy commit hash", etc.
 */
export interface ItemAction<T> extends BaseAction {
  type: 'item';
  /** Handler receives the selected item */
  handler: (item: T) => Promise<boolean> | boolean | Promise<void> | void;
}

/**
 * Global action - executes without requiring a selected item
 * Used for actions like "create new branch", "create new tag", etc.
 */
export interface GlobalAction extends BaseAction {
  type: 'global';
  /** Handler takes no parameters */
  handler: () => Promise<boolean> | boolean | Promise<void> | void;
}

/**
 * Union type for all action types
 */
export type Action<T> = ItemAction<T> | GlobalAction;

/**
 * Actions can be provided as:
 * - Static array: same actions for all items
 * - Function: returns actions based on the currently selected item
 */
export type ActionProvider<T> = Action<T>[] | ((item: T | null) => Action<T>[]);

/**
 * Configuration for the SelectionList component
 */
export interface SelectionListConfig<T> {
  /** Items to display in the list */
  items: T[];

  /** Function to render each item for display */
  renderItem: (item: T) => string;

  /** Function to extract searchable text (defaults to renderItem if not provided) */
  getSearchText?: (item: T) => string;

  /** Optional header text shown above the list */
  header?: string;

  /** Actions available for selection - can be static or dynamic per item */
  actions?: ActionProvider<T>;

  /** Key of the action to select by default */
  defaultActionKey?: string;
}

/**
 * Result returned from the SelectionList component
 */
export interface SelectionResult<T> {
  /** The selected item (null if cancelled or no item selected) */
  item: T | null;

  /** The action that was executed (null if no action or just selection) */
  action: Action<T> | null;

  /** Whether the operation succeeded */
  success: boolean;
}

/**
 * Internal state for the SelectionList component
 */
export interface SelectionListState<T> {
  /** Current search term */
  searchTerm: string;

  /** Currently selected item index in filtered list */
  currentIndex: number;

  /** Currently selected action index */
  selectedActionIndex: number;

  /** Filtered items based on search */
  filteredItems: T[];

  /** Currently resolved actions for the selected item */
  currentActions: Action<T>[];
}

/**
 * Configuration for rendering the action bar
 */
export interface ActionBarRenderConfig<T> {
  /** All available actions */
  actions: Action<T>[];

  /** Index of the currently selected action */
  selectedIndex: number;
}

/**
 * Configuration for rendering list items
 */
export interface ListRenderConfig<T> {
  /** Items to display */
  items: T[];

  /** Currently selected index */
  selectedIndex: number;

  /** Current search term for highlighting */
  searchTerm: string;

  /** Function to render item text */
  renderItem: (item: T) => string;

  /** Function to get searchable text */
  getSearchText: (item: T) => string;

  /** Maximum number of items to display */
  maxDisplayItems: number;

  /** Optional header text */
  header?: string;
}

// Vue-based toast implementation using radix-vue
import { ref, reactive, provide, inject } from 'vue';

// Constants
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;
const TOAST_KEY = Symbol('toast');

/**
 * Creates a toast store with methods to create, update, and dismiss toasts
 * @returns {Object} Toast store and methods
 */
export function createToastContext() {
  let count = 0;
  const toasts = reactive([]);
  const toastTimeouts = new Map();

  /**
   * Generates a unique ID for each toast
   * @returns {string} Unique ID
   */
  function genId() {
    count = (count + 1) % Number.MAX_VALUE;
    return count.toString();
  }

  /**
   * Adds a toast to the removal queue
   * @param {string} toastId - ID of the toast to remove
   */
  function addToRemoveQueue(toastId) {
    if (toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId);
      removeToast(toastId);
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
  }

  /**
   * Creates a new toast
   * @param {Object} options - Toast options
   * @returns {Object} Toast with control methods
   */
  function createToast(options) {
    const id = genId();
    const toast = {
      id,
      ...options,
      open: true,
      created: new Date()
    };

    // Add toast to store, respecting the limit
    if (toasts.length >= TOAST_LIMIT) {
      dismissToast(toasts[0].id);
    }
    
    toasts.push(toast);
    
    return {
      id,
      dismiss: () => dismissToast(id),
      update: (props) => updateToast(id, props)
    };
  }

  /**
   * Updates an existing toast
   * @param {string} id - Toast ID
   * @param {Object} props - Properties to update
   */
  function updateToast(id, props) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      const updatedToast = { ...toasts[index], ...props };
      toasts.splice(index, 1, updatedToast);
    }
  }

  /**
   * Dismisses a toast (initiates removal)
   * @param {string} id - Toast ID to dismiss
   */
  function dismissToast(id) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      const toast = toasts[index];
      toasts.splice(index, 1, { ...toast, open: false });
      addToRemoveQueue(id);
    }
  }

  /**
   * Removes a toast from the store
   * @param {string} id - Toast ID to remove
   */
  function removeToast(id) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }

  return {
    toasts,
    createToast,
    updateToast,
    dismissToast,
    removeToast
  };
}

/**
 * Provider component to set up toast context
 */
export function provideToast() {
  const context = createToastContext();
  provide(TOAST_KEY, context);
  return context;
}

/**
 * Hook to use toast functionality
 * @returns {Object} Toast methods
 */
export function useToast() {
  const context = inject(TOAST_KEY);
  
  if (!context) {
    console.warn('useToast must be used within a ToastProvider');
    return {
      toasts: [],
      toast: () => ({ id: '0', dismiss: () => {}, update: () => {} }),
      dismiss: () => {}
    };
  }
  
  /**
   * Create a toast with the given options
   * @param {Object} options - Toast options
   */
  function toast(options) {
    return context.createToast(options);
  }
  
  return {
    toasts: context.toasts,
    toast,
    dismiss: context.dismissToast
  };
}

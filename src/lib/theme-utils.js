/**
 * @typedef {'light'|'dark'|'system'} Theme
 * The possible theme values for the application
 */

/**
 * Get the current theme from localStorage or system preference
 * @returns {Theme} The current theme value
 */
export function getTheme() {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') return 'system';
  
  /** @type {Theme|null} */
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  
  // Default to system preference
  return 'system';
}

/**
 * Set the theme in localStorage and update document class
 * @param {Theme} theme - The theme to set
 */
export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  
  // Update localStorage
  localStorage.setItem('theme', theme);
  
  // Update the document class
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Applies the current theme based on localStorage or system preference
 * Use this in client-side code to initialize the theme
 */
export function applyTheme() {
  if (typeof window === 'undefined') return;
  
  const theme = getTheme();
  setTheme(theme);
  
  // Add listener for system preference changes if using system theme
  if (theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
      document.documentElement.classList.toggle('dark', matches);
    });
  }
}

/**
 * Cycles to the next theme in the sequence: light → dark → system
 * @returns {Theme} The new theme that was set
 */
export function cycleTheme() {
  const currentTheme = getTheme();
  
  /** @type {Theme} */
  let newTheme;
  
  switch (currentTheme) {
    case 'light':
      newTheme = 'dark';
      break;
    case 'dark':
      newTheme = 'system';
      break;
    default:
      newTheme = 'light';
  }
  
  setTheme(newTheme);
  return newTheme;
}

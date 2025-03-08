"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Represents the possible theme values for the application
 * @typedef {'dark' | 'light' | 'system'} Theme
 */
type Theme = "dark" | "light" | "system";

/**
 * Props for the ThemeProvider component
 * @typedef {Object} ThemeProviderProps
 * @property {React.ReactNode} children - The content to be wrapped by the provider
 * @property {Theme} [defaultTheme='system'] - The initial theme to use if no theme is stored
 * @property {string} [storageKey='theme'] - The localStorage key to store theme preference
 */
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

/**
 * State object for the theme context
 * @typedef {Object} ThemeProviderState
 * @property {Theme} theme - The current active theme
 * @property {function(Theme): void} setTheme - Function to update the theme
 */
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

/**
 * Initial state for the theme context
 * @type {ThemeProviderState}
 */
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

/**
 * Context for providing theme across the application
 * @type {React.Context<ThemeProviderState>}
 */
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Provider component that manages theme state and applies it to the document
 * Persists theme preference in localStorage and handles system theme preference
 *
 * @param {ThemeProviderProps} props - Component properties
 * @returns {JSX.Element} Provider component
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [theme, setTheme] = useState<Theme>(
    () => (typeof localStorage !== "undefined" && (localStorage.getItem(storageKey) as Theme)) || defaultTheme
  );

  // Apply theme classes to document root
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  // Create context value with theme and setter
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Custom hook to access the theme context
 * Must be used within a ThemeProvider component
 * 
 * @returns {ThemeProviderState} The theme context containing current theme and setTheme function
 * @throws {Error} If used outside of a ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  
  return context;
};

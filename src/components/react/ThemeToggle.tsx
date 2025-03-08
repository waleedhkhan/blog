"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Props for the ThemeToggle component
 * @typedef {Object} ThemeToggleProps
 * @property {string} [className] - Additional CSS classes to apply to the component
 */
interface ThemeToggleProps {
  className?: string;
}

/**
 * Component for toggling between light, dark, and system themes
 * Uses a minimal design approach following Bauhaus principles
 * Cycles through themes in the order: light → dark → system
 * 
 * @param {ThemeToggleProps} props - Component properties
 * @returns {JSX.Element} Rendered component
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  /**
   * Cycles to the next theme in sequence: light → dark → system → light
   */
  function cycleTheme() {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
  }

  /**
   * Gets the tooltip label based on current theme
   * @returns {string} The appropriate tooltip label
   */
  const getThemeLabel = () => {
    if (theme === "light") return "Switch to Dark";
    if (theme === "dark") return "Switch to System";
    return "Switch to Light";
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={cycleTheme}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              "h-9 w-9 p-0",
              className
            )}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Laptop className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={5}>
          <p>{getThemeLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

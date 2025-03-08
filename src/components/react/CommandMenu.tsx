"use client";

import React, { useState, useEffect, useRef } from "react";
import { Command } from "cmdk";
import { Search, ArrowRight, Github, BookText, User, LayoutDashboard, Home } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "./ThemeProvider";

interface CommandMenuProps {
  posts: {
    title: string;
    href: string;
  }[];
  className?: string;
}

export function CommandMenu({ posts, className }: CommandMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // When the menu opens, focus the input
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const navigateTo = (href: string) => {
    window.location.href = href;
    setOpen(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(nextTheme);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "hover:bg-accent hover:text-accent-foreground",
          "h-9 px-3 py-2 bg-secondary text-secondary-foreground",
          className
        )}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="hidden md:inline-flex ml-2 text-xs px-1.5 py-0.5 text-muted-foreground bg-muted font-mono border border-border rounded">
          {navigator.userAgent.indexOf("Mac") != -1 ? "⌘K" : "Ctrl+K"}
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="fixed top-[20%] left-1/2 transform -translate-x-1/2 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              className="rounded-lg border shadow-md bg-card text-card-foreground overflow-hidden"
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <div className="flex items-center px-3 border-b">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search posts, navigation, theme..."
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
                
                {search.length > 0 && (
                  <Command.Group heading="Posts">
                    {posts.map((post) => (
                      <Command.Item
                        key={post.href}
                        onSelect={() => navigateTo(post.href)}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                      >
                        <BookText className="h-4 w-4" />
                        <span>{post.title}</span>
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Navigation">
                  <Command.Item
                    onSelect={() => navigateTo("/")}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => navigateTo("/blog")}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Blog</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => navigateTo("/about")}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span>About</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => window.open("https://github.com/waleedhkhan", "_blank")}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Theme">
                  <Command.Item
                    onSelect={toggleTheme}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <div className="h-4 w-4 flex items-center justify-center">
                      {theme === "light" ? "🌞" : theme === "dark" ? "🌙" : "💻"}
                    </div>
                    <span>Toggle theme ({theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"})</span>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}

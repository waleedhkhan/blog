"use client";

import React from "react";
import { Home, Newspaper, User, Bookmark } from "lucide-react";
import { NavigationItem } from "./NavigationItem";
import { ThemeToggle } from "./ThemeToggle";
import { CommandMenu } from "./CommandMenu";
import { cn } from "../../lib/utils";

interface NavigationProps {
  currentPath: string;
  posts: {
    title: string;
    href: string;
  }[];
  className?: string;
}

const navigationLinks = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/posts",
    label: "Blog",
    icon: Newspaper,
  },
  {
    href: "/about",
    label: "About",
    icon: User,
  },
  {
    href: "/bookmarks",
    label: "Bookmarks",
    icon: Bookmark,
  },
];

export function Navigation({ currentPath, posts, className }: NavigationProps) {
  return (
    <div className="relative">
      <nav
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-md",
          "flex items-center gap-1 md:gap-2",
          "shadow-md border border-border", 
          "bg-background/90 backdrop-blur-md",
          "transition-all duration-300",
          className
        )}
      >
        {navigationLinks.map((link) => {
          const isActive = 
            currentPath === link.href || 
            currentPath.startsWith(`${link.href}/`);
            
          const Icon = link.icon;
          
          return (
            <NavigationItem
              key={link.href}
              label={link.label.toLowerCase()}
              href={link.href}
              isActive={isActive}
            >
              <Icon className="h-5 w-5" />
            </NavigationItem>
          );
        })}

        <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />

        <ThemeToggle />
        
        <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
        
        <CommandMenu posts={posts} className="hidden md:flex" />
      </nav>
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface MainNavProps {
  items?: {
    title: string;
    href: string;
    external?: boolean;
  }[];
  className?: string;
}

export function MainNav({ 
  items, 
  className 
}: MainNavProps) {
  return (
    <div className="flex gap-6 md:gap-10">
      <nav className={cn("flex items-center space-x-6", className)}>
        {items?.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60",
              item.href === window.location.pathname && "text-foreground"
            )}
            {...(item.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {item.title}
          </a>
        ))}
        <ThemeToggle />
      </nav>
    </div>
  );
}

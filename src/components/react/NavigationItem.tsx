"use client";

import React from "react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";
import { cn } from "../../lib/utils";

interface NavigationItemProps {
  label: string;
  href: string;
  className?: string;
  isActive?: boolean;
  children: React.ReactNode;
}

export function NavigationItem({ 
  label, 
  href, 
  className, 
  isActive, 
  children 
}: NavigationItemProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={href}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              "hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-secondary text-foreground",
              className
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex items-center justify-center">
              {children}
            </div>
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={5}>
          <p className="capitalize">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

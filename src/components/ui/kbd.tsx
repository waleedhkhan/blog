"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-mono text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

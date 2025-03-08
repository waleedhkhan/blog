"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TableOfContentsWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function TableOfContentsWrapper({ 
  children, 
  className 
}: TableOfContentsWrapperProps) {
  return (
    <div 
      className={cn(
        "fixed bottom-[120px] left-5 z-40 max-h-[60vh] overflow-y-auto",
        "hidden md:block",
        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface CopyCodeProps {
  code: string;
  className?: string;
}

export function CopyCode({ code, className }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      disabled={copied}
      className={cn(
        "absolute right-3 top-3 h-8 w-8 rounded-md border border-border bg-background p-1.5",
        "opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none",
        copied ? "cursor-default" : "cursor-pointer",
        className
      )}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <Check className="h-full w-full text-green-500" />
      ) : (
        <Copy className="h-full w-full text-foreground" />
      )}
    </button>
  );
}

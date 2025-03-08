"use client";

import React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { cn } from "@/lib/utils";

interface CopyPostLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function CopyPostLink({ className, children }: CopyPostLinkProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const copyLink = React.useCallback(async () => {
    await navigator.clipboard.writeText(
      window.location.origin + window.location.pathname
    );
    
    setHasCopied(true);
    
    toast({
      description: "Link copied to clipboard!",
      duration: 2500,
    });
  }, []);

  return (
    <button
      onClick={copyLink}
      className={cn(
        "group inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:bg-accent hover:text-accent-foreground",
        "h-9 px-3",
        className
      )}
      title="Copy Post Link to Clipboard"
    >
      {hasCopied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          <span>Copied</span>
        </>
      ) : (
        <>
          {children || (
            <>
              <Copy className="h-4 w-4 mr-2" />
              <span>Copy Link</span>
            </>
          )}
        </>
      )}
    </button>
  );
}

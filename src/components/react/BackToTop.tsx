"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopProps {
  className?: string;
}

export function BackToTop({ className }: BackToTopProps) {
  const [visible, setVisible] = React.useState(false);

  const handleScroll = React.useCallback(() => {
    const scrollY = window.scrollY;
    setVisible(scrollY > 300);
  }, []);

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-10 p-2 rounded-md border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:bg-muted"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
      <span className="sr-only">Back to top</span>
    </button>
  );
}

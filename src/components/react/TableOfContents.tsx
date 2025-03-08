"use client";

import React, { useState, useEffect } from "react";
import { List, ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface TableOfContentsProps {
  toc: {
    id: string;
    text: string;
    depth: number;
  }[];
  className?: string;
}

export function TableOfContents({ toc, className }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.matchMedia("(min-width: 1280px)").matches;
      setIsDesktop(desktop);
      if (desktop) {
        setIsOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    const headings = document.querySelectorAll("h2, h3, h4, h5, h6");
    headings.forEach((heading) => observer.observe(heading));

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
    };
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={cn(
        "fixed z-10 bottom-8 left-8 md:top-32 md:bottom-auto",
        className
      )}
    >
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center p-2 rounded-md border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:bg-muted md:mb-2"
          aria-label="Toggle table of contents"
          aria-expanded={isOpen}
        >
          <List className="h-5 w-5" />
          <span className="sr-only">Table of Contents</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 w-64 mt-2 p-4 rounded-md border border-border bg-card text-card-foreground shadow-md">
            <h2 className="font-medium text-sm mb-3">Table of Contents</h2>
            <nav aria-label="Table of contents">
              <ul className="space-y-1">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    style={{ paddingLeft: `${(item.depth - 2) * 0.75}rem` }}
                  >
                    <a
                      href={`#${item.id}`}
                      className={cn(
                        "block py-1 text-sm transition-colors hover:text-foreground",
                        activeId === item.id
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      )}
                      onClick={() => !isDesktop && setIsOpen(false)}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              onClick={handleBackToTop}
              className="flex items-center space-x-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowUp className="h-4 w-4" />
              <span>Back to top</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

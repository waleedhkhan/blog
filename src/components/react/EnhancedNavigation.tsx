"use client";

import React, { useState, useEffect } from "react";
import { Home, Newspaper, User, Bookmark, Search, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "../../lib/utils";

/**
 * Navigation link item structure
 */
interface NavLink {
  /** URL the link points to */
  href: string;
  /** Display text for the link */
  label: string;
  /** Icon component to display with the link */
  icon: React.ElementType;
}

/**
 * Blog post link structure for mobile menu
 */
interface PostLink {
  /** Title of the blog post */
  title: string;
  /** URL to the blog post */
  href: string;
}

/**
 * Props for the EnhancedNavigation component
 */
interface EnhancedNavigationProps {
  /** Current URL path for highlighting active links */
  currentPath: string;
  /** Recent posts to display in the mobile menu */
  posts?: PostLink[];
  /** Additional CSS classes to apply to the component */
  className?: string;
}

/**
 * Predefined navigation links used in the component
 * @type {NavLink[]}
 */
const navigationLinks: NavLink[] = [
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

/**
 * Enhanced navigation component with mobile responsive design and animations
 * 
 * @param {EnhancedNavigationProps} props - Component properties
 * @returns {JSX.Element} Rendered component
 */
export function EnhancedNavigation({ currentPath, posts, className }: EnhancedNavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Track scroll for navigation appearance
  useEffect(() => {
    /**
     * Handler for scroll events that updates isScrolled state
     */
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full",
          "flex items-center gap-2",
          isScrolled ? "border border-border bg-background/80" : "bg-background/60 border border-border/50",
          "transition-all duration-300 fade-in",
          className
        )}
        style={{ 
          transform: "translateY(0)",
          opacity: 1,
          boxShadow: isScrolled ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
          backdropFilter: isScrolled ? "blur(12px)" : "blur(8px)",
        }}
      >
        {navigationLinks.map((link) => {
          const isActive = 
            currentPath === link.href || 
            currentPath.startsWith(`${link.href}/`);
            
          const Icon = link.icon;
          
          return (
            <div key={link.href} className="relative">
              <a
                href={link.href}
                className={cn(
                  "relative px-3 py-2 rounded-full inline-flex items-center gap-2 transition-colors",
                  isActive 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onMouseEnter={() => setHoveredItem(link.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{link.label}</span>
                
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-primary/10 -z-10 transition-opacity duration-200"
                    style={{ opacity: 1 }}
                  />
                )}
                
                {hoveredItem === link.href && !isActive && (
                  <span
                    className="absolute inset-0 rounded-full bg-muted -z-10 transition-opacity duration-200"
                    style={{ opacity: 1 }}
                  />
                )}
              </a>
            </div>
          );
        })}

        <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
        <ThemeToggle />
        
        <div className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
        
        <button 
          className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        
        {/* Mobile Menu Trigger (visible on small screens) */}
        <button 
          className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors md:hidden"
          aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 flex items-start justify-center pt-20 bg-background/95 backdrop-blur-sm md:hidden",
            "fade-in"
          )}
        >
          <div
            className={cn(
              "w-[90%] max-w-md p-4 rounded-lg border border-border bg-card shadow-lg",
              "fade-in-delay-1"
            )}
          >
            <div className="space-y-2">
              {navigationLinks.map((link) => {
                const isActive = 
                  currentPath === link.href || 
                  currentPath.startsWith(`${link.href}/`);
                  
                const Icon = link.icon;
                
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                      isActive 
                        ? "text-primary font-medium bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>

            {posts && posts.length > 0 && (
              <>
                <div className="my-4 border-t border-border" />
                <div className="text-sm font-medium text-foreground mb-2">Recent Posts</div>
                <div className="space-y-2">
                  {posts.slice(0, 3).map((post) => (
                    <a
                      key={post.href}
                      href={post.href}
                      className="block px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {post.title}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

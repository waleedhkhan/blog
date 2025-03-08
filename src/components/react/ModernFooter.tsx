"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Github, Twitter, Linkedin, Mail, Rss } from "lucide-react";

interface ModernFooterProps {
  className?: string;
  siteName?: string;
  siteDescription?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

export function ModernFooter({
  className,
  siteName = "My Blog",
  siteDescription = "Thoughts, stories and ideas.",
  socialLinks = {
    github: "https://github.com",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    email: "mailto:example@example.com",
  },
}: ModernFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      "border-t border-border bg-background/50 backdrop-blur-sm",
      className
    )}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{siteName}</h2>
            <p className="text-muted-foreground">{siteDescription}</p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.github && (
                <a 
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {socialLinks.email && (
                <a 
                  href={socialLinks.email}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
              <a 
                href="/rss.xml"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="RSS Feed"
              >
                <Rss className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/category/tech" className="text-muted-foreground hover:text-primary transition-colors">Technology</a>
              <a href="/category/web-dev" className="text-muted-foreground hover:text-primary transition-colors">Web Development</a>
              <a href="/category/design" className="text-muted-foreground hover:text-primary transition-colors">Design</a>
              <a href="/category/tutorials" className="text-muted-foreground hover:text-primary transition-colors">Tutorials</a>
            </nav>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="/posts" className="text-muted-foreground hover:text-primary transition-colors">Blog</a>
              <a href="/projects" className="text-muted-foreground hover:text-primary transition-colors">Projects</a>
              <a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </nav>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Subscribe</h3>
            <p className="text-muted-foreground mb-4">
              Get notified when I publish something new, and unsubscribe at any time.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="/sitemap.xml" className="text-muted-foreground hover:text-foreground transition-colors">Sitemap</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

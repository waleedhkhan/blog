"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { ArrowRightIcon } from "lucide-react";

/**
 * Props for the HeroBlog component
 * @typedef {Object} HeroImage
 * @property {string} src - The source URL of the image
 * @property {string} alt - The alt text for the image
 */

/**
 * Hero component for the blog homepage with heading, description, and call-to-action buttons
 */
interface HeroBlogProps {
  /** Main heading text for the hero section */
  title?: string;
  /** Longer descriptive text below the heading */
  description?: string;
  /** Text for the primary call-to-action button */
  ctaText?: string;
  /** URL for the primary call-to-action button */
  ctaHref?: string;
  /** Text for the secondary call-to-action button */
  secondaryCtaText?: string;
  /** URL for the secondary call-to-action button */
  secondaryCtaHref?: string;
  /** Image to display in the hero section */
  image?: {
    src: string;
    alt: string;
  };
  /** Additional CSS classes to apply to the component */
  className?: string;
}

/**
 * Hero component for the blog homepage with heading, description, and call-to-action buttons
 * 
 * @param {HeroBlogProps} props - Component properties
 * @returns {JSX.Element} Rendered component
 */
export function HeroBlog({
  className,
  title = "Discover insights and stories",
  description = "Stay up to date with the latest trends, tutorials, and in-depth articles.",
  ctaText = "Read Articles",
  ctaHref = "/posts",
  secondaryCtaText = "About Me",
  secondaryCtaHref = "/about",
  image = {
    src: "/images/hero-bg.jpg",
    alt: "Blog preview",
  },
  ...props
}: HeroBlogProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 md:py-24",
        className
      )}
      {...props}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern-light dark:bg-grid-pattern-dark opacity-[0.15] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div className="flex flex-col gap-6 fade-in">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl fade-in-delay-1">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl max-w-[600px] fade-in-delay-2">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 fade-in-delay-3">
              <a 
                href={ctaHref} 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {ctaText}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </a>
              <a 
                href={secondaryCtaHref}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {secondaryCtaText}
              </a>
            </div>
          </div>
          <div className="relative fade-in" style={{ transitionDelay: "200ms" }}>
            <div className="relative rounded-lg overflow-hidden shadow-xl border border-border hover:shadow-2xl transition-shadow duration-300">
              {image?.src && (
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                />
              )}
            </div>
            {/* Decorative elements */}
            <div className="absolute -inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 -z-10" />
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/40 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-secondary/30 rounded-full blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

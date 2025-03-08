"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Calendar, Clock, Tag } from "lucide-react";

/**
 * Props for the EnhancedPostCard component
 */
interface EnhancedPostCardProps {
  /** Title of the blog post */
  title: string;
  /** Brief description or excerpt of the post content */
  description?: string;
  /** Publication date of the post */
  date?: string;
  /** Estimated time to read the post */
  readTime?: string;
  /** URL to the full post */
  url: string;
  /** Array of tags/categories for the post */
  tags?: string[];
  /** URL to the post's featured image */
  image?: string;
  /** Additional CSS classes to apply to the component */
  className?: string;
}

/**
 * Enhanced card component for displaying blog post previews with hover effects
 * 
 * @param {EnhancedPostCardProps} props - Component properties
 * @returns {JSX.Element} Rendered component
 */
export function EnhancedPostCard({
  title,
  description,
  date,
  readTime,
  url,
  tags = [],
  image,
  className,
}: EnhancedPostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={url}
      className={cn(
        "group relative block h-full rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover-lift",
        "hover:border-primary/50 hover:shadow-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
      }}
    >
      {image && (
        <div className="relative overflow-hidden rounded-t-lg h-48">
          <img 
            src={image} 
            alt={title} 
            className={cn(
              "h-full w-full object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          
          {tags && tags.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-wrap gap-2">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/90 text-primary-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex h-full flex-col justify-between">
          <div>
            <h3 className="font-semibold tracking-tight text-lg text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="mt-2 text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            {date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <time>{date}</time>
              </div>
            )}
            {readTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isHovered && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-progressLine"
        />
      )}
    </a>
  );
}

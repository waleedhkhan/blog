"use client";

import { cn } from "../../lib/utils";

interface PostCardProps {
  title: string;
  description?: string;
  date?: string;
  url: string;
  className?: string;
  tags?: string[];
}

export function PostCard({
  title,
  description,
  date,
  url,
  className,
  tags
}: PostCardProps) {
  return (
    <a
      href={url}
      className={cn(
        "group block p-6 h-full rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/50 hover:shadow-md",
        className
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <h3 className="font-semibold tracking-tight text-lg text-foreground group-hover:underline group-hover:decoration-primary/30 group-hover:underline-offset-4">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-muted-foreground line-clamp-2">{description}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {date && (
          <time className="mt-4 block text-xs text-muted-foreground">
            {date}
          </time>
        )}
      </div>
    </a>
  );
}

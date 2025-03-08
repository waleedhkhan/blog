"use client";

import React, { useState, useEffect } from "react";
import { MusicIcon, ExternalLinkIcon } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * @typedef {Object} Track
 * @property {string} name - Track name
 * @property {string} url - Link to the track
 * @property {Object} artist - Artist information
 * @property {string} artist.name - Artist name
 * @property {string} artist.url - Link to the artist
 * @property {Object} album - Album information
 * @property {string} album.name - Album name
 * @property {string|null} album.image - Album artwork URL
 * @property {string} date - When the track was played
 */

/**
 * Props for the RecentTracks component
 */
interface RecentTracksProps {
  /** LastFM username */
  username: string;
  /** Number of tracks to display */
  limit?: number;
  /** Whether to refresh tracks periodically */
  refreshInterval?: number | null;
  /** Additional CSS classes to apply to the component */
  className?: string;
}

/**
 * Component that displays recently played tracks from LastFM
 * Following Bauhaus minimalist design principles
 * 
 * @param {RecentTracksProps} props - Component properties
 * @returns {JSX.Element} Rendered component
 */
export function RecentTracks({
  username,
  limit = 5,
  refreshInterval = 60000, // 1 minute refresh by default
  className
}: RecentTracksProps) {
  /** @type {[Track[], (tracks: Track[]) => void]} */
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch tracks from the server-side API
   */
  const fetchTracks = async () => {
    try {
      setLoading(true);
      // This endpoint would be implemented on the server side (Edge function or API route)
      // It would use the lastfm.js utility we created
      const response = await fetch(`/api/lastfm/recent?username=${username}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status}`);
      }
      
      const data = await response.json();
      setTracks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching LastFM tracks:', err);
      setError('Could not load recent tracks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tracks on component mount and set up interval if requested
  useEffect(() => {
    fetchTracks();
    
    // Set up refresh interval if specified
    if (refreshInterval) {
      const intervalId = setInterval(fetchTracks, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [username, limit, refreshInterval]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <MusicIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Recently Played</h3>
      </div>
      
      {loading && tracks.length === 0 ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="rounded-md bg-muted h-12 w-12"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground rounded p-4 bg-muted">
          {error}
        </div>
      ) : (
        <ul className="space-y-3">
          {tracks.map((track, index) => (
            <li key={`${track.name}-${index}`} className="flex items-start gap-3 group">
              {track.album.image ? (
                <img 
                  src={track.album.image} 
                  alt={track.album.name}
                  className="h-12 w-12 object-cover rounded shadow-sm"
                  loading="lazy" 
                />
              ) : (
                <div className="h-12 w-12 bg-muted flex items-center justify-center rounded">
                  <MusicIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <a 
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary truncate block group-hover:underline transition-colors"
                >
                  {track.name}
                </a>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <a 
                    href={track.artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    {track.artist.name}
                  </a>
                  <span>•</span>
                  <span>{track.date === 'Now playing' ? 'Now playing' : track.date}</span>
                </div>
              </div>
              
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`View ${track.name} on LastFM`}
              >
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
      
      <div className="text-xs text-muted-foreground flex justify-between items-center pt-2 border-t border-border">
        <span>Powered by LastFM</span>
        <a 
          href={`https://www.last.fm/user/${username}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          View profile
          <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

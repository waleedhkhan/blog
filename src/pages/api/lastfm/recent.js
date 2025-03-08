/**
 * API route handler for LastFM recent tracks
 * Designed for Cloudflare Pages edge functions
 * 
 * Usage: /api/lastfm/recent?username=<username>&limit=<limit>
 */
import { getRecentTracks } from '../../../lib/lastfm';

export async function GET({ request }) {
  /** @type {URL} */
  const url = new URL(request.url);
  /** @type {string|null} */
  const username = url.searchParams.get('username');
  /** @type {number} */
  const limit = parseInt(url.searchParams.get('limit') || '5', 10);

  // This should be set in your environment variables
  /** @type {string} */
  const API_KEY = import.meta.env.LASTFM_API_KEY || '';

  if (!username) {
    return new Response(
      JSON.stringify({ error: 'Username parameter is required' }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'LastFM API key not configured' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Fetch tracks from the LastFM API
    const tracks = await getRecentTracks(username, API_KEY, limit);
    
    // Return JSON response with CORS headers for client-side fetching
    return new Response(
      JSON.stringify(tracks),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60, s-maxage=60', // Cache for 1 minute
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    console.error('LastFM API error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch recent tracks' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

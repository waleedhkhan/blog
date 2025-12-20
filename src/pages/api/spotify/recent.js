/**
 * API route handler for Spotify recent tracks
 *
 * Usage: /api/spotify/recent?limit=<limit>
 */
import { getRecentTracksWithNowPlaying } from '../../../lib/spotify';

// Disable prerendering for this API route (server-side only)
export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '6', 10);

  // Debug: Check if env vars are available
  const hasClientId = !!import.meta.env.SPOTIFY_CLIENT_ID;
  const hasClientSecret = !!import.meta.env.SPOTIFY_CLIENT_SECRET;
  const hasRefreshToken = !!import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!hasClientId || !hasClientSecret || !hasRefreshToken) {
    return new Response(
      JSON.stringify({
        error: 'Missing credentials',
        debug: { hasClientId, hasClientSecret, hasRefreshToken }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const tracks = await getRecentTracksWithNowPlaying(limit);

    return new Response(
      JSON.stringify(tracks),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=30, s-maxage=30',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    console.error('Spotify API error:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to fetch recent tracks', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

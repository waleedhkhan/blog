/**
 * API route handler for Spotify recent tracks
 *
 * Usage: /api/spotify/recent?limit=<limit>
 */
import { getRecentTracksWithNowPlaying } from '../../../lib/spotify';

export async function GET({ request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '6', 10);

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
      JSON.stringify({ error: 'Failed to fetch recent tracks' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

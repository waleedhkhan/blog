/**
 * API route handler for Spotify recent tracks
 *
 * Usage: /api/spotify/recent?limit=<limit>
 */

// Disable prerendering for this API route (server-side only)
export const prerender = false;

// Spotify API endpoints
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played';
const CURRENTLY_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getCurrentlyPlaying(token) {
  try {
    const response = await fetch(CURRENTLY_PLAYING_ENDPOINT, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 204 || !response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.is_playing || !data.item) {
      return null;
    }

    return {
      name: data.item.name,
      artist: data.item.artists.map(a => a.name).join(', '),
      url: data.item.external_urls.spotify,
      image: data.item.album.images[1]?.url || data.item.album.images[0]?.url || '',
      nowPlaying: true,
    };
  } catch {
    return null;
  }
}

async function getRecentlyPlayed(token, limit = 6) {
  try {
    const url = new URL(RECENTLY_PLAYED_ENDPOINT);
    url.searchParams.set('limit', Math.min(limit * 3, 50).toString());

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const tracks = data.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      url: item.track.external_urls.spotify,
      image: item.track.album.images[1]?.url || item.track.album.images[0]?.url || '',
      playedAt: item.played_at,
    }));

    // Deduplicate
    const seen = new Set();
    return tracks.filter(track => {
      const key = `${track.name}|${track.artist}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  } catch {
    return [];
  }
}

export async function GET({ locals, request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '6', 10);

  // Get env vars from Cloudflare runtime context
  const runtime = locals.runtime;
  const clientId = runtime?.env?.SPOTIFY_CLIENT_ID || import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = runtime?.env?.SPOTIFY_CLIENT_SECRET || import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = runtime?.env?.SPOTIFY_REFRESH_TOKEN || import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return new Response(
      JSON.stringify({
        error: 'Missing credentials',
        debug: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          hasRefreshToken: !!refreshToken,
          hasRuntime: !!runtime,
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const token = await getAccessToken(clientId, clientSecret, refreshToken);
    const [currentTrack, recentTracks] = await Promise.all([
      getCurrentlyPlaying(token),
      getRecentlyPlayed(token, limit),
    ]);

    let tracks;
    if (currentTrack) {
      const filtered = recentTracks.filter(
        track => !(track.name === currentTrack.name && track.artist === currentTrack.artist)
      );
      tracks = [currentTrack, ...filtered.slice(0, limit - 1)];
    } else {
      tracks = recentTracks;
    }

    return new Response(JSON.stringify(tracks), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=30, s-maxage=30',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tracks', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

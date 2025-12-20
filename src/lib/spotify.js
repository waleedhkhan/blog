/**
 * Spotify API utilities
 *
 * Handles token refresh and fetching recently played / currently playing tracks.
 */

const CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played';
const CURRENTLY_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

// Cache access token to avoid unnecessary refreshes
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get a fresh access token using the refresh token
 */
export async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('Missing Spotify credentials. Check your .env file.');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}

/**
 * Get the currently playing track (if any)
 */
export async function getCurrentlyPlaying() {
  try {
    const token = await getAccessToken();

    const response = await fetch(CURRENTLY_PLAYING_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // 204 means nothing is playing
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Only return if actually playing
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
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    return null;
  }
}

/**
 * Get recently played tracks
 */
export async function getRecentlyPlayed(limit = 6) {
  try {
    const token = await getAccessToken();

    const url = new URL(RECENTLY_PLAYED_ENDPOINT);
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const data = await response.json();

    return data.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      url: item.track.external_urls.spotify,
      image: item.track.album.images[1]?.url || item.track.album.images[0]?.url || '',
      playedAt: item.played_at,
    }));
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return [];
  }
}

/**
 * Get recent tracks with currently playing track at the top (if any)
 * This is the main function used by the API endpoint
 */
export async function getRecentTracksWithNowPlaying(limit = 6) {
  const [currentTrack, recentTracks] = await Promise.all([
    getCurrentlyPlaying(),
    getRecentlyPlayed(limit),
  ]);

  if (currentTrack) {
    // Filter out the currently playing track from recent if it's there
    const filtered = recentTracks.filter(
      track => !(track.name === currentTrack.name && track.artist === currentTrack.artist)
    );
    return [currentTrack, ...filtered.slice(0, limit - 1)];
  }

  return recentTracks;
}

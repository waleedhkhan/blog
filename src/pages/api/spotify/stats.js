/**
 * API route handler for Spotify listening stats
 * Returns top artists, top tracks, and recently played with timestamps
 */

export const prerender = false;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const TOP_ARTISTS_ENDPOINT = 'https://api.spotify.com/v1/me/top/artists';
const TOP_TRACKS_ENDPOINT = 'https://api.spotify.com/v1/me/top/tracks';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played';

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
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

async function getTopArtists(token, timeRange = 'short_term', limit = 10) {
  const url = new URL(TOP_ARTISTS_ENDPOINT);
  url.searchParams.set('time_range', timeRange);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.items.map(artist => ({
    name: artist.name,
    url: artist.external_urls.spotify,
    image: artist.images[1]?.url || artist.images[0]?.url || '',
    genres: artist.genres.slice(0, 3),
    popularity: artist.popularity,
  }));
}

async function getTopTracks(token, timeRange = 'short_term', limit = 10) {
  const url = new URL(TOP_TRACKS_ENDPOINT);
  url.searchParams.set('time_range', timeRange);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.items.map(track => ({
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    url: track.external_urls.spotify,
    image: track.album.images[1]?.url || track.album.images[0]?.url || '',
    duration: track.duration_ms,
    popularity: track.popularity,
  }));
}

async function getRecentlyPlayedWithDetails(token, limit = 50) {
  const url = new URL(RECENTLY_PLAYED_ENDPOINT);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.items.map(item => ({
    name: item.track.name,
    artist: item.track.artists.map(a => a.name).join(', '),
    album: item.track.album.name,
    url: item.track.external_urls.spotify,
    image: item.track.album.images[2]?.url || item.track.album.images[0]?.url || '',
    duration: item.track.duration_ms,
    playedAt: item.played_at,
  }));
}

function computeStats(recentTracks) {
  if (!recentTracks.length) return null;

  // Total listening time
  const totalDuration = recentTracks.reduce((sum, t) => sum + t.duration, 0);

  // Artist frequency
  const artistCounts = {};
  recentTracks.forEach(t => {
    const artist = t.artist.split(', ')[0]; // Primary artist
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  });

  // Most played artist from recent
  const topRecentArtist = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])[0];

  // Listening by hour
  const hourCounts = new Array(24).fill(0);
  recentTracks.forEach(t => {
    const hour = new Date(t.playedAt).getHours();
    hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    totalTracks: recentTracks.length,
    totalDurationMs: totalDuration,
    totalMinutes: Math.round(totalDuration / 60000),
    uniqueArtists: Object.keys(artistCounts).length,
    topRecentArtist: topRecentArtist ? { name: topRecentArtist[0], count: topRecentArtist[1] } : null,
    peakListeningHour: peakHour,
    avgTrackDuration: Math.round(totalDuration / recentTracks.length / 1000),
  };
}

export async function GET({ locals, request }) {
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('time_range') || 'short_term'; // short_term, medium_term, long_term

  const runtime = locals.runtime;
  const clientId = runtime?.env?.SPOTIFY_CLIENT_ID || import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = runtime?.env?.SPOTIFY_CLIENT_SECRET || import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = runtime?.env?.SPOTIFY_REFRESH_TOKEN || import.meta.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return new Response(
      JSON.stringify({ error: 'Missing credentials' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const token = await getAccessToken(clientId, clientSecret, refreshToken);

    const [topArtists, topTracks, recentTracks] = await Promise.all([
      getTopArtists(token, timeRange, 10),
      getTopTracks(token, timeRange, 10),
      getRecentlyPlayedWithDetails(token, 50),
    ]);

    const stats = computeStats(recentTracks);

    return new Response(JSON.stringify({
      topArtists,
      topTracks,
      recentTracks,
      stats,
      timeRange,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300, s-maxage=300',
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stats', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

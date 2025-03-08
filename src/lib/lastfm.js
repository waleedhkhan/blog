/**
 * LastFM API client with type-safe JSDoc annotations
 * Follows Bauhaus design principles: minimal, functional, and efficient
 */

/**
 * @typedef {Object} LastFMTrack
 * @property {string} name - The track name
 * @property {string} url - URL to the track on LastFM
 * @property {Object} artist - Track artist information
 * @property {string} artist.name - Artist name
 * @property {string} artist.url - URL to the artist on LastFM
 * @property {Object} album - Track album information
 * @property {string} album.name - Album name
 * @property {string} [album.image] - URL to album artwork (last image in array)
 * @property {string} date - When the track was played (unix timestamp or relative time)
 */

/**
 * @typedef {Object} LastFMUserInfo
 * @property {string} name - LastFM username
 * @property {string} url - URL to user profile
 * @property {number} playcount - Total play count
 * @property {string} country - User's country
 * @property {string} [image] - URL to user avatar
 */

/**
 * Fetches recently played tracks from LastFM API
 * 
 * @param {string} username - LastFM username
 * @param {string} apiKey - LastFM API key
 * @param {number} [limit=10] - Number of tracks to fetch (max 200)
 * @returns {Promise<LastFMTrack[]>} Array of recent tracks
 * @throws {Error} If the API request fails
 */
export async function getRecentTracks(username, apiKey, limit = 10) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: username,
    api_key: apiKey,
    format: 'json',
    limit: limit.toString()
  }).toString();

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`LastFM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.recenttracks || !data.recenttracks.track) {
      return [];
    }
    
    /** @type {LastFMTrack[]} */
    const tracks = Array.isArray(data.recenttracks.track) 
      ? data.recenttracks.track 
      : [data.recenttracks.track];
    
    return tracks.map(track => ({
      name: track.name,
      url: track.url,
      artist: {
        name: track.artist['#text'],
        url: `https://www.last.fm/music/${encodeURIComponent(track.artist['#text'])}`
      },
      album: {
        name: track.album['#text'],
        image: track.image && track.image.length > 0 ? track.image[track.image.length - 1]['#text'] : null
      },
      date: track.date ? track.date.uts || track.date['#text'] : 'Now playing'
    }));
  } catch (error) {
    console.error('Error fetching LastFM data:', error);
    throw error;
  }
}

/**
 * Fetches user profile information from LastFM API
 * 
 * @param {string} username - LastFM username
 * @param {string} apiKey - LastFM API key
 * @returns {Promise<LastFMUserInfo>} User profile information
 * @throws {Error} If the API request fails
 */
export async function getUserInfo(username, apiKey) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({
    method: 'user.getinfo',
    user: username,
    api_key: apiKey,
    format: 'json'
  }).toString();

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`LastFM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.user) {
      throw new Error('User information not found');
    }
    
    return {
      name: data.user.name,
      url: data.user.url,
      playcount: parseInt(data.user.playcount, 10),
      country: data.user.country,
      image: data.user.image && data.user.image.length > 0 
        ? data.user.image[data.user.image.length - 1]['#text'] 
        : null
    };
  } catch (error) {
    console.error('Error fetching LastFM user data:', error);
    throw error;
  }
}

/**
 * Formats a relative time string from a LastFM date
 * 
 * @param {string} timestamp - Unix timestamp or date string from LastFM
 * @returns {string} Human-readable relative time (e.g., "2 hours ago")
 */
export function formatLastFMDate(timestamp) {
  if (!timestamp || timestamp === 'Now playing') {
    return 'Now playing';
  }
  
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
}

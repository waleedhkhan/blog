export async function onRequest(context) {
  try {
    // Get environment variables from Cloudflare
    const LASTFM_API_KEY = context.env.LASTFM_API_KEY;
    const LASTFM_USERNAME = "waleedhkhan";

    if (!LASTFM_API_KEY) {
      throw new Error("LastFM API key is not configured");
    }

    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=6`,
      {
        headers: {
          Accept: "application/json",
        },
        cf: {
          cacheTtl: 60, // Cache for 1 minute on Cloudflare's edge
          cacheEverything: true,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.recenttracks?.track) {
      throw new Error("Unexpected API response structure");
    }

    const tracks = data.recenttracks.track.map((track) => ({
      name: track.name || "Unknown Track",
      artist: track.artist?.["#text"] || "Unknown Artist",
      url: track.url || "#",
      image: track.image?.[2]?.["#text"] || "https://via.placeholder.com/64",
    }));

    // Return the tracks as JSON
    return new Response(JSON.stringify(tracks), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error fetching LastFM data:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch recent tracks",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

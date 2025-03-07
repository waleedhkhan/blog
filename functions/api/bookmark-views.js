// Cloudflare Worker function to track bookmark views
export async function onRequest(context) {
  // Get environment context
  const { request, env } = context;
  
  // Set up CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Get the request body
  let body;
  try {
    if (request.method === "POST") {
      body = await request.json();
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // KV namespace for bookmark views
  // Note: You need to create a KV namespace in Cloudflare dashboard
  // and bind it to 'BOOKMARK_VIEWS' in your wrangler.toml
  const kv = env.BOOKMARK_VIEWS;
  if (!kv) {
    return new Response(
      JSON.stringify({ error: "KV namespace not configured" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Process GET and POST requests
  try {
    if (request.method === "GET") {
      // Get bookmarkId from URL parameters
      const url = new URL(request.url);
      const bookmarkId = url.searchParams.get("id");
      
      if (!bookmarkId) {
        return new Response(
          JSON.stringify({ error: "Missing bookmark ID" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
      
      // Get current view count from KV
      let viewCount = await kv.get(`bookmark:${bookmarkId}`);
      
      // Return view count (default to 0 if not found)
      return new Response(
        JSON.stringify({ id: bookmarkId, views: parseInt(viewCount || "0") }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else if (request.method === "POST") {
      // Extract bookmark ID from body
      const { id: bookmarkId } = body;
      
      if (!bookmarkId) {
        return new Response(
          JSON.stringify({ error: "Missing bookmark ID" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
      
      // Get current view count
      let viewCount = await kv.get(`bookmark:${bookmarkId}`);
      
      // Increment view count
      const newCount = parseInt(viewCount || "0") + 1;
      
      // Store new view count
      await kv.put(`bookmark:${bookmarkId}`, newCount.toString());
      
      // Return updated view count
      return new Response(
        JSON.stringify({ id: bookmarkId, views: newCount }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
}

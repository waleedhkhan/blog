import type { APIRoute } from "astro";

export const get: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;

  try {
    // Increment visitor count
    await db.prepare(
      "UPDATE visitors SET count = count + 1, last_visit = CURRENT_TIMESTAMP WHERE id = 1"
    ).run();

    // Get current count
    const result = await db.prepare("SELECT count FROM visitors WHERE id = 1").first();
    
    return new Response(JSON.stringify({ count: result.count }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update visitors" }), {
      status: 500
    });
  }
};

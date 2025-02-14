interface Env {
  VISITORS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const currentCount = await env.VISITORS.get('total', 'json') || 0;
    const newCount = parseInt(currentCount.toString()) + 1;
    
    await env.VISITORS.put('total', JSON.stringify(newCount));

    return new Response(JSON.stringify({ count: newCount }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  },
};

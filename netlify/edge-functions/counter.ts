export default async function handler(request: Request) {
  const url = new URL(request.url);
  const store = await import('@netlify/edge-functions').then(m => m.store);

  // Get current count
  const currentCount = await store.get('visitorCount') || 0;
  
  // Increment count only for GET requests to the main page
  if (request.method === 'GET' && url.pathname === '/') {
    await store.set('visitorCount', parseInt(currentCount) + 1);
  }

  return new Response(JSON.stringify({ count: currentCount }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

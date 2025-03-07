// Heart Bookmarks Cloudflare Worker
import { Router } from 'itty-router';
import { v4 as uuidv4 } from 'uuid';

// Create a new router
const router = Router();

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper to handle CORS preflight requests
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  });
}

// Helper to handle responses with proper headers
function handleResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    status,
  });
}

// Helper to extract user token from Authorization header
function getUserToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return token || 'anonymous';
}

// Middleware to validate requests
async function validateRequest(request, env) {
  const userToken = getUserToken(request);
  // Simple validation - in a real app, you'd have more robust auth
  if (!userToken || userToken === 'anonymous') {
    // Allow anonymous users but track them separately
    return { valid: true, userToken };
  }
  return { valid: true, userToken };
}

// Route to check if a URL is already bookmarked
router.get('/check', async (request, env) => {
  try {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return handleResponse({ success: false, error: 'URL is required' }, 400);
    }

    const userToken = getUserToken(request);
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    const bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Check if URL exists in bookmarks
    const isBookmarked = bookmarksList.some(bookmark => bookmark.url === url);
    
    return handleResponse({ success: true, isBookmarked });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Route to save a new bookmark
router.post('/bookmarks', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Parse request body
    const bookmarkData = await request.json();
    
    // Validate bookmark data
    if (!bookmarkData.url || !bookmarkData.title) {
      return handleResponse({ success: false, error: 'URL and title are required' }, 400);
    }
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    const bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Check if URL already exists in bookmarks
    const existingIndex = bookmarksList.findIndex(bookmark => bookmark.url === bookmarkData.url);
    
    // Generate unique ID for new bookmark
    const bookmarkId = uuidv4();
    
    if (existingIndex !== -1) {
      // Update existing bookmark
      bookmarksList[existingIndex] = {
        ...bookmarksList[existingIndex],
        ...bookmarkData,
        id: bookmarksList[existingIndex].id,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new bookmark
      bookmarksList.push({
        ...bookmarkData,
        id: bookmarkId,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Save updated bookmarks list
    await env.BOOKMARKS_KV.put(userBookmarksKey, JSON.stringify(bookmarksList));
    
    // Update global stats
    const statsKey = 'global:stats';
    const stats = await env.BOOKMARKS_KV.get(statsKey, { type: 'json' }) || { totalBookmarks: 0, totalUsers: 0 };
    
    if (existingIndex === -1) {
      stats.totalBookmarks += 1;
    }
    
    await env.BOOKMARKS_KV.put(statsKey, JSON.stringify(stats));
    
    // Return success response
    return handleResponse({ 
      success: true, 
      message: existingIndex !== -1 ? 'Bookmark updated' : 'Bookmark saved',
      bookmarkId: existingIndex !== -1 ? bookmarksList[existingIndex].id : bookmarkId 
    });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Route to get recent bookmarks for a user
router.get('/bookmarks/recent', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    const bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Sort by creation date (newest first) and limit to 10
    const recentBookmarks = bookmarksList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    return handleResponse({ success: true, bookmarks: recentBookmarks });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Route to get all bookmarks for a user
router.get('/bookmarks', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get categories filter (optional)
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    let bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Apply category filter if specified
    if (category) {
      bookmarksList = bookmarksList.filter(bookmark => bookmark.category === category);
    }
    
    // Sort by creation date (newest first)
    bookmarksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBookmarks = bookmarksList.slice(startIndex, endIndex);
    
    // Calculate total pages
    const totalPages = Math.ceil(bookmarksList.length / pageSize);
    
    return handleResponse({
      success: true,
      bookmarks: paginatedBookmarks,
      pagination: {
        page,
        pageSize,
        totalItems: bookmarksList.length,
        totalPages,
      },
    });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Route to delete a bookmark
router.delete('/bookmarks/:id', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const { id } = request.params;
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    const bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Find bookmark index
    const bookmarkIndex = bookmarksList.findIndex(bookmark => bookmark.id === id);
    
    if (bookmarkIndex === -1) {
      return handleResponse({ success: false, error: 'Bookmark not found' }, 404);
    }
    
    // Remove bookmark from list
    bookmarksList.splice(bookmarkIndex, 1);
    
    // Save updated bookmarks list
    await env.BOOKMARKS_KV.put(userBookmarksKey, JSON.stringify(bookmarksList));
    
    // Update global stats
    const statsKey = 'global:stats';
    const stats = await env.BOOKMARKS_KV.get(statsKey, { type: 'json' }) || { totalBookmarks: 0, totalUsers: 0 };
    stats.totalBookmarks -= 1;
    await env.BOOKMARKS_KV.put(statsKey, JSON.stringify(stats));
    
    return handleResponse({ success: true, message: 'Bookmark deleted' });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Route to get available categories
router.get('/categories', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's bookmarks
    const userBookmarksKey = `user:${userToken}:bookmarks`;
    const bookmarksList = await env.BOOKMARKS_KV.get(userBookmarksKey, { type: 'json' }) || [];
    
    // Extract unique categories
    const categories = [...new Set(bookmarksList.map(bookmark => bookmark.category))];
    
    // Count bookmarks per category
    const categoryCounts = categories.map(category => {
      const count = bookmarksList.filter(bookmark => bookmark.category === category).length;
      return { category, count };
    });
    
    return handleResponse({ success: true, categories: categoryCounts });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Handle CORS preflight requests
router.options('*', handleOptions);

// Default route (not found)
router.all('*', () => handleResponse({ success: false, error: 'Route not found' }, 404));

// Main worker event handler
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request, event.env));
});

// Scheduled task to clean up old data (if needed)
addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event.scheduledTime, event.env));
});

// Function to handle scheduled tasks
async function handleScheduled(scheduledTime, env) {
  console.log('Running scheduled task:', scheduledTime);
  
  // Example: clean up old anonymous user data
  // In a real app, you might want to implement data cleanup logic here
}

// Function for the sync endpoint (called from Chrome extension)
router.post('/sync', async (request, env) => {
  try {
    // Validate request
    const { valid, userToken } = await validateRequest(request, env);
    if (!valid) {
      return handleResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // In a real app, you'd implement sync logic here
    // For now, we'll just return success
    return handleResponse({ success: true, message: 'Sync completed' });
  } catch (error) {
    return handleResponse({ success: false, error: error.message }, 500);
  }
});

// Export for Cloudflare Workers
export default {
  fetch: (request, env, ctx) => router.handle(request, env, ctx),
  scheduled: (controller, env, ctx) => handleScheduled(controller.scheduledTime, env, ctx),
};

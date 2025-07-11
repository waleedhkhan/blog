import { defineMiddleware, type MiddlewareHandler } from 'astro';

/**
 * Generate a random nonce for Content Security Policy (CSP)
 * @returns A random nonce string
 */
const generateNonce = (): string => {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Security headers middleware for Astro
 * Applies security best practices by setting various HTTP headers
 */
const securityHeaders: MiddlewareHandler = async ({ request, next }) => {
  // Call the next middleware and get the response
  const response = await next();
  
  // Skip non-HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }

  // Create a new response with the original body and status
  const newResponse = new Response(response.body, response);
  const headers = new Headers(newResponse.headers);
  
  // Generate a new nonce for this request
  const nonce = generateNonce();
  
  // Add the nonce to the response headers for use in templates
  headers.set('X-Nonce', nonce);
  
  // Security Headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '0'); // Disable XSS Auditor (deprecated but still used by some browsers)
  
  // CSP Header - Configured with security in mind while allowing necessary functionality
  const csp = [
    // Default policy for all content types
    "default-src 'self'",
    
    // JavaScript sources
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval' https: http:`, // 'strict-dynamic' allows dynamically injected scripts
    "script-src-attr 'none'", // Prevents inline event handlers
    `script-src-elem 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://analytics.umami.is`,
    
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'style-src-attr \'self\' \'unsafe-inline\'',
    'style-src-elem \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
    
    // Images, media, and fonts
    `img-src 'self' data: blob: https: http: ${new URL(request.url).origin}`,
    'media-src \'self\' data: https:',
    'font-src \'self\' data: https://fonts.gstatic.com',
    
    // Connections
    `connect-src 'self' ${new URL(request.url).origin} wss: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://ws.audioscrobbler.com https://analytics.umami.is`,
    
    // Frames and workers
    'frame-src \'self\' https://www.youtube-nocookie.com https://player.vimeo.com',
    'worker-src \'self\' blob:',
    'child-src \'self\' blob:',
    
    // Forms and navigation
    'form-action \'self\'',
    'base-uri \'self\'',
    'navigate-to \'self\'',
    
    // Other resources
    'manifest-src \'self\'',
    'object-src \'none\'', // Prevents dangerous plugins
    'frame-ancestors \'none\'', // Prevents clickjacking
    
    // Additional security
    'upgrade-insecure-requests', // Upgrade HTTP to HTTPS
    'block-all-mixed-content' // Prevent loading mixed content
  ].join('; ');
  
  // Set security headers
  headers.set('Content-Security-Policy', csp);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-site');
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('Permissions-Policy', [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'execution-while-not-rendered=()',
    'execution-while-out-of-viewport=()',
    'fullscreen=()',
    'geolocation=()',
    'gyroscope=()',
    'keyboard-map=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'navigation-override=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()'
  ].join(', '));
  
  // Set all headers and return the new response
  return new Response(newResponse.body, {
    status: newResponse.status,
    statusText: newResponse.statusText,
    headers
  });
};

// Export the middleware
export const onRequest = defineMiddleware(securityHeaders);

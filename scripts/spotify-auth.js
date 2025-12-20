#!/usr/bin/env node

/**
 * Spotify OAuth Authorization Script
 *
 * This script helps you get a Spotify refresh token for your application.
 * Run it once to authorize your Spotify account and get the refresh token.
 *
 * Usage:
 *   1. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file
 *   2. Run: node scripts/spotify-auth.js
 *   3. Authorize in the browser
 *   4. Copy the refresh token to your .env file
 */

import http from 'http';
import { URL } from 'url';
import open from 'open';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:8888';
const SCOPES = [
  'user-read-recently-played',
  'user-read-currently-playing',
].join(' ');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\x1b[31mError: Missing Spotify credentials!\x1b[0m\n');
  console.log('Please add the following to your .env file:');
  console.log('  SPOTIFY_CLIENT_ID=your_client_id');
  console.log('  SPOTIFY_CLIENT_SECRET=your_client_secret\n');
  console.log('Get your credentials at: https://developer.spotify.com/dashboard');
  process.exit(1);
}

// Generate random state for security
const state = Math.random().toString(36).substring(2, 15);

// Build authorization URL
const authUrl = new URL('https://accounts.spotify.com/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('state', state);

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Start local server to receive callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/' || url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1 style="color: #e53e3e;">Authorization Failed</h1>
            <p>Error: ${error}</p>
          </body>
        </html>
      `);
      console.error('\n\x1b[31mAuthorization failed:\x1b[0m', error);
      server.close();
      process.exit(1);
    }

    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1 style="color: #e53e3e;">Security Error</h1>
            <p>State mismatch. Please try again.</p>
          </body>
        </html>
      `);
      console.error('\n\x1b[31mState mismatch - possible CSRF attack\x1b[0m');
      server.close();
      process.exit(1);
    }

    try {
      const tokens = await exchangeCodeForTokens(code);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1 style="color: #38a169;">Authorization Successful!</h1>
            <p>You can close this window and return to the terminal.</p>
          </body>
        </html>
      `);

      console.log('\n\x1b[32m✓ Authorization successful!\x1b[0m\n');
      console.log('Add this to your .env file:\n');
      console.log('\x1b[36m┌─────────────────────────────────────────────────────────────┐\x1b[0m');
      console.log(`\x1b[36m│\x1b[0m SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\x1b[36m└─────────────────────────────────────────────────────────────┘\x1b[0m\n');

      server.close();
      process.exit(0);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; text-align: center;">
            <h1 style="color: #e53e3e;">Token Exchange Failed</h1>
            <p>${err.message}</p>
          </body>
        </html>
      `);
      console.error('\n\x1b[31mToken exchange failed:\x1b[0m', err.message);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8888, () => {
  console.log('\n\x1b[34m╔═══════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[34m║\x1b[0m           Spotify Authorization Helper                        \x1b[34m║\x1b[0m');
  console.log('\x1b[34m╚═══════════════════════════════════════════════════════════════╝\x1b[0m\n');
  console.log('Opening browser for Spotify authorization...\n');
  console.log('If the browser doesn\'t open, visit this URL:');
  console.log(`\x1b[36m${authUrl.toString()}\x1b[0m\n`);

  open(authUrl.toString());
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\x1b[31mError: Port 8888 is already in use.\x1b[0m');
    console.error('Please close the application using that port and try again.');
  } else {
    console.error('\x1b[31mServer error:\x1b[0m', err.message);
  }
  process.exit(1);
});

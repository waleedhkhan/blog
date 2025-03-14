#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto'; 
import { format, parseISO } from 'date-fns';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');

// Category mapping to standardize categories
const CATEGORY_MAPPING = {
  'resource': 'resource',
  'project': 'project',
  'web design': 'design',
  'article': 'article',
  'inspiration': 'inspiration',
  'book': 'book',
  'app': 'tool'
};

// Helper function to map category
function mapCategory(originalCategory) {
  const lower = originalCategory.toLowerCase();
  return CATEGORY_MAPPING[lower] || 'resource';
}

// Helper function to extract text from HTML
function extractTextFromHtml(html) {
  if (!html) return '';
  try {
    const $ = cheerio.load(html);
    return $.text().trim();
  } catch (error) {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

// Process the JSON feed data
async function processJsonFeed(jsonData) {
  const { items } = jsonData;
  
  // Load existing bookmarks
  const bookmarksFile = await fs.readFile(BOOKMARKS_PATH, 'utf8');
  const { bookmarks: existingBookmarks } = JSON.parse(bookmarksFile);
  
  // Create set of existing URLs to avoid duplicates
  const existingUrls = new Set(existingBookmarks.map(b => b.url));
  
  // Process each item from the feed
  const newBookmarks = items.map(item => {
    // Extract tag from content HTML
    let category = 'resource';
    if (item.content_html) {
      const $ = cheerio.load(item.content_html);
      const tagText = $('li:contains("Tag:")').text();
      if (tagText) {
        const tagMatch = tagText.match(/Tag: ([^\s]+)/);
        if (tagMatch && tagMatch[1]) {
          category = mapCategory(tagMatch[1]);
        }
      }
    }
    
    // Format date
    const date = item.date_published ? item.date_published.split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Extract description if available
    let description = '';
    if (item.content_html) {
      const $ = cheerio.load(item.content_html);
      const viaText = $('li:contains("Via")').text();
      if (viaText) {
        description = viaText.replace('Via', 'Via:').trim();
      }
    }
    
    // Create bookmark object
    return {
      id: crypto.randomUUID(),
      name: item.title,
      url: item.url,
      category,
      description: description || extractTextFromHtml(item.content_html) || 'Interesting bookmark',
      date,
      timestamp: item.date_published || new Date().toISOString()
    };
  });
  
  // Filter out bookmarks with URLs that already exist
  const uniqueNewBookmarks = newBookmarks.filter(bookmark => !existingUrls.has(bookmark.url));
  
  // Combine with existing bookmarks
  const updatedBookmarks = {
    bookmarks: [...uniqueNewBookmarks, ...existingBookmarks]
  };
  
  // Save to file
  await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(updatedBookmarks, null, 2));
  
  return {
    total: newBookmarks.length,
    added: uniqueNewBookmarks.length,
    skipped: newBookmarks.length - uniqueNewBookmarks.length
  };
}

// Main function
async function main() {
  try {
    // Read the JSON feed data from file
    const jsonFeedPath = path.join(__dirname, '../temp-bookmarks.json');
    
    try {
      await fs.access(jsonFeedPath);
    } catch (error) {
      console.error('Bookmarks JSON file not found. Please save the JSON feed as temp-bookmarks.json in the root directory.');
      process.exit(1);
    }
    
    const rawData = await fs.readFile(jsonFeedPath, 'utf8');
    
    // Parse the JSON feed data
    const jsonData = JSON.parse(rawData);
    
    // Process the data and update bookmarks
    const result = await processJsonFeed(jsonData);
    
    console.log(`Processed ${result.total} bookmarks`);
    console.log(`Added ${result.added} new bookmarks`);
    console.log(`Skipped ${result.skipped} duplicate bookmarks`);
    
    // Clean up temp file
    await fs.unlink(jsonFeedPath);
    console.log('Temp file cleaned up');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

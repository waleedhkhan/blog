#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import fetch from 'node-fetch';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// More comprehensive category mapping
const CATEGORY_MAPPING = {
  'resource': 'resource',
  'project': 'project',
  'web design': 'design',
  'design': 'design',
  'article': 'article', 
  'inspiration': 'inspiration',
  'book': 'book',
  'app': 'tool',
  'tool': 'tool',
  'ai': 'ai'
};

// Refined category detection based on URL and title
function detectCategory(url, title, originalCategory) {
  // Map the original category first if it exists
  if (originalCategory) {
    const mappedCategory = mapCategory(originalCategory);
    if (mappedCategory) return mappedCategory;
  }
  
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Detect AI-related
  if (
    urlLower.includes('ai') || 
    titleLower.includes('ai') || 
    titleLower.includes('artificial intelligence') ||
    titleLower.includes('machine learning') ||
    titleLower.includes('gpt') ||
    titleLower.includes('llm')
  ) {
    return 'ai';
  }
  
  // Detect design-related
  if (
    urlLower.includes('design') || 
    titleLower.includes('design') ||
    titleLower.includes('ui') ||
    titleLower.includes('ux') ||
    titleLower.includes('typography')
  ) {
    return 'design';
  }
  
  // Detect articles
  if (
    urlLower.includes('blog') ||
    urlLower.includes('article') ||
    urlLower.includes('journal') ||
    urlLower.includes('post')
  ) {
    return 'article';
  }
  
  // Detect tools
  if (
    urlLower.includes('app') ||
    titleLower.includes('app') ||
    titleLower.includes('tool')
  ) {
    return 'tool';
  }
  
  // Detect inspiration
  if (
    titleLower.includes('inspiration') ||
    urlLower.includes('gallery') ||
    urlLower.includes('showcase')
  ) {
    return 'inspiration';
  }
  
  // Default to the original mapped category or 'resource'
  return mapCategory(originalCategory) || 'resource';
}

// Helper function to map category
function mapCategory(originalCategory) {
  if (!originalCategory) return null;
  const lower = originalCategory.toLowerCase();
  return CATEGORY_MAPPING[lower] || null;
}

// Extract clean description
function extractCleanDescription(html) {
  if (!html) return '';
  try {
    const $ = cheerio.load(html);
    
    // Remove any "Via:" text to clean up
    $('li:contains("Via")').remove();
    $('li:contains("Tag:")').remove();
    $('li:contains("Added:")').remove();
    
    // Get remaining text
    const cleanText = $.text().trim();
    return cleanText || '';
  } catch (error) {
    return '';
  }
}

// Fetch metadata from website
async function fetchMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      },
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract metadata
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text() || '';
                  
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') || 
                        $('meta[name="twitter:description"]').attr('content') || '';
    
    return {
      title: title.trim(),
      description: description.trim()
    };
  } catch (error) {
    console.log(`Error fetching metadata for ${url}: ${error.message}`);
    return null;
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
  const newBookmarks = [];
  
  console.log(`Processing ${items.length} bookmarks. This may take some time...`);
  
  // Process in batches to avoid overwhelming the network
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (item, index) => {
      try {
        // Skip if URL already exists
        if (existingUrls.has(item.url)) {
          return null;
        }
        
        // Extract tag from content HTML
        let originalCategory = null;
        if (item.content_html) {
          const $ = cheerio.load(item.content_html);
          const tagText = $('li:contains("Tag:")').text();
          if (tagText) {
            const tagMatch = tagText.match(/Tag: ([^<]+)/);
            if (tagMatch && tagMatch[1]) {
              originalCategory = tagMatch[1].trim();
            }
          }
        }
        
        // Format date
        const date = item.date_published ? item.date_published.split('T')[0] : new Date().toISOString().split('T')[0];
        
        // Try to fetch metadata from the actual website
        let metadata = null;
        try {
          metadata = await fetchMetadata(item.url);
          console.log(`[${i + index + 1}/${items.length}] Fetched metadata for: ${item.title}`);
        } catch (error) {
          console.log(`[${i + index + 1}/${items.length}] Failed to fetch metadata for: ${item.title}`);
        }
        
        // Use original or fetched data
        const name = (metadata && metadata.title) || item.title;
        let description = '';
        
        if (metadata && metadata.description) {
          description = metadata.description;
        } else {
          description = extractCleanDescription(item.content_html) || 'Interesting bookmark';
        }
        
        // Determine the best category
        const category = detectCategory(item.url, name, originalCategory);
        
        // Create bookmark object matching the existing schema
        return {
          id: crypto.randomUUID(),
          name,
          url: item.url,
          category,
          description,
          date,
          timestamp: item.date_published || new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error processing bookmark ${item.title}: ${error.message}`);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    // Filter out nulls (skipped or errored bookmarks)
    newBookmarks.push(...batchResults.filter(bookmark => bookmark !== null));
    
    // Small delay between batches to be nice to servers
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Sort all bookmarks by timestamp, newest first
  const updatedBookmarks = {
    bookmarks: [...newBookmarks, ...existingBookmarks].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
  };
  
  // Save to file
  await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(updatedBookmarks, null, 2));
  
  return {
    total: items.length,
    added: newBookmarks.length,
    skipped: items.length - newBookmarks.length
  };
}

// Main function
async function main() {
  try {
    // Read the JSON feed data directly from import-bookmark.sjon
    try {
      await fs.access(IMPORT_PATH);
    } catch (error) {
      console.error(`Import file not found at ${IMPORT_PATH}`);
      process.exit(1);
    }
    
    console.log(`Reading import file: ${IMPORT_PATH}`);
    const rawData = await fs.readFile(IMPORT_PATH, 'utf8');
    
    // Parse the JSON feed data
    const jsonData = JSON.parse(rawData);
    
    console.log('Starting import process...');
    // Process the data and update bookmarks
    const result = await processJsonFeed(jsonData);
    
    console.log(`\nImport Summary:`);
    console.log(`Processed ${result.total} bookmarks`);
    console.log(`Added ${result.added} new bookmarks`);
    console.log(`Skipped ${result.skipped} duplicate bookmarks`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

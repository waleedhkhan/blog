#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const BACKUP_PATH = path.join(__dirname, '../src/data/bookmarks.backup.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Comprehensive category mapping aligned with the site's schema
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

// Refined category detection based on tag, URL, and title
function detectCategory(tag, url, title) {
  // First try to map the tag directly
  if (tag) {
    const mappedTag = mapTag(tag);
    if (mappedTag) return mappedTag;
  }
  
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Detect AI-related
  if (
    urlLower.includes('ai') || 
    urlLower.includes('gpt') ||
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
  
  // Default to resource if nothing else matches
  return 'resource';
}

// Helper function to map tags
function mapTag(tag) {
  if (!tag) return null;
  const lower = tag.toLowerCase().trim();
  return CATEGORY_MAPPING[lower] || null;
}

// Extract "Via" information from HTML content
function extractViaInfo(html) {
  if (!html) return '';
  try {
    const $ = cheerio.load(html);
    
    // Look for Via information in list items
    const viaElement = $('li:contains("Via")');
    if (viaElement.length > 0) {
      const viaText = viaElement.text().trim();
      // Extract the source name from the Via text
      const viaMatch = viaText.match(/Via\s+([^<]+)/);
      if (viaMatch && viaMatch[1]) {
        return `Via: ${viaMatch[1].trim()}`;
      }
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Extract tag from HTML
function extractTag(html) {
  if (!html) return null;
  try {
    const $ = cheerio.load(html);
    const tagText = $('li:contains("Tag:")').text();
    if (tagText) {
      const tagMatch = tagText.match(/Tag:\s*([^<\s]+)/);
      if (tagMatch && tagMatch[1]) {
        return tagMatch[1].trim();
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Generate a cleaner description
function generateDescription(viaInfo, originalTitle) {
  if (viaInfo) {
    return viaInfo;
  }
  
  // If no via info, generate a simple description
  return `Link: ${originalTitle}`;
}

// Process the JSON feed data
async function processJsonFeed(jsonData) {
  const { items } = jsonData;
  
  // Load original bookmarks (before the first import)
  const bookmarksFile = await fs.readFile(BACKUP_PATH, 'utf8');
  const { bookmarks: originalBookmarks } = JSON.parse(bookmarksFile);
  
  // Create set of existing URLs to avoid duplicates
  const existingUrls = new Set(originalBookmarks.map(b => b.url));
  
  console.log(`Processing ${items.length} bookmarks...`);
  
  // Process all items
  const newBookmarks = items.map((item, index) => {
    try {
      // Skip if already in original bookmarks
      if (existingUrls.has(item.url)) {
        return null;
      }
      
      // Extract tag from content
      const tag = extractTag(item.content_html);
      
      // Format date and timestamp
      const date = item.date_published ? item.date_published.split('T')[0] : new Date().toISOString().split('T')[0];
      const timestamp = item.date_published || new Date().toISOString();
      
      // Extract via information
      const viaInfo = extractViaInfo(item.content_html);
      
      // Generate appropriate description
      const description = generateDescription(viaInfo, item.title);
      
      // Determine the best category
      const category = detectCategory(tag, item.url, item.title);
      
      if ((index + 1) % 50 === 0) {
        console.log(`Processed ${index + 1}/${items.length} bookmarks`);
      }
      
      // Create bookmark object matching the existing schema
      return {
        id: crypto.randomUUID(),
        name: item.title,
        url: item.url,
        category,
        description,
        date,
        timestamp
      };
    } catch (error) {
      console.error(`Error processing bookmark ${item.title}: ${error.message}`);
      return null;
    }
  }).filter(bookmark => bookmark !== null);
  
  // Sort all bookmarks by timestamp, newest first
  const updatedBookmarks = {
    bookmarks: [...newBookmarks, ...originalBookmarks].sort((a, b) => 
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
    // Check if backup file exists
    try {
      await fs.access(BACKUP_PATH);
    } catch (error) {
      console.error('Backup file not found. Please restore the original bookmarks first.');
      process.exit(1);
    }
    
    // Check if import file exists
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

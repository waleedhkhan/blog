#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Simplified category mapping aligned with site's minimal design approach
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

// Smart categorization based on tag, content, and URL patterns
function determineCategory(tag, url, title) {
  // First check if the tag directly maps
  if (tag && CATEGORY_MAPPING[tag.toLowerCase()]) {
    return CATEGORY_MAPPING[tag.toLowerCase()];
  }
  
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // AI content detection
  if (
    /\bai\b|\bartificial intelligence\b|\bgpt\b|\bllm\b|\bmachine learning\b/.test(urlLower + ' ' + titleLower)
  ) {
    return 'ai';
  }
  
  // Design content detection
  if (
    /\bdesign\b|\bui\b|\bux\b|\btypography\b|\bfont\b|\bstudio\b|\bvisual\b/.test(urlLower + ' ' + titleLower)
  ) {
    return 'design';
  }
  
  // Article/blog content
  if (
    /\bblog\b|\barticle\b|\bjournal\b|\bpost\b|\breport\b|\bcase study\b/.test(urlLower) ||
    urlLower.includes('/blog/') || 
    urlLower.includes('/article/') ||
    urlLower.includes('/journal/')
  ) {
    return 'article';
  }
  
  // Tools and apps
  if (
    /\bapp\b|\btool\b|\bsoftware\b|\bplatform\b|\bframework\b|\blibrary\b/.test(urlLower + ' ' + titleLower) ||
    urlLower.endsWith('.app') ||
    urlLower.includes('github.com')
  ) {
    return 'tool';
  }
  
  // Inspiration
  if (
    /\binspiration\b|\bgallery\b|\bshowcase\b|\bartist\b|\bcreative\b/.test(urlLower + ' ' + titleLower)
  ) {
    return 'inspiration';
  }
  
  // Project detection
  if (
    /\bproject\b|\bportfolio\b|\bcase study\b|\bwork\b/.test(urlLower + ' ' + titleLower) ||
    /\/projects\//.test(urlLower)
  ) {
    return 'project';
  }
  
  // Book detection
  if (
    /\bbook\b|\bpublication\b|\breading\b/.test(urlLower + ' ' + titleLower)
  ) {
    return 'book';
  }
  
  // If we have a tag but it doesn't map directly, try to infer from it
  if (tag) {
    const tagLower = tag.toLowerCase();
    if (/inspir/.test(tagLower)) return 'inspiration';
    if (/design|typography|font|ui|ux/.test(tagLower)) return 'design';
    if (/article|blog|post|story/.test(tagLower)) return 'article';
    if (/project|work|portfolio/.test(tagLower)) return 'project';
    if (/tool|app|software/.test(tagLower)) return 'tool';
    if (/ai|machine|intelligence|gpt/.test(tagLower)) return 'ai';
    if (/book|read|publication/.test(tagLower)) return 'book';
  }
  
  // Default to resource
  return 'resource';
}

// Extract tag from HTML content
function extractTag(html) {
  if (!html) return null;
  try {
    const $ = cheerio.load(html);
    const tagText = $('li:contains("Tag:")').text();
    if (tagText) {
      const tagMatch = tagText.match(/Tag:\s*([^<\n]+)/);
      if (tagMatch && tagMatch[1]) {
        return tagMatch[1].trim();
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Extract clean via information
function extractViaInfo(html) {
  if (!html) return '';
  try {
    const $ = cheerio.load(html);
    
    // Find "Via" text in list items
    const viaElement = $('li:contains("Via")');
    if (viaElement.length > 0) {
      // Extract the name of the source
      const sourceLink = viaElement.find('a');
      if (sourceLink.length > 0) {
        return `Via: ${sourceLink.text().trim()}`;
      } else {
        // Extract from plain text
        const viaText = viaElement.text().trim();
        const viaMatch = viaText.match(/Via\s+([^<\n]+)/);
        if (viaMatch && viaMatch[1]) {
          return `Via: ${viaMatch[1].trim()}`;
        }
      }
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Process the JSON feed data
async function processImportFile() {
  // Read and parse the import file
  const importData = await fs.readFile(IMPORT_PATH, 'utf8');
  const { items } = JSON.parse(importData);
  
  // Read the original bookmarks file
  const originalBookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
  const { bookmarks: originalBookmarks } = JSON.parse(originalBookmarksData);
  
  // Create set of existing URLs to avoid duplicates
  const existingUrls = new Set(originalBookmarks.map(b => b.url));
  
  console.log(`Processing ${items.length} bookmarks...`);
  
  // Transform each imported item
  const newBookmarks = [];
  let addedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // Skip if URL already exists
      if (existingUrls.has(item.url)) {
        skippedCount++;
        continue;
      }
      
      // Extract tag and via information
      const tag = extractTag(item.content_html);
      const viaInfo = extractViaInfo(item.content_html);
      
      // Determine category based on tag and content
      const category = determineCategory(tag, item.url, item.title);
      
      // Create clean description
      let description = viaInfo || '';
      
      // Format date
      const date = item.date_published ? item.date_published.split('T')[0] : new Date().toISOString().split('T')[0];
      
      // Create new bookmark entry
      const newBookmark = {
        id: crypto.randomUUID(),
        name: item.title,
        url: item.url,
        category,
        description,
        date,
        timestamp: item.date_published || new Date().toISOString()
      };
      
      newBookmarks.push(newBookmark);
      addedCount++;
      
      // Log progress periodically
      if ((i + 1) % 100 === 0 || i === items.length - 1) {
        console.log(`Processed ${i + 1}/${items.length} bookmarks`);
      }
    } catch (error) {
      console.error(`Error processing bookmark ${i + 1}: ${error.message}`);
      skippedCount++;
    }
  }
  
  // Combine with original bookmarks and sort by timestamp (newest first)
  const updatedBookmarks = {
    bookmarks: [...newBookmarks, ...originalBookmarks].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
  };
  
  // Save the updated bookmarks
  await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(updatedBookmarks, null, 2));
  
  return {
    total: items.length,
    added: addedCount,
    skipped: skippedCount
  };
}

// Main function
async function main() {
  try {
    console.log('Starting clean import of bookmarks...');
    const result = await processImportFile();
    
    console.log('\nImport Summary:');
    console.log(`Total bookmarks processed: ${result.total}`);
    console.log(`New bookmarks added: ${result.added}`);
    console.log(`Bookmarks skipped (duplicates): ${result.skipped}`);
    console.log('\nImport completed successfully.');
  } catch (error) {
    console.error('Error during import:', error.message);
    process.exit(1);
  }
}

main();

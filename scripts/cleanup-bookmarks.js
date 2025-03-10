#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Refined category mapping aligned with the site's minimal Bauhaus design principles
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
  'ai': 'ai',
  'engineering': 'engineering'
};

// Smart categorization function
function determineCategory(url, title, oldCategory = null) {
  // Keep the original category if it's already well-defined and in our mapping
  if (oldCategory && CATEGORY_MAPPING[oldCategory.toLowerCase()]) {
    return oldCategory;
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
  
  // Engineering detection
  if (
    /\bengineering\b|\bcode\b|\bdeveloper\b|\bprogramming\b|\bgithub\b/.test(urlLower + ' ' + titleLower)
  ) {
    return 'engineering';
  }
  
  // Default to resource or the original category
  return oldCategory || 'resource';
}

// Find a matching bookmark in the original import file
async function findMatchingItem(url, importItems) {
  for (const item of importItems) {
    if (item.url === url) {
      return item;
    }
  }
  return null;
}

// Extract clean via information from HTML content
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

// Clean up description text that doesn't make sense
function generateCleanDescription(currentDescription, viaInfo, title) {
  // If we have good via information, use that
  if (viaInfo) {
    return viaInfo;
  }
  
  // If the current description seems good (not HTML or weird content), keep it
  if (currentDescription && 
      !currentDescription.includes('<') && 
      !currentDescription.includes('Tag:') && 
      !currentDescription.includes('Added:') &&
      !currentDescription.startsWith('Link:')) {
    return currentDescription;
  }
  
  // Create a simple clean description
  return `Bookmark: ${title}`;
}

// Main cleanup function
async function cleanupBookmarks() {
  try {
    // Read current bookmarks
    const bookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
    const { bookmarks } = JSON.parse(bookmarksData);
    
    // Read the original import data for reference
    const importData = await fs.readFile(IMPORT_PATH, 'utf8');
    const { items: importItems } = JSON.parse(importData);
    
    console.log(`Processing ${bookmarks.length} bookmarks...`);
    
    // Clean up each bookmark
    const cleanedBookmarks = [];
    
    for (let i = 0; i < bookmarks.length; i++) {
      const bookmark = bookmarks[i];
      
      // Find the matching item in the import file if possible
      const matchingItem = await findMatchingItem(bookmark.url, importItems);
      
      // Extract via information if available
      const viaInfo = matchingItem ? extractViaInfo(matchingItem.content_html) : '';
      
      // Determine the best category
      const category = determineCategory(bookmark.url, bookmark.name, bookmark.category);
      
      // Generate a clean description
      const description = generateCleanDescription(bookmark.description, viaInfo, bookmark.name);
      
      // Create cleaned bookmark
      const cleanedBookmark = {
        ...bookmark,
        category,
        description
      };
      
      cleanedBookmarks.push(cleanedBookmark);
      
      // Log progress
      if ((i + 1) % 100 === 0 || i === bookmarks.length - 1) {
        console.log(`Processed ${i + 1}/${bookmarks.length} bookmarks`);
      }
    }
    
    // Save cleaned bookmarks
    const updatedData = {
      bookmarks: cleanedBookmarks
    };
    
    await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(updatedData, null, 2));
    
    return {
      total: bookmarks.length,
      cleaned: cleanedBookmarks.length
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting bookmarks cleanup...');
    const result = await cleanupBookmarks();
    
    console.log('\nCleanup Summary:');
    console.log(`Total bookmarks: ${result.total}`);
    console.log(`Cleaned bookmarks: ${result.cleaned}`);
    console.log('\nCleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

main();

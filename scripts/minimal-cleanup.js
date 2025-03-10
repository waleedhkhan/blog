#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Minimal set of categories aligned with Bauhaus principles
const CATEGORIES = {
  design: {
    patterns: [
      /design/i,
      /typography/i,
      /font/i,
      /visual/i,
      /studio/i,
      /creative/i,
      /art/i,
      /brand/i,
      /gallery/i,
      /portfolio/i,
      /showcase/i
    ]
  },
  tool: {
    patterns: [
      /app/i,
      /tool/i,
      /generator/i,
      /framework/i,
      /library/i,
      /platform/i,
      /software/i,
      /api/i,
      /github\.com/i,
      /\.app$/i
    ]
  },
  article: {
    patterns: [
      /blog/i,
      /article/i,
      /post/i,
      /journal/i,
      /news/i,
      /story/i,
      /guide/i,
      /tutorial/i,
      /\/blog\//i,
      /\/articles\//i,
      /\/posts\//i
    ]
  },
  resource: {
    patterns: [
      /resource/i,
      /collection/i,
      /list/i,
      /directory/i,
      /database/i,
      /reference/i,
      /documentation/i,
      /learn/i,
      /education/i
    ]
  },
  inspiration: {
    patterns: [
      /inspiration/i,
      /showcase/i,
      /gallery/i,
      /portfolio/i,
      /experiment/i,
      /creative/i,
      /museum/i,
      /exhibition/i
    ]
  }
};

// Extract clean source information
function extractSource(html) {
  if (!html) return '';
  try {
    const $ = cheerio.load(html);
    
    // Look for Via information
    const viaElement = $('li:contains("Via")');
    if (viaElement.length > 0) {
      const sourceLink = viaElement.find('a');
      if (sourceLink.length > 0) {
        return sourceLink.text().trim();
      }
      const viaText = viaElement.text().trim();
      const match = viaText.match(/Via\s+([^<\n]+)/);
      return match ? match[1].trim() : '';
    }
    return '';
  } catch (error) {
    return '';
  }
}

// Determine category based on content and patterns
function determineCategory(url, title, content) {
  const textToAnalyze = `${url} ${title} ${content}`.toLowerCase();
  
  for (const [category, data] of Object.entries(CATEGORIES)) {
    for (const pattern of data.patterns) {
      if (pattern.test(textToAnalyze)) {
        return category;
      }
    }
  }
  
  // Default to resource if no specific category matches
  return 'resource';
}

// Generate a clean, minimal description
function generateDescription(originalTitle, source, contentHtml) {
  if (!contentHtml) return originalTitle;
  
  try {
    const $ = cheerio.load(contentHtml);
    
    // Remove tags and via information
    $('li:contains("Tag:")').remove();
    $('li:contains("Added:")').remove();
    $('li:contains("Via")').remove();
    
    // Get clean text content
    let description = $.text().trim();
    
    // If we have a source, format it minimally
    if (source) {
      return `Via ${source}`;
    }
    
    // If we have meaningful description text, use it
    if (description && description !== originalTitle) {
      // Clean up the description
      description = description
        .replace(/Link:\s*/, '')
        .replace(originalTitle, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (description) {
        return description;
      }
    }
    
    // Default to a minimal description
    return originalTitle;
  } catch (error) {
    return originalTitle;
  }
}

async function cleanupBookmarks() {
  try {
    // Read current bookmarks and import data
    const [bookmarksData, importData] = await Promise.all([
      fs.readFile(BOOKMARKS_PATH, 'utf8'),
      fs.readFile(IMPORT_PATH, 'utf8')
    ]);
    
    const { bookmarks } = JSON.parse(bookmarksData);
    const { items } = JSON.parse(importData);
    
    // Create map of import items by URL for quick lookup
    const importMap = new Map(items.map(item => [item.url, item]));
    
    console.log(`Processing ${bookmarks.length} bookmarks...`);
    
    // Process each bookmark
    const cleanedBookmarks = bookmarks.map((bookmark, index) => {
      try {
        // Find matching import item
        const importItem = importMap.get(bookmark.url);
        
        // Extract source information
        const source = importItem ? extractSource(importItem.content_html) : '';
        
        // Determine category
        const category = determineCategory(
          bookmark.url,
          bookmark.name,
          importItem ? importItem.content_html : ''
        );
        
        // Generate clean description
        const description = generateDescription(
          bookmark.name,
          source,
          importItem ? importItem.content_html : ''
        );
        
        if ((index + 1) % 100 === 0) {
          console.log(`Processed ${index + 1}/${bookmarks.length} bookmarks`);
        }
        
        return {
          ...bookmark,
          category,
          description
        };
      } catch (error) {
        console.error(`Error processing bookmark ${bookmark.name}: ${error.message}`);
        return bookmark;
      }
    });
    
    // Save updated bookmarks
    const updatedData = { bookmarks: cleanedBookmarks };
    await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(updatedData, null, 2));
    
    // Count categories
    const categoryCount = cleanedBookmarks.reduce((acc, bookmark) => {
      acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: bookmarks.length,
      cleaned: cleanedBookmarks.length,
      categories: categoryCount
    };
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting minimal cleanup of bookmarks...');
    const result = await cleanupBookmarks();
    
    console.log('\nCleanup Summary:');
    console.log(`Total bookmarks: ${result.total}`);
    console.log(`Cleaned bookmarks: ${result.cleaned}`);
    console.log('\nCategory Distribution:');
    Object.entries(result.categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} bookmarks`);
      });
    
    console.log('\nCleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

main();

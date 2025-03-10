#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Bauhaus-inspired categories: form follows function
const CATEGORIES = {
  design: {
    patterns: [
      /design/i,
      /typography/i,
      /type\-/i,
      /typeface/i,
      /font/i,
      /visual/i,
      /color/i,
      /\.(design|studio)$/i,
      /brand/i,
      /identity/i,
      /portfolio/i,
      /art/i,
      /creative/i
    ]
  },
  tool: {
    patterns: [
      /\.app$/i,
      /\bapp\./i,
      /tool/i,
      /editor/i,
      /generator/i,
      /dashboard/i,
      /platform/i,
      /software/i,
      /utility/i,
      /cli/i,
      /api/i
    ]
  },
  craft: {
    patterns: [
      /craft/i,
      /build/i,
      /make/i,
      /creator/i,
      /studio/i,
      /workshop/i,
      /handmade/i,
      /artisan/i
    ]
  },
  system: {
    patterns: [
      /system/i,
      /framework/i,
      /library/i,
      /architecture/i,
      /pattern/i,
      /component/i,
      /structure/i,
      /grid/i
    ]
  },
  archive: {
    patterns: [
      /archive/i,
      /collection/i,
      /gallery/i,
      /museum/i,
      /history/i,
      /reference/i,
      /documentation/i
    ]
  }
};

// Extract clean metadata following Bauhaus principles
function extractMetadata(html) {
  if (!html) return { source: '', description: '' };
  try {
    const $ = cheerio.load(html);
    
    // Look for source attribution
    let source = '';
    const viaElement = $('li:contains("Via")');
    if (viaElement.length > 0) {
      const sourceLink = viaElement.find('a');
      source = sourceLink.length > 0 ? sourceLink.text().trim() : 
               viaElement.text().replace(/Via\s+/, '').trim();
    }
    
    // Extract clean description
    $('li:contains("Tag:")').remove();
    $('li:contains("Added:")').remove();
    $('li:contains("Via")').remove();
    
    let description = '';
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      description = metaDesc;
    } else {
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
      const cleanParagraphs = paragraphs
        .filter(p => p && p.length > 10 && !p.includes('Tag:') && !p.includes('Added:'))
        .map(p => p.replace(/Link:\s*/, '').trim());
      
      if (cleanParagraphs.length > 0) {
        description = cleanParagraphs[0];
      }
    }
    
    return { source, description };
  } catch (error) {
    return { source: '', description: '' };
  }
}

// Determine category based on Bauhaus principles
function determineCategory(url, title, content) {
  const textToAnalyze = `${url} ${title} ${content}`.toLowerCase();
  
  // Check each category's patterns
  for (const [category, data] of Object.entries(CATEGORIES)) {
    for (const pattern of data.patterns) {
      if (pattern.test(textToAnalyze)) {
        return category;
      }
    }
  }
  
  // Default to system for uncategorized items
  return 'system';
}

// Generate minimal description
function generateDescription(title, metadata) {
  const { source, description } = metadata;
  
  if (source) {
    return `Via ${source}`;
  }
  
  if (description && description !== title) {
    return description.length > 100 ? 
           description.substring(0, 97) + '...' : 
           description;
  }
  
  return title;
}

async function cleanupBookmarks() {
  try {
    // Read data files
    const [bookmarksData, importData] = await Promise.all([
      fs.readFile(BOOKMARKS_PATH, 'utf8'),
      fs.readFile(IMPORT_PATH, 'utf8')
    ]);
    
    const { bookmarks } = JSON.parse(bookmarksData);
    const { items } = JSON.parse(importData);
    
    // Create lookup map
    const importMap = new Map(items.map(item => [item.url, item]));
    
    console.log(`Processing ${bookmarks.length} bookmarks...`);
    
    // Process bookmarks
    const cleanedBookmarks = bookmarks.map((bookmark, index) => {
      try {
        const importItem = importMap.get(bookmark.url);
        const metadata = importItem ? 
                        extractMetadata(importItem.content_html) : 
                        { source: '', description: '' };
        
        const category = determineCategory(
          bookmark.url,
          bookmark.name,
          importItem ? importItem.content_html : ''
        );
        
        const description = generateDescription(bookmark.name, metadata);
        
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
    
    // Sort by timestamp (newest first)
    cleanedBookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
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
    console.log('Starting Bauhaus-minimal cleanup...');
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

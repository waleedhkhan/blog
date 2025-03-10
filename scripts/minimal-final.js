#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Minimal categories following Bauhaus principles
const CATEGORIES = {
  form: {
    patterns: [
      /design/i,
      /type/i,
      /font/i,
      /visual/i,
      /color/i,
      /brand/i,
      /art/i,
      /creative/i,
      /gallery/i,
      /studio/i,
      /portfolio/i,
      /identity/i,
      /style/i,
      /aesthetic/i,
      /minimal/i,
      /bauhaus/i,
      /\.(design|studio)$/i
    ]
  },
  work: {
    patterns: [
      /github\.com/i,
      /code/i,
      /develop/i,
      /build/i,
      /create/i,
      /craft/i,
      /make/i,
      /tool/i,
      /app/i,
      /platform/i,
      /generator/i,
      /editor/i,
      /\.dev$/i,
      /api/i,
      /tech/i,
      /engineering/i,
      /software/i,
      /framework/i
    ]
  },
  note: {
    patterns: [
      /blog/i,
      /article/i,
      /post/i,
      /journal/i,
      /story/i,
      /guide/i,
      /tutorial/i,
      /book/i,
      /read/i,
      /learn/i,
      /doc/i,
      /reference/i,
      /resource/i,
      /collection/i,
      /archive/i,
      /\/blog\//i,
      /\/articles\//i,
      /\/posts\//i
    ]
  }
};

// Extract clean metadata with extreme minimalism
function extractMetadata(html) {
  if (!html) return { source: '', description: '' };
  try {
    const $ = cheerio.load(html);
    
    // Extract source
    let source = '';
    const viaElement = $('li:contains("Via")');
    if (viaElement.length > 0) {
      const sourceLink = viaElement.find('a');
      source = sourceLink.length > 0 ? sourceLink.text().trim() : 
               viaElement.text().replace(/Via\s+/, '').trim();
    }
    
    // Clean and extract description
    $('li:contains("Tag:")').remove();
    $('li:contains("Added:")').remove();
    $('li:contains("Via")').remove();
    
    let description = '';
    
    // Try meta description first
    description = $('meta[name="description"]').attr('content') || '';
    
    // If no meta description, try OpenGraph
    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || '';
    }
    
    // If still no description, try first meaningful paragraph
    if (!description) {
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

// Determine category based on content
function determineCategory(url, title, content) {
  const textToAnalyze = `${url} ${title} ${content}`.toLowerCase();
  
  // Check each category
  for (const [category, data] of Object.entries(CATEGORIES)) {
    for (const pattern of data.patterns) {
      if (pattern.test(textToAnalyze)) {
        return category;
      }
    }
  }
  
  // Default to form for uncategorized items
  return 'form';
}

// Generate minimal description
function generateDescription(title, metadata) {
  const { source, description } = metadata;
  
  // If we have a source, that's our primary description
  if (source) {
    return `Via ${source}`;
  }
  
  // If we have a good description that's different from the title
  if (description && description !== title) {
    // Keep descriptions extremely minimal
    return description.length > 60 ? 
           description.substring(0, 57) + '...' : 
           description;
  }
  
  // If title is meaningful, use it
  if (title && title.length > 3) {
    return title;
  }
  
  // Default to empty string for true minimalism
  return '';
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
    console.log('Starting minimal cleanup...');
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

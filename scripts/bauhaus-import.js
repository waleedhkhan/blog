#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const IMPORT_PATH = path.join(__dirname, '../src/data/import-bookmark.sjon');

// Core categories following Bauhaus principles: form follows function
const CATEGORIES = {
  design: {
    patterns: [
      /design/i,
      /typography/i,
      /font/i,
      /visual/i,
      /studio/i,
      /creative/i,
      /brand/i,
      /portfolio/i,
      /type\-/i,
      /typeface/i,
      /\.(design|studio)$/i
    ]
  },
  engineering: {
    patterns: [
      /github\.com/i,
      /engineering/i,
      /code/i,
      /developer/i,
      /programming/i,
      /software/i,
      /api/i,
      /tech/i,
      /stack/i,
      /framework/i
    ]
  },
  tool: {
    patterns: [
      /\.app$/i,
      /app\./i,
      /tool/i,
      /generator/i,
      /platform/i,
      /editor/i,
      /dashboard/i,
      /utility/i,
      /cli/i
    ]
  },
  resource: {
    patterns: [
      /resource/i,
      /collection/i,
      /directory/i,
      /reference/i,
      /guide/i,
      /learn/i,
      /tutorial/i,
      /documentation/i,
      /example/i
    ]
  },
  inspiration: {
    patterns: [
      /inspiration/i,
      /gallery/i,
      /showcase/i,
      /museum/i,
      /exhibition/i,
      /collection/i,
      /archive/i
    ]
  }
};

// Extract source information with Bauhaus-style minimalism
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

// Determine category based on content analysis
function determineCategory(url, title, content) {
  const textToAnalyze = `${url} ${title} ${content}`.toLowerCase();
  
  // Check for AI-specific content first
  if (/\bai\b|\bartificial intelligence\b|\bgpt\b|\bllm\b|\bmachine learning\b/.test(textToAnalyze)) {
    return 'engineering';
  }
  
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

// Generate a clean, minimal description following Bauhaus principles
function generateDescription(originalTitle, source, contentHtml) {
  if (!contentHtml) return '';
  
  try {
    const $ = cheerio.load(contentHtml);
    
    // Remove metadata elements
    $('li:contains("Tag:")').remove();
    $('li:contains("Added:")').remove();
    $('li:contains("Via")').remove();
    
    // Extract the first paragraph or meaningful content
    let description = '';
    
    // If we have a source, that's our primary description
    if (source) {
      description = `Via ${source}`;
    } else {
      // Look for a meaningful description in the content
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
      const cleanParagraphs = paragraphs
        .map(p => p.replace(/Link:\s*/, '').replace(originalTitle, '').trim())
        .filter(p => p && p.length > 10 && !p.includes('Tag:') && !p.includes('Added:'));
      
      if (cleanParagraphs.length > 0) {
        description = cleanParagraphs[0];
      }
    }
    
    // If we still don't have a description, use the title
    return description || originalTitle;
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
    
    // Sort bookmarks by timestamp (newest first)
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
    console.log('Starting Bauhaus-style cleanup of bookmarks...');
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

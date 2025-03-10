#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { setTimeout } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');

// Categories aligned with Bauhaus principles and your site's focus
const CATEGORIES = {
  typography: {
    terms: ['typography', 'typeface', 'font', 'type design', 'lettering'],
    meta: ['typography', 'type design', 'fonts']
  },
  interface: {
    terms: ['interface', 'ui', 'ux', 'design system', 'component', 'layout'],
    meta: ['interface', 'ui design', 'ux design']
  },
  minimal: {
    terms: ['minimal', 'clean', 'simple', 'bauhaus', 'modernist'],
    meta: ['minimal', 'minimalist', 'clean design']
  },
  craft: {
    terms: ['craft', 'build', 'create', 'make', 'workshop', 'studio'],
    meta: ['craft', 'maker', 'studio']
  },
  performance: {
    terms: ['performance', 'optimization', 'speed', 'efficient', 'fast'],
    meta: ['performance', 'web performance', 'optimization']
  },
  engineering: {
    terms: ['engineering', 'code', 'development', 'api', 'astro', 'react'],
    meta: ['engineering', 'development', 'code']
  }
};

// Efficient metadata extraction focused on performance
async function extractMetadata(url, html) {
  try {
    const $ = cheerio.load(html);
    
    // Get meta description with fallbacks
    const description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    
    // Get keywords and tags
    const keywords = [
      $('meta[name="keywords"]').attr('content') || '',
      $('meta[property="article:tag"]').attr('content') || '',
      ...$('meta[property="article:section"]').map((_, el) => $(el).attr('content')).get()
    ].join(',');
    
    // Get main content efficiently
    const mainContent = $('main, article').first().text() || 
                       $('.content, .main').first().text() || 
                       $('body').text();
    
    // Clean content efficiently
    const cleanContent = mainContent
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    
    return {
      description: description.trim(),
      keywords: keywords.toLowerCase(),
      content: cleanContent,
      title: $('title').text().trim() || 
             $('meta[property="og:title"]').attr('content') || 
             ''
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${url}:`, error.message);
    return { description: '', keywords: '', content: '', title: '' };
  }
}

// Analyze content with Bauhaus principles in mind
function analyzeContent(metadata) {
  const { content, keywords, title } = metadata;
  const textToAnalyze = `${content} ${keywords} ${title}`.toLowerCase();
  
  const categoryScores = {};
  
  // Score each category based on relevance
  for (const [category, data] of Object.entries(CATEGORIES)) {
    let score = 0;
    
    // Check terms in content
    for (const term of data.terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textToAnalyze.match(regex) || [];
      score += matches.length * 2; // Weight content matches more heavily
    }
    
    // Check meta terms
    for (const term of data.meta) {
      if (keywords.includes(term)) {
        score += 3; // Weight metadata matches even more
      }
    }
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  // Get top scoring category
  const sortedCategories = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);
  
  return sortedCategories[0] || 'minimal';
}

// Efficient URL analysis with proper error handling
async function analyzeUrl(url, retries = 2) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(8000, () => controller.abort());
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAnalyzer/1.0; +https://waleedhkhan.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const metadata = await extractMetadata(url, html);
    const category = analyzeContent(metadata);
    
    return {
      isOnline: true,
      category,
      description: metadata.description || metadata.title
    };
  } catch (error) {
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
      await setTimeout(2000);
      return analyzeUrl(url, retries - 1);
    }
    
    console.error(`Error analyzing ${url}:`, error.message);
    return {
      isOnline: false,
      category: 'minimal',
      description: ''
    };
  }
}

// Process bookmarks efficiently in small batches
async function processBatch(bookmarks, startIdx, batchSize) {
  const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
  const batch = bookmarks.slice(startIdx, endIdx);
  
  console.log(`Processing ${startIdx + 1}-${endIdx} of ${bookmarks.length}...`);
  
  const results = await Promise.all(
    batch.map(async (bookmark) => {
      const analysis = await analyzeUrl(bookmark.url);
      
      return {
        ...bookmark,
        category: analysis.isOnline ? analysis.category : bookmark.category,
        description: analysis.isOnline && analysis.description ? 
                    analysis.description.length > 80 ? 
                    analysis.description.substring(0, 77) + '...' : 
                    analysis.description : 
                    bookmark.description,
        status: analysis.isOnline ? 'active' : 'offline'
      };
    })
  );
  
  return results;
}

async function main() {
  try {
    console.log('Starting bookmark analysis...');
    
    // Read bookmarks file
    const bookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
    const { bookmarks } = JSON.parse(bookmarksData);
    
    // Create backup first
    await fs.writeFile(
      BOOKMARKS_PATH + '.backup',
      JSON.stringify({ bookmarks }, null, 2)
    );
    
    // Process in small batches
    const BATCH_SIZE = 5;
    const processedBookmarks = [];
    const stats = {
      total: bookmarks.length,
      active: 0,
      offline: 0,
      categories: {}
    };
    
    // Process batches
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(bookmarks, i, BATCH_SIZE);
      
      // Update stats
      batchResults.forEach(bookmark => {
        if (bookmark.status === 'active') {
          stats.active++;
        } else {
          stats.offline++;
        }
        stats.categories[bookmark.category] = (stats.categories[bookmark.category] || 0) + 1;
      });
      
      processedBookmarks.push(...batchResults);
      
      // Save progress after each batch
      await fs.writeFile(
        BOOKMARKS_PATH,
        JSON.stringify({ bookmarks: processedBookmarks }, null, 2)
      );
      
      // Small delay between batches
      await setTimeout(1500);
    }
    
    // Sort bookmarks by timestamp
    processedBookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Save final version
    await fs.writeFile(
      BOOKMARKS_PATH,
      JSON.stringify({ bookmarks: processedBookmarks }, null, 2)
    );
    
    console.log('\nAnalysis Summary:');
    console.log(`Total bookmarks: ${stats.total}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Offline: ${stats.offline}`);
    console.log('\nCategory Distribution:');
    Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} bookmarks`);
      });
    
    console.log('\nAnalysis completed successfully.');
    console.log('Backup saved as bookmarks.json.backup');
  } catch (error) {
    console.error('Error during analysis:', error.message);
    process.exit(1);
  }
}

main();

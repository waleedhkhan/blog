#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { setTimeout } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');

// Categories aligned with site architecture
const CATEGORIES = {
  design: {
    terms: ['design', 'visual', 'aesthetic', 'art direction', 'brand', 'creative', 'style', 'typography', 'type'],
    meta: ['design', 'designer', 'creative', 'studio', 'typography']
  },
  make: {
    terms: ['make', 'build', 'create', 'craft', 'tool', 'generator', 'app', 'product'],
    meta: ['tool', 'app', 'generator', 'product']
  },
  read: {
    terms: ['article', 'blog', 'essay', 'journal', 'writing', 'story', 'book', 'guide'],
    meta: ['blog', 'article', 'journal', 'guide']
  },
  dev: {
    terms: ['astro', 'javascript', 'react', 'vue', 'tailwind', 'api', 'code', 'engineering'],
    meta: ['development', 'programming', 'web', 'engineering']
  }
};

// Efficient metadata extraction optimized for performance
async function extractMetadata(url, html) {
  try {
    const $ = cheerio.load(html, { xmlMode: false });
    
    // Get meta description with fallbacks
    const description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    
    // Get keywords efficiently
    const keywords = new Set([
      $('meta[name="keywords"]').attr('content') || '',
      $('meta[property="article:tag"]').attr('content') || '',
      ...$('meta[property="article:section"]').map((_, el) => $(el).attr('content')).get()
    ].join(',').toLowerCase().split(/,\s*/));
    
    // Get main content efficiently
    const mainContent = $('main, article').first().text() || 
                       $('.content').first().text() || 
                       $('body').text().substring(0, 500); // Limit content analysis
    
    // Get source attribution
    const source = $('a:contains("Via")').first().text().replace('Via', '').trim() ||
                  $('a:contains("Source")').first().text().replace('Source', '').trim();
    
    return {
      description: description.trim(),
      keywords: Array.from(keywords).filter(k => k.length > 0),
      content: mainContent.toLowerCase().replace(/[\n\r\t]+/g, ' ').trim(),
      title: $('title').text().trim() || 
             $('meta[property="og:title"]').attr('content') || 
             '',
      source
    };
  } catch (error) {
    return { description: '', keywords: [], content: '', title: '', source: '' };
  }
}

// Analyze content for proper categorization
function analyzeContent(metadata) {
  const { content, keywords, title } = metadata;
  const textToAnalyze = `${content} ${keywords.join(' ')} ${title}`.toLowerCase();
  
  const categoryScores = {};
  
  for (const [category, data] of Object.entries(CATEGORIES)) {
    let score = 0;
    
    // Check terms in content
    for (const term of data.terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textToAnalyze.match(regex) || [];
      score += matches.length * 2;
    }
    
    // Check meta terms
    for (const term of data.meta) {
      if (keywords.includes(term)) {
        score += 3;
      }
    }
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  return Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category)[0] || 'design';
}

// Generate minimal description
function generateDescription(metadata) {
  const { description, title, source } = metadata;
  
  // If we have a source, use it
  if (source) {
    return `Via ${source}`;
  }
  
  // If we have a good description that's different from the title
  if (description && description !== title) {
    return description.length > 80 ? 
           description.substring(0, 77) + '...' : 
           description;
  }
  
  // Use title as fallback
  return title;
}

// Analyze URL with proper rate limiting and error handling
async function analyzeUrl(url, retries = 2) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(5000, () => controller.abort());
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkAnalyzer/1.0; +https://waleedhkhan.com)',
        'Accept': 'text/html',
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
    const description = generateDescription(metadata);
    
    return {
      isOnline: true,
      category,
      description
    };
  } catch (error) {
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
      await setTimeout(2000); // Increased delay for rate limiting
      return analyzeUrl(url, retries - 1);
    }
    
    return {
      isOnline: false,
      category: 'design',
      description: ''
    };
  }
}

// Process bookmarks in small batches with rate limiting
async function processBatch(bookmarks, startIdx, batchSize) {
  const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
  const batch = bookmarks.slice(startIdx, endIdx);
  
  console.log(`Processing ${startIdx + 1}-${endIdx} of ${bookmarks.length}...`);
  
  const results = [];
  
  // Process one at a time to respect rate limits
  for (const bookmark of batch) {
    const analysis = await analyzeUrl(bookmark.url);
    
    results.push({
      ...bookmark,
      category: analysis.isOnline ? analysis.category : bookmark.category,
      description: analysis.isOnline && analysis.description ? 
                  analysis.description : 
                  bookmark.description,
      status: analysis.isOnline ? 'active' : 'archived'
    });
    
    // Rate limiting delay
    await setTimeout(1000);
  }
  
  return results;
}

async function main() {
  try {
    console.log('Starting bookmark validation...');
    
    const bookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
    const { bookmarks } = JSON.parse(bookmarksData);
    
    // Create backup
    await fs.writeFile(
      BOOKMARKS_PATH + '.backup',
      JSON.stringify({ bookmarks }, null, 2)
    );
    
    const BATCH_SIZE = 3; // Smaller batch size for better rate limiting
    const processedBookmarks = [];
    const stats = {
      total: bookmarks.length,
      active: 0,
      archived: 0,
      categories: {}
    };
    
    // Process batches
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(bookmarks, i, BATCH_SIZE);
      
      batchResults.forEach(bookmark => {
        if (bookmark.status === 'active') {
          stats.active++;
        } else {
          stats.archived++;
        }
        stats.categories[bookmark.category] = (stats.categories[bookmark.category] || 0) + 1;
      });
      
      processedBookmarks.push(...batchResults);
      
      // Save progress
      await fs.writeFile(
        BOOKMARKS_PATH,
        JSON.stringify({ bookmarks: processedBookmarks }, null, 2)
      );
      
      // Batch delay
      await setTimeout(2000);
    }
    
    // Sort by timestamp
    processedBookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Save final version
    await fs.writeFile(
      BOOKMARKS_PATH,
      JSON.stringify({ bookmarks: processedBookmarks }, null, 2)
    );
    
    console.log('\nValidation Summary:');
    console.log(`Total bookmarks: ${stats.total}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Archived: ${stats.archived}`);
    console.log('\nCategory Distribution:');
    Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} bookmarks`);
      });
    
    console.log('\nValidation completed successfully.');
    console.log('Backup saved as bookmarks.json.backup');
  } catch (error) {
    console.error('Error during validation:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { setTimeout } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');

// Define refined categories for better filtering
const CATEGORIES = {
  // Design & Visual Related
  typography: {
    terms: ['font', 'type', 'typography', 'typeface', 'lettering', 'glyph', 'letterform'],
    meta: ['font', 'type', 'typography']
  },
  minimal: {
    terms: ['minimal', 'clean', 'simple', 'bauhaus', 'monochrome', 'essentialist'],
    meta: ['minimal', 'clean', 'simple']
  },
  interface: {
    terms: ['interface', 'ui', 'ux', 'user experience', 'interaction', 'usability', 'website'],
    meta: ['interface', 'ui', 'ux', 'design system']
  },
  // Content Related
  craft: {
    terms: ['craft', 'make', 'build', 'create', 'workshop', 'handmade', 'artisanal', 'studio'],
    meta: ['craft', 'maker', 'studio', 'workshop']
  },
  ai: {
    terms: ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'llm', 'neural', 'model', 'chatbot'],
    meta: ['ai', 'artificial intelligence', 'ml', 'chatgpt']
  },
  // Tech Related
  performance: {
    terms: ['performance', 'speed', 'optimization', 'benchmark', 'efficient', 'fast'],
    meta: ['performance', 'optimization', 'speed']
  },
  engineering: {
    terms: ['code', 'development', 'programming', 'engineering', 'software', 'api', 'framework', 'library'],
    meta: ['development', 'engineering', 'programming']
  },
  tool: {
    terms: ['tool', 'utility', 'app', 'software', 'generator', 'productivity', 'extension'],
    meta: ['tool', 'app', 'utility', 'productivity']
  }
};

// Extract metadata optimized for performance
async function extractMetadata(url, html) {
  try {
    const $ = cheerio.load(html, {
      xmlMode: false,
      decodeEntities: true,
      normalizeWhitespace: true
    });
    
    // Get meta description with fallbacks
    const description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    
    // Get keywords efficiently
    const keywords = new Set([
      ...($('meta[name="keywords"]').attr('content') || '').split(/,\s*/),
      ...($('meta[property="article:tag"]').attr('content') || '').split(/,\s*/),
      ...$('meta[property="article:section"]').map((_, el) => $(el).attr('content')).get()
    ].filter(k => k.length > 0).map(k => k.toLowerCase()));
    
    // Get main content efficiently
    const mainContent = 
      $('main').first().text() || 
      $('article').first().text() || 
      $('.content').first().text() || 
      $('body').text().substring(0, 500);
    
    // Get title with proper fallbacks
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      '';
    
    return {
      description: description.trim(),
      keywords: Array.from(keywords),
      content: mainContent.toLowerCase().replace(/[\n\r\t]+/g, ' ').trim(),
      title: title.trim()
    };
  } catch (error) {
    return { description: '', keywords: [], content: '', title: '' };
  }
}

// Analyze content for precise categorization
function analyzeContent(metadata, existingCategory) {
  const { content, keywords, title } = metadata;
  const textToAnalyze = `${title} ${content} ${keywords.join(' ')}`.toLowerCase();
  
  const categoryScores = {};
  
  // Check for specific technology names
  const techTerms = {
    astro: ['astro', 'static site', 'island', 'static generation'],
    react: ['react', 'jsx', 'component', 'hooks'],
    vue: ['vue', 'vuejs', 'composition api'],
    javascript: ['javascript', 'js', 'typescript', 'ts', 'jsdoc'],
    tailwind: ['tailwind', 'css', 'utility-first'],
    cloudflare: ['cloudflare', 'pages', 'edge', 'cdn']
  };
  
  // Check for tech terms
  for (const [tech, terms] of Object.entries(techTerms)) {
    for (const term of terms) {
      if (textToAnalyze.includes(term)) {
        categoryScores[tech] = (categoryScores[tech] || 0) + 3;
      }
    }
  }
  
  // Check other category terms
  for (const [category, data] of Object.entries(CATEGORIES)) {
    let score = 0;
    
    // Check terms in content
    for (const term of data.terms) {
      // Use word boundary detection where possible
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textToAnalyze.match(regex) || [];
      score += matches.length * 2;
      
      // Additional score for terms in title (more important)
      if (title.toLowerCase().includes(term)) {
        score += 5;
      }
    }
    
    // Check meta terms with higher weight
    for (const term of data.meta) {
      if (keywords.includes(term)) {
        score += 4;
      }
    }
    
    // Give bonus points to the existing category for stability
    if (category === existingCategory) {
      score += 2;
    }
    
    if (score > 0) {
      categoryScores[category] = (categoryScores[category] || 0) + score;
    }
  }
  
  // Special case for typography content
  if (textToAnalyze.includes('font') || textToAnalyze.includes('typeface')) {
    categoryScores.typography = (categoryScores.typography || 0) + 5;
  }
  
  // Special case for AI content
  if (textToAnalyze.includes('ai') || textToAnalyze.includes('gpt') || 
      textToAnalyze.includes('chatbot') || textToAnalyze.includes('intelligence')) {
    categoryScores.ai = (categoryScores.ai || 0) + 5;
  }
  
  return Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category)[0] || 'minimal';
}

// Analyze URL with proper rate limiting
async function analyzeUrl(url, existingCategory, retries = 2) {
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
    const category = analyzeContent(metadata, existingCategory);
    
    return {
      isOnline: true,
      category
    };
  } catch (error) {
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
      await setTimeout(2000);
      return analyzeUrl(url, existingCategory, retries - 1);
    }
    
    return {
      isOnline: false,
      category: existingCategory
    };
  }
}

// Process bookmarks with efficient batching
async function processBatch(bookmarks, startIdx, batchSize) {
  const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
  const batch = bookmarks.slice(startIdx, endIdx);
  
  console.log(`Processing ${startIdx + 1}-${endIdx} of ${bookmarks.length}...`);
  
  const results = [];
  
  // Process one at a time for better rate limiting
  for (const bookmark of batch) {
    const analysis = await analyzeUrl(bookmark.url, bookmark.category);
    
    results.push({
      ...bookmark,
      category: analysis.isOnline ? analysis.category : bookmark.category,
      status: analysis.isOnline ? 'active' : 'offline'
    });
    
    // Rate limiting delay
    await setTimeout(1000);
  }
  
  return results;
}

async function main() {
  try {
    console.log('Starting bookmark categorization...');
    
    const bookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
    const { bookmarks } = JSON.parse(bookmarksData);
    
    // Create backup
    await fs.writeFile(
      BOOKMARKS_PATH + '.backup',
      JSON.stringify({ bookmarks }, null, 2)
    );
    
    const BATCH_SIZE = 3; // Small batch size for better rate limiting
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
      
      batchResults.forEach(bookmark => {
        if (bookmark.status === 'active') {
          stats.active++;
        } else {
          stats.offline++;
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
    
    // Sort by timestamp for newest first
    processedBookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Save final version
    await fs.writeFile(
      BOOKMARKS_PATH,
      JSON.stringify({ bookmarks: processedBookmarks }, null, 2)
    );
    
    console.log('\nCategorization Summary:');
    console.log(`Total bookmarks: ${stats.total}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Offline: ${stats.offline}`);
    console.log('\nCategory Distribution:');
    Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} bookmarks`);
      });
    
    console.log('\nCategorization completed successfully.');
    console.log('Backup saved as bookmarks.json.backup');
  } catch (error) {
    console.error('Error during categorization:', error.message);
    process.exit(1);
  }
}

main();

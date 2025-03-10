#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { setTimeout } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');

// Intelligent category detection based on content analysis
const CATEGORIES = {
  typography: {
    terms: ['typography', 'typeface', 'font', 'lettering', 'type design', 'kerning', 'ligature'],
    meta: ['fonts', 'typography', 'type design']
  },
  design: {
    terms: ['design', 'visual', 'interface', 'ui', 'ux', 'layout', 'composition', 'aesthetic'],
    meta: ['design', 'designer', 'studio', 'creative']
  },
  engineering: {
    terms: ['engineering', 'code', 'programming', 'development', 'software', 'api', 'framework'],
    meta: ['github', 'developer', 'code', 'tech']
  },
  art: {
    terms: ['art', 'artwork', 'artist', 'gallery', 'exhibition', 'museum', 'creative'],
    meta: ['art', 'artist', 'gallery', 'exhibition']
  },
  tool: {
    terms: ['tool', 'utility', 'generator', 'app', 'software', 'platform', 'service'],
    meta: ['tool', 'app', 'utility', 'service']
  },
  inspiration: {
    terms: ['inspiration', 'showcase', 'collection', 'curated', 'gallery', 'portfolio'],
    meta: ['inspiration', 'showcase', 'gallery']
  },
  article: {
    terms: ['article', 'blog', 'post', 'journal', 'writing', 'essay', 'story'],
    meta: ['blog', 'article', 'journal']
  },
  resource: {
    terms: ['resource', 'library', 'archive', 'documentation', 'reference', 'guide'],
    meta: ['resource', 'reference', 'guide']
  }
};

// Extract metadata from HTML content
async function extractMetadata(url, html) {
  try {
    const $ = cheerio.load(html);
    
    // Get meta description
    const description = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      '';
    
    // Get meta keywords
    const keywords = 
      $('meta[name="keywords"]').attr('content') ||
      $('meta[property="article:tag"]').attr('content') ||
      '';
    
    // Get main content text for analysis
    const mainContent = $('main, article, .content, .main').text() || $('body').text();
    const cleanContent = mainContent
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    
    return {
      description,
      keywords,
      content: cleanContent,
      title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || ''
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${url}:`, error.message);
    return {
      description: '',
      keywords: '',
      content: '',
      title: ''
    };
  }
}

// Analyze content to determine categories
function analyzeContent(metadata) {
  const { content, keywords, title } = metadata;
  const textToAnalyze = `${content} ${keywords} ${title}`.toLowerCase();
  
  const categoryScores = {};
  
  // Score each category based on term matches
  for (const [category, data] of Object.entries(CATEGORIES)) {
    let score = 0;
    
    // Check terms in content
    for (const term of data.terms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = textToAnalyze.match(regex) || [];
      score += matches.length;
    }
    
    // Check meta terms
    for (const term of data.meta) {
      if (keywords.toLowerCase().includes(term)) {
        score += 2;
      }
    }
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }
  
  // Get top scoring categories
  const sortedCategories = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);
  
  return sortedCategories[0] || 'design';
}

// Fetch and analyze a URL
async function analyzeUrl(url, retries = 3) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(10000, () => controller.abort());
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
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
    if (retries > 0 && error.name === 'AbortError') {
      await setTimeout(2000);
      return analyzeUrl(url, retries - 1);
    }
    
    console.error(`Error analyzing ${url}:`, error.message);
    return {
      isOnline: false,
      category: 'design',
      description: ''
    };
  }
}

// Process bookmarks in batches to avoid overwhelming the network
async function processBatch(bookmarks, startIdx, batchSize) {
  const endIdx = Math.min(startIdx + batchSize, bookmarks.length);
  const batch = bookmarks.slice(startIdx, endIdx);
  
  console.log(`Processing batch ${startIdx + 1}-${endIdx} of ${bookmarks.length} bookmarks...`);
  
  const results = await Promise.all(
    batch.map(async (bookmark) => {
      const analysis = await analyzeUrl(bookmark.url);
      
      return {
        ...bookmark,
        category: analysis.isOnline ? analysis.category : bookmark.category,
        description: analysis.isOnline && analysis.description ? analysis.description : bookmark.description,
        isOnline: analysis.isOnline
      };
    })
  );
  
  return results;
}

async function main() {
  try {
    console.log('Starting smart bookmark analysis...');
    
    // Read bookmarks file
    const bookmarksData = await fs.readFile(BOOKMARKS_PATH, 'utf8');
    const { bookmarks } = JSON.parse(bookmarksData);
    
    // Process in batches of 10
    const BATCH_SIZE = 10;
    const processedBookmarks = [];
    const stats = {
      total: bookmarks.length,
      online: 0,
      offline: 0,
      categories: {}
    };
    
    // Create backup
    await fs.writeFile(
      BOOKMARKS_PATH + '.backup',
      JSON.stringify({ bookmarks }, null, 2)
    );
    
    // Process batches
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(bookmarks, i, BATCH_SIZE);
      
      // Update stats
      batchResults.forEach(bookmark => {
        if (bookmark.isOnline) {
          stats.online++;
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
      await setTimeout(1000);
    }
    
    console.log('\nAnalysis Summary:');
    console.log(`Total bookmarks: ${stats.total}`);
    console.log(`Online: ${stats.online}`);
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

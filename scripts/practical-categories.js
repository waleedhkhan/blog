/**
 * Practical Bookmark Categories
 * 
 * This script applies a real-world, practical categorization system
 * that users will intuitively understand and find useful.
 * 
 * @date 2025-03-10
 */

import fs from 'fs';
import path from 'path';

// Define file path
const bookmarksPath = path.join(process.cwd(), '..', 'src', 'data', 'bookmarks.json');

// Read the bookmarks file
console.log('Reading bookmarks file...');
const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));

// Create backup
const backupPath = path.join(process.cwd(), '..', 'src', 'data', 'bookmarks.json.backup.practical');
fs.writeFileSync(backupPath, JSON.stringify(bookmarksData, null, 2));
console.log(`Created backup at ${backupPath}`);

// Define practical, real-world categories that users intuitively understand
const categories = {
  // Practical categories with familiar names
  design: {
    name: 'design',
    description: 'Design websites, portfolios, and visual inspiration',
    patterns: [
      /design|graphic|visual|studio|agency/i,
      /portfolio|showcase|gallery|website|branding/i,
      /art director|designer|artist|illustrator/i
    ]
  },
  tools: {
    name: 'tools',
    description: 'Useful utilities, apps, and productivity tools',
    patterns: [
      /tool|app|utility|application|extension/i,
      /generator|creator|builder|calculator|converter/i,
      /assistant|helper|productivity|software/i
    ]
  },
  dev: {
    name: 'dev',
    description: 'Development resources and coding tools',
    patterns: [
      /code|coding|development|programming|developer/i,
      /github|gitlab|stack|framework|library/i,
      /api|sdk|engineer|technical|backend/i
    ]
  },
  fonts: {
    name: 'fonts',
    description: 'Typography, fonts, and text design',
    patterns: [
      /font|typeface|type|typography|lettering/i,
      /serif|sans|mono|variable|glyph/i,
      /specimen|foundry|type family|character/i
    ]
  },
  articles: {
    name: 'articles',
    description: 'Blog posts, essays, and reading material',
    patterns: [
      /article|blog|post|essay|read/i,
      /writing|written|content|text|publication/i,
      /story|journal|magazine|book|author/i
    ]
  },
  inspiration: {
    name: 'inspiration',
    description: 'Creative inspiration and innovative ideas',
    patterns: [
      /inspiration|inspiring|innovative|impressive|creative/i,
      /showcase|collection|curated|beautiful|stunning/i,
      /ideas|concept|reference|example|gallery/i
    ]
  },
  apps: {
    name: 'apps',
    description: 'Web and mobile applications',
    patterns: [
      /app|\\.app|application|product|service/i,
      /platform|software|program|system|solution/i,
      /web app|mobile app|desktop app|interface/i
    ]
  },
  guides: {
    name: 'guides',
    description: 'Tutorials, how-tos, and educational content',
    patterns: [
      /guide|tutorial|how-to|learn|education/i,
      /lesson|course|class|training|workshop/i,
      /documentation|explanation|instruction/i
    ]
  }
};

// Helper function to determine the best category based on real-world usage
function determineCategory(bookmark) {
  const contentToAnalyze = `${bookmark.name || ''} ${bookmark.description || ''} ${bookmark.url || ''}`.toLowerCase();
  
  // Score for each category
  const scores = {};
  
  // Calculate score for each category
  Object.entries(categories).forEach(([categoryKey, category]) => {
    scores[categoryKey] = 0;
    
    // Check each pattern
    category.patterns.forEach(pattern => {
      const matches = contentToAnalyze.match(pattern);
      if (matches) {
        scores[categoryKey] += matches.length * 10;
      }
    });
    
    // Special case refinements for better real-world matching
    
    // URL-based scoring
    if (bookmark.url) {
      const url = bookmark.url.toLowerCase();
      
      // Design portfolios and agencies
      if (categoryKey === 'design' && 
          (url.includes('portfolio') || 
           url.includes('design') ||
           url.includes('studio') ||
           url.match(/\.(design|studio|art)\//) ||
           url.match(/\/portfolio\//))) {
        scores.design += 20;
      }
      
      // Development resources
      if (categoryKey === 'dev' && 
          (url.includes('github.com') || 
           url.includes('gitlab.com') ||
           url.includes('stackoverflow.com') ||
           url.includes('developer'))) {
        scores.dev += 25;
      }
      
      // Font foundries and type specimens
      if (categoryKey === 'fonts' &&
          (url.includes('font') ||
           url.includes('type.') ||
           url.match(/typeface|specimen|foundry/i))) {
        scores.fonts += 30;
      }
      
      // Articles and blogs
      if (categoryKey === 'articles' &&
          (url.includes('blog') ||
           url.includes('article') ||
           url.includes('medium.com') ||
           url.includes('magazine'))) {
        scores.articles += 20;
      }
      
      // Apps and web applications
      if (categoryKey === 'apps' &&
          (url.includes('.app') ||
           url.includes('app.') ||
           url.includes('application'))) {
        scores.apps += 25;
      }
    }
    
    // Name-based refinements for better real-world matching
    if (bookmark.name) {
      const name = bookmark.name.toLowerCase();
      
      // Font detection
      if (categoryKey === 'fonts' && 
          (name.includes('font') || 
           name.includes('typeface') ||
           name.match(/mono|grotesk|serif|sans|variable/))) {
        scores.fonts += 30;
      }
      
      // Tool detection
      if (categoryKey === 'tools' && 
          (name.includes('tool') || 
           name.includes('app') ||
           name.match(/maker|generator|builder|creator/))) {
        scores.tools += 20;
      }
      
      // Development resources
      if (categoryKey === 'dev' && 
          (name.includes('code') ||
           name.includes('dev') ||
           name.includes('programming'))) {
        scores.dev += 15;
      }
    }
    
    // Description-based refinements for better real-world matching
    if (bookmark.description) {
      const desc = bookmark.description.toLowerCase();
      
      // Design studios and portfolios
      if (categoryKey === 'design' &&
          (desc.includes('design studio') ||
           desc.includes('agency') ||
           desc.includes('portfolio') ||
           desc.includes('designer'))) {
        scores.design += 25;
      }
      
      // Articles and reading material
      if (categoryKey === 'articles' &&
          (desc.includes('article') ||
           desc.includes('blog') ||
           desc.includes('essay') ||
           desc.includes('writing'))) {
        scores.articles += 20;
      }
      
      // Tools and utilities
      if (categoryKey === 'tools' &&
          (desc.includes('tool') ||
           desc.includes('utility') ||
           desc.includes('app for') ||
           desc.includes('helps you'))) {
        scores.tools += 20;
      }
      
      // Inspirational content
      if (categoryKey === 'inspiration' &&
          (desc.includes('inspiration') ||
           desc.includes('showcase') ||
           desc.includes('collection') ||
           desc.includes('curated'))) {
        scores.inspiration += 15;
      }
    }
  });
  
  // Find category with highest score
  let bestCategory = null;
  let highestScore = 0;
  
  Object.entries(scores).forEach(([category, score]) => {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  });
  
  // Default to 'design' if no clear category (most common for design-focused collections)
  return bestCategory || 'design';
}

// Process all bookmarks
let changesCount = 0;
const changes = [];

// Existing category counts for comparison
const oldCategoryCounts = {};
bookmarksData.bookmarks.forEach(bookmark => {
  oldCategoryCounts[bookmark.category] = (oldCategoryCounts[bookmark.category] || 0) + 1;
});

// Apply new categories
bookmarksData.bookmarks.forEach(bookmark => {
  const oldCategory = bookmark.category;
  const newCategory = determineCategory(bookmark);
  
  if (oldCategory !== newCategory) {
    changes.push(`"${bookmark.name}" from "${oldCategory}" to "${newCategory}"`);
    bookmark.category = newCategory;
    changesCount++;
  }
});

// Write updated data back to file
fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarksData, null, 2));

// Calculate new category counts
const newCategoryCounts = {};
bookmarksData.bookmarks.forEach(bookmark => {
  newCategoryCounts[bookmark.category] = (newCategoryCounts[bookmark.category] || 0) + 1;
});

// Print summary
console.log('Old category distribution:');
Object.entries(oldCategoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  console.log(`${category}: ${count}`);
});

console.log('\nNew practical category distribution:');
Object.entries(newCategoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  console.log(`${category}: ${count}`);
});

console.log(`\nTotal changes made: ${changesCount}`);
console.log('\nNew practical category system:');
Object.entries(categories).forEach(([key, category]) => {
  console.log(`- ${category.name}: ${category.description}`);
});

console.log('\nSample changes:');
changes.slice(0, 15).forEach(change => console.log(change));
if (changes.length > 15) {
  console.log(`...and ${changes.length - 15} more changes`);
}

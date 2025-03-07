#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { format, parseISO } from 'date-fns';
import CryptoJS from 'crypto-js';
import * as cheerio from 'cheerio';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKMARKS_PATH = path.join(__dirname, '../src/data/bookmarks.json');
const CONFIG_PATH = path.join(__dirname, '../.bookmark-cli-config.json');

// Encryption key storage (will be stored securely)
let encryptionKey = null;

// Initialize the CLI
async function init() {
  try {
    await fs.access(BOOKMARKS_PATH);
  } catch (error) {
    console.log(chalk.yellow('Bookmarks file not found. Creating one...'));
    await fs.writeFile(BOOKMARKS_PATH, JSON.stringify({ bookmarks: [] }, null, 2));
  }

  try {
    await fs.access(CONFIG_PATH);
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
    if (config.encryptionKey) {
      encryptionKey = config.encryptionKey;
    }
  } catch (error) {
    // Config doesn't exist yet, will create when needed
  }
}

// Load bookmarks
async function loadBookmarks() {
  const data = await fs.readFile(BOOKMARKS_PATH, 'utf8');
  return JSON.parse(data);
}

// Save bookmarks
async function saveBookmarks(bookmarks) {
  await fs.writeFile(BOOKMARKS_PATH, JSON.stringify(bookmarks, null, 2));
}

// Secure the encryption key
async function setupEncryption() {
  if (encryptionKey) return;
  
  const { setupKey } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupKey',
      message: 'Would you like to set up encryption for secure bookmark storage?',
      default: true
    }
  ]);
  
  if (setupKey) {
    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter a secure password for encryption:',
        validate: (input) => input.length >= 8 ? true : 'Password must be at least 8 characters long'
      }
    ]);
    
    // Generate a random key and encrypt it with the password
    encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const encryptedKey = CryptoJS.AES.encrypt(encryptionKey, password).toString();
    
    await fs.writeFile(CONFIG_PATH, JSON.stringify({ encryptionKey: encryptedKey }, null, 2));
    console.log(chalk.green('Encryption set up successfully!'));
  }
}

// Encrypt sensitive data
function encryptData(text) {
  if (!encryptionKey) return text;
  return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

// Decrypt sensitive data
function decryptData(ciphertext) {
  if (!encryptionKey) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return ciphertext; // Not encrypted or wrong key
  }
}

// Fetch website metadata
async function fetchMetadata(url) {
  console.log(chalk.blue('Fetching metadata from URL...'));
  
  try {
    // Use curl with user agent to better handle websites that might block bots
    // First check if the URL is accessible (response code)
    const { stdout: headerOutput } = await exec(`curl -s -I -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" "${url}"`);
    
    // If we got a 404 or other error, handle it gracefully
    if (headerOutput.includes('HTTP/') && !headerOutput.includes('HTTP/2 200') && !headerOutput.includes('HTTP/1.1 200')) {
      // For GitHub repos, try to extract repo info from the URL
      if (url.includes('github.com')) {
        const urlParts = new URL(url).pathname.split('/').filter(Boolean);
        if (urlParts.length >= 2) {
          const [owner, repo] = urlParts;
          return {
            name: `${owner}/${repo}`,
            description: `GitHub repository by ${owner}`,
            category: 'engineering'
          };
        }
      }
      
      // For other URLs, fall back to parsing the URL itself
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
      const cleanName = lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || url.split('/').pop();
      
      return {
        name: cleanName,
        description: `Content from ${new URL(url).hostname}`,
        category: 'uncategorized'
      };
    }
    
    // Fetch the actual content
    const { stdout } = await exec(`curl -s -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" "${url}"`);
    const $ = cheerio.load(stdout);
    
    // Extract metadata
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="twitter:title"]').attr('content') || 
                 url.split('/').pop();
                 
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || 
                       '';
    
    // Special handling for GitHub repositories
    if (url.includes('github.com')) {
      const urlParts = new URL(url).pathname.split('/').filter(Boolean);
      
      // Check if this is a repository page
      if (urlParts.length >= 2 && !urlParts.includes('blog') && !urlParts.includes('about')) {
        const [owner, repo] = urlParts;
        
        // Try to extract repository description
        const repoDesc = $('.f4.my-3').text().trim() || 
                        $('meta[name="description"]').attr('content') || 
                        `GitHub repository by ${owner}`;
        
        return {
          name: `${owner}/${repo}`,
          description: repoDesc,
          category: 'engineering'
        };
      }
    }
    
    // Try to determine the category based on meta keywords or other signals
    let suggestedCategory = $('meta[name="keywords"]').attr('content') || '';
    
    // If there are keywords, use the first one as the category
    if (suggestedCategory) {
      suggestedCategory = suggestedCategory.split(',')[0].trim().toLowerCase();
    } else {
      // Make a guess based on common domains and URL patterns
      const domain = new URL(url).hostname.toLowerCase();
      const path = new URL(url).pathname.toLowerCase();
      
      // Tech websites and frameworks
      if (domain.includes('astro.') || domain.includes('astro-')) {
        suggestedCategory = 'astro';
      }
      else if (
        domain.includes('react') || 
        domain.includes('vue') || 
        domain.includes('angular') || 
        domain.includes('svelte') ||
        domain.includes('tailwind') ||
        domain.includes('nextjs') ||
        domain.includes('nuxt')
      ) {
        suggestedCategory = 'framework';
      }
      else if (domain.includes('github')) {
        suggestedCategory = path.includes('blog') ? 'blog' : 'engineering';
      }
      else if (domain.includes('medium') || domain.includes('dev.to')) suggestedCategory = 'blog';
      else if (domain.includes('dev') || domain.includes('stack')) suggestedCategory = 'development';
      else if (domain.includes('design') || domain.includes('dribbble')) suggestedCategory = 'design';
      else if (
        domain.includes('ai') || 
        path.includes('ai') || 
        domain.includes('openai') || 
        domain.includes('huggingface') ||
        domain.includes('anthropic')
      ) suggestedCategory = 'ai';
      else if (domain.includes('docs') || path.includes('docs')) suggestedCategory = 'documentation';
      else if (domain.includes('npm') || domain.includes('yarn')) suggestedCategory = 'package';
      else if (domain.includes('youtube') || domain.includes('vimeo')) suggestedCategory = 'video';
      else if (
        domain.includes('jamstack') || 
        domain.includes('netlify') || 
        domain.includes('vercel') || 
        domain.includes('cloudflare')
      ) suggestedCategory = 'hosting';
      else if (title.toLowerCase().includes('performance') || description.toLowerCase().includes('performance')) suggestedCategory = 'performance';
      else if (title.toLowerCase().includes('seo') || description.toLowerCase().includes('seo')) suggestedCategory = 'seo';
      else if (
        domain.includes('.js') || 
        domain.includes('typescript') || 
        domain.includes('javascript') ||
        domain.includes('python') ||
        domain.includes('ruby') ||
        domain.includes('rust')
      ) suggestedCategory = 'programming';
      else if (domain.includes('mdx') || domain.includes('markdown')) suggestedCategory = 'content';
      else suggestedCategory = 'uncategorized';
    }
    
    // Clean up title - remove common suffixes
    let cleanTitle = title
      .replace(/\s*[-|]\s*GitHub.*$/, '')  // Remove GitHub suffix
      .replace(/\s*[-|]\s*npm.*$/, '')     // Remove npm suffix
      .replace(/\s*[-|]\s*YouTube.*$/, '') // Remove YouTube suffix
      .replace(/\s*[-|]\s*Medium.*$/, '')  // Remove Medium suffix
      .replace(/\s*[-|]\s*DEV Community.*$/, '') // Remove DEV suffix
      .trim();
      
    // If title is too long, try to extract the main part
    if (cleanTitle.length > 60) {
      const parts = cleanTitle.split(/[-|:]/);
      if (parts.length > 1) {
        cleanTitle = parts[0].trim();
      }
    }
    
    // If still too long or empty, fallback to the URL path
    if (cleanTitle.length > 60 || cleanTitle.length === 0) {
      // Get the last path segment
      const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
      
      // Replace hyphens and underscores with spaces and capitalize
      cleanTitle = lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return {
      name: cleanTitle,
      description,
      category: suggestedCategory
    };
  } catch (error) {
    console.log(chalk.yellow('Error fetching metadata, using defaults'));
    
    // Try to extract meaningful information from the URL
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      
      // For GitHub repositories, try to extract owner/repo format
      if (domain.includes('github.com') && pathSegments.length >= 2) {
        const [owner, repo] = pathSegments;
        return {
          name: `${owner}/${repo}`,
          description: `GitHub repository by ${owner}`,
          category: 'engineering'
        };
      }
      
      // For other URLs, use the last path segment
      const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
      const cleanName = lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || domain;
      
      return {
        name: cleanName,
        description: `Content from ${domain}`,
        category: 'uncategorized'
      };
    } catch (parseError) {
      // If all else fails, just use the URL
      return {
        name: url.split('/').pop() || 'Bookmark',
        description: '',
        category: 'uncategorized'
      };
    }
  }
}

// Format timestamp for display
function formatTimestamp(timestamp) {
  try {
    if (!timestamp) return 'Unknown';
    
    // If it's just a date string (YYYY-MM-DD format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(timestamp)) {
      return timestamp;
    }
    
    // If it's an ISO timestamp
    return format(parseISO(timestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    return timestamp; // Return original if parsing fails
  }
}

// Get current ISO timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// List all bookmarks
async function listBookmarks(options = {}) {
  let data;
  try {
    data = await loadBookmarks();
  } catch (error) {
    console.error(chalk.red('Error loading bookmarks:'), error.message);
    return;
  }
  
  // Filter by category if specified
  let filteredBookmarks = data.bookmarks;
  if (options.category) {
    filteredBookmarks = filteredBookmarks.filter(b => b.category?.toLowerCase() === options.category.toLowerCase());
  }
  
  // Sort by date if needed
  if (options.sort === 'date') {
    filteredBookmarks.sort((a, b) => {
      const dateA = a.timestamp || a.date || '';
      const dateB = b.timestamp || b.date || '';
      return dateB.localeCompare(dateA); // Sort descending (newest first)
    });
  }
  
  if (filteredBookmarks.length === 0) {
    console.log(chalk.yellow('No bookmarks found.'));
    return;
  }
  
  console.log(chalk.bold('\nYour Bookmarks:'));
  
  filteredBookmarks.forEach((bookmark, index) => {
    console.log(`\n${chalk.cyan(index + 1)}. ${chalk.bold(bookmark.name)}`);
    console.log(`   ${chalk.blue('URL:')} ${bookmark.url}`);
    console.log(`   ${chalk.green('Category:')} ${bookmark.category || 'Uncategorized'}`);
    if (bookmark.description) {
      console.log(`   ${chalk.yellow('Description:')} ${bookmark.description}`);
    }
    if (bookmark.timestamp || bookmark.date) {
      const displayDate = bookmark.timestamp ? formatTimestamp(bookmark.timestamp) : bookmark.date;
      console.log(`   ${chalk.magenta('Date Added:')} ${displayDate}`);
    }
    if (bookmark.id) {
      console.log(`   ${chalk.cyan('ID:')} ${bookmark.id}`);
    }
  });
}

// Add a new bookmark
async function addBookmark(options) {
  // If quick add mode and we have URL
  if (options.quick && options.url) {
    const timestamp = getCurrentTimestamp();
    const data = await loadBookmarks();
    
    // If auto-fetch metadata is requested
    if (!options.name || !options.description || !options.category) {
      try {
        const metadata = await fetchMetadata(options.url);
        
        // Use provided options or fall back to fetched metadata
        options.name = options.name || metadata.name;
        options.description = options.description || metadata.description;
        options.category = options.category || metadata.category;
      } catch (error) {
        console.log(chalk.yellow('Failed to fetch metadata. Using defaults.'));
      }
    }
    
    // Ensure category is a single string, not an array
    const singleCategory = Array.isArray(options.category) 
      ? options.category[0] 
      : options.category || 'uncategorized';
    
    const newBookmark = {
      id: crypto.randomUUID(),
      name: options.name || options.url.split('/').pop(),
      url: options.url,
      category: singleCategory,
      description: options.description || '',
      timestamp: timestamp
    };
    
    data.bookmarks.push(newBookmark);
    await saveBookmarks(data);
    console.log(chalk.green(`\nQuickly added: ${chalk.bold(newBookmark.name)}`));
    console.log(`   ${chalk.blue('URL:')} ${newBookmark.url}`);
    console.log(`   ${chalk.green('Category:')} ${newBookmark.category}`);
    if (newBookmark.description) {
      console.log(`   ${chalk.yellow('Description:')} ${newBookmark.description}`);
    }
    console.log(`   ${chalk.magenta('Date Added:')} ${formatTimestamp(newBookmark.timestamp)}`);
    console.log(`   ${chalk.cyan('ID:')} ${newBookmark.id}`);
    return;
  }
  
  // Otherwise, prompt for all details
  const { name, url, categoryInput, description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter bookmark name:',
      validate: (input) => input.trim() !== '' ? true : 'Name is required'
    },
    {
      type: 'input',
      name: 'url',
      message: 'Enter bookmark URL:',
      validate: (input) => {
        try {
          new URL(input); // Validate URL format
          return true;
        } catch (e) {
          return 'Please enter a valid URL (including http:// or https://)';
        }
      }
    },
    {
      type: 'input',
      name: 'categoryInput',
      message: 'Enter a single category:',
      default: 'uncategorized'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Enter description (optional):'
    }
  ]);
  
  // Process category - always use a single string
  const category = categoryInput.includes(',') 
    ? categoryInput.split(',')[0].trim() 
    : categoryInput.trim();
  
  const timestamp = getCurrentTimestamp();
  const data = await loadBookmarks();
  
  const newBookmark = {
    id: crypto.randomUUID(),
    name,
    url,
    category,
    description,
    timestamp
  };
  
  data.bookmarks.push(newBookmark);
  await saveBookmarks(data);
  console.log(chalk.green(`\nBookmark added: ${chalk.bold(name)}`));
}

// Delete a bookmark
async function deleteBookmark() {
  const data = await loadBookmarks();
  
  if (data.bookmarks.length === 0) {
    console.log(chalk.yellow('No bookmarks to delete.'));
    return;
  }
  
  const choices = data.bookmarks.map((bookmark, index) => ({
    name: `${index + 1}. ${bookmark.name} (${bookmark.url})`,
    value: index
  }));
  
  const { index } = await inquirer.prompt([
    {
      type: 'list',
      name: 'index',
      message: 'Select a bookmark to delete:',
      choices
    }
  ]);
  
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete "${data.bookmarks[index].name}"?`,
      default: false
    }
  ]);
  
  if (confirm) {
    const deleted = data.bookmarks.splice(index, 1)[0];
    await saveBookmarks(data);
    console.log(chalk.green(`\nDeleted: ${chalk.bold(deleted.name)}`));
  } else {
    console.log(chalk.yellow('Deletion cancelled.'));
  }
}

// Search bookmarks
async function searchBookmarks(searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    console.error(chalk.red('Please provide a search term'));
    return;
  }
  
  searchTerm = searchTerm.toLowerCase();
  
  let data;
  try {
    data = await loadBookmarks();
  } catch (error) {
    console.error(chalk.red('Error loading bookmarks:'), error.message);
    return;
  }
  
  const results = data.bookmarks.filter(bookmark => 
    bookmark.name.toLowerCase().includes(searchTerm) ||
    bookmark.url.toLowerCase().includes(searchTerm) ||
    bookmark.description?.toLowerCase().includes(searchTerm) ||
    bookmark.category?.toLowerCase().includes(searchTerm)
  );
  
  if (results.length === 0) {
    console.log(chalk.yellow(`No bookmarks found matching '${searchTerm}'`));
    return;
  }
  
  results.forEach((bookmark, index) => {
    console.log(`\n${chalk.cyan(index + 1)}. ${chalk.bold(bookmark.name)}`);
    console.log(`   ${chalk.blue('URL:')} ${bookmark.url}`);
    console.log(`   ${chalk.green('Category:')} ${bookmark.category || 'Uncategorized'}`);
    if (bookmark.description) {
      console.log(`   ${chalk.yellow('Description:')} ${bookmark.description}`);
    }
    if (bookmark.timestamp || bookmark.date) {
      const displayDate = bookmark.timestamp ? formatTimestamp(bookmark.timestamp) : bookmark.date;
      console.log(`   ${chalk.magenta('Date Added:')} ${displayDate}`);
    }
    if (bookmark.id) {
      console.log(`   ${chalk.cyan('ID:')} ${bookmark.id}`);
    }
  });
}

// Convert existing bookmarks to use single category
async function convertCategoriesToSingle() {
  try {
    const data = await loadBookmarks();
    let modified = false;
    
    data.bookmarks = data.bookmarks.map(bookmark => {
      if (Array.isArray(bookmark.category)) {
        modified = true;
        return {
          ...bookmark,
          category: bookmark.category[0] || 'uncategorized'
        };
      }
      return bookmark;
    });
    
    if (modified) {
      await saveBookmarks(data);
      console.log(chalk.green('Successfully converted all bookmarks to use a single category.'));
    } else {
      console.log(chalk.blue('All bookmarks already use single categories. No changes needed.'));
    }
  } catch (error) {
    console.error(chalk.red('Error converting categories:'), error.message);
  }
}

// Add unique IDs to all bookmarks that don't have them
async function addUniqueIds() {
  try {
    const data = await loadBookmarks();
    let modified = false;
    
    data.bookmarks = data.bookmarks.map(bookmark => {
      if (!bookmark.id) {
        modified = true;
        return {
          id: crypto.randomUUID(),
          ...bookmark
        };
      }
      return bookmark;
    });
    
    if (modified) {
      await saveBookmarks(data);
      console.log(chalk.green('Successfully added unique IDs to all bookmarks.'));
    } else {
      console.log(chalk.blue('All bookmarks already have unique IDs. No changes needed.'));
    }
  } catch (error) {
    console.error(chalk.red('Error adding unique IDs:'), error.message);
  }
}

// Update existing date fields to timestamps
async function updateTimestamps() {
  try {
    const data = await loadBookmarks();
    let modified = false;
    
    data.bookmarks = data.bookmarks.map(bookmark => {
      // If there's no timestamp but there's a date
      if (!bookmark.timestamp && bookmark.date) {
        modified = true;
        
        // Try to convert date to a timestamp
        let timestamp;
        if (/^\d{4}-\d{2}-\d{2}$/.test(bookmark.date)) {
          // If it's a valid date string (YYYY-MM-DD), create a timestamp at noon on that day
          const dateObj = new Date(bookmark.date + 'T12:00:00Z');
          timestamp = dateObj.toISOString();
        } else {
          // Otherwise, use current time
          timestamp = getCurrentTimestamp();
        }
        
        return {
          ...bookmark,
          timestamp
        };
      } else if (!bookmark.timestamp) {
        // If there's no timestamp or date, add current timestamp
        modified = true;
        return {
          ...bookmark,
          timestamp: getCurrentTimestamp()
        };
      }
      return bookmark;
    });
    
    if (modified) {
      await saveBookmarks(data);
      console.log(chalk.green('Successfully updated all bookmarks with ISO timestamps.'));
    } else {
      console.log(chalk.blue('All bookmarks already have timestamps. No changes needed.'));
    }
  } catch (error) {
    console.error(chalk.red('Error updating timestamps:'), error.message);
  }
}

// Main program
program
  .name('bookmarks')
  .description('CLI to manage your bookmarks')
  .version('1.0.0');

program
  .command('list')
  .description('List all bookmarks')
  .option('-c, --category <category>', 'Filter by category')
  .option('-s, --sort <sort>', 'Sort by: date, name', 'date')
  .action(listBookmarks);

program
  .command('add')
  .description('Add a new bookmark')
  .option('-q, --quick', 'Quick add mode')
  .option('-u, --url <url>', 'Bookmark URL')
  .option('-n, --name <name>', 'Bookmark name')
  .option('-c, --category <category>', 'Bookmark category')
  .option('-d, --description <description>', 'Bookmark description')
  .action(addBookmark);

program
  .command('delete')
  .description('Delete a bookmark')
  .action(deleteBookmark);

program
  .command('search <term>')
  .description('Search bookmarks')
  .action(searchBookmarks);

program
  .command('setup')
  .description('Setup encryption for secure storage')
  .action(setupEncryption);

program
  .command('update-timestamps')
  .description('Update all bookmarks to use ISO timestamps')
  .action(updateTimestamps);

program
  .command('convert-categories')
  .description('Convert all bookmarks to use a single category instead of arrays')
  .action(convertCategoriesToSingle);

program
  .command('add-ids')
  .description('Add unique IDs to all bookmarks that don\'t have them')
  .action(addUniqueIds);

// Allow for quick-add shorthand
program
  .command('quick <url>')
  .description('Quickly add a new bookmark with just URL, metadata is auto-fetched')
  .option('-n, --name <name>', 'Override bookmark name from fetched metadata')
  .option('-c, --category <category>', 'Override bookmark category from fetched metadata')
  .option('-d, --description <description>', 'Override bookmark description from fetched metadata')
  .action(async (url, options) => {
    await addBookmark({
      quick: true,
      url,
      name: options.name,
      category: options.category,
      description: options.description
    });
  });

async function main() {
  await init();
  program.parse(process.argv);
}

main().catch(error => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
});

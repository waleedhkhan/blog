/**
 * GitHub API utility functions
 * Fetches commit history for the blog repository
 */

/**
 * Fetches the latest commits from the GitHub repository
 * @param {number} limit - Maximum number of commits to fetch
 * @returns {Promise<Array>} - Array of commit objects
 */
export async function getLatestCommits(limit = 10) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/waleedhkhan/blog/commits?per_page=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const commits = await response.json();
    
    // Process and format the commits
    return commits.map((commit) => ({
      sha: commit.sha,
      url: commit.html_url,
      date: new Date(commit.commit.author.date),
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        username: commit.author?.login || 'unknown',
        avatar: commit.author?.avatar_url
      }
    }));
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return [];
  }
}

/**
 * Groups commits by month and year
 * @param {Array} commits - Array of commit objects
 * @returns {Object} - Object with keys in the format "YYYY-MM" and values as arrays of commits
 */
export function groupCommitsByMonth(commits) {
  return commits.reduce((groups, commit) => {
    const date = commit.date;
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(commit);
    return groups;
  }, {});
}

/**
 * Formats a date as a readable string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Categorizes commits based on keywords in commit messages
 * @param {Array} commits - Array of commit objects
 * @returns {Object} - Object with categories as keys and arrays of commits as values
 */
export function categorizeCommits(commits) {
  const categories = {
    'Feature': ['feature', 'add', 'implement', 'create', 'support'],
    'Fix': ['fix', 'bug', 'issue', 'resolve', 'patch'],
    'Performance': ['performance', 'optimize', 'speed', 'improve', 'fast'],
    'Design': ['design', 'style', 'ui', 'layout', 'visual', 'css'],
    'Content': ['content', 'post', 'blog', 'article', 'text', 'copy'],
    'SEO': ['seo', 'meta', 'sitemap', 'schema', 'search'],
    'Refactor': ['refactor', 'clean', 'restructure', 'rewrite'],
    'Other': []
  };
  
  return commits.reduce((categorized, commit) => {
    const message = commit.message.toLowerCase();
    let matched = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (category === 'Other') continue;
      
      if (keywords.some(keyword => message.includes(keyword))) {
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(commit);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      if (!categorized['Other']) {
        categorized['Other'] = [];
      }
      categorized['Other'].push(commit);
    }
    
    return categorized;
  }, {});
}

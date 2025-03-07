// Configuration
const API_URL = 'https://heart-bookmarks.info-e8f.workers.dev';

// DOM elements
const statusMessage = document.getElementById('status-message');
const bookmarkTitle = document.getElementById('bookmark-title');
const bookmarkCategory = document.getElementById('bookmark-category');
const addBookmarkButton = document.getElementById('add-bookmark');
const bookmarksContainer = document.getElementById('bookmarks-container');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current tab info
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    // Pre-fill the form with the current tab's title
    bookmarkTitle.value = currentTab.title;
    
    // Check if the current URL is already bookmarked
    const isBookmarked = await checkIfBookmarked(currentTab.url);
    updateBookmarkStatus(isBookmarked);
    
    // Load recent bookmarks
    loadRecentBookmarks();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    showStatus('Error loading data', 'error');
  }
});

// Add bookmark button event listener
addBookmarkButton.addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    const bookmarkData = {
      title: bookmarkTitle.value || currentTab.title,
      url: currentTab.url,
      favicon: currentTab.favIconUrl || '',
      category: bookmarkCategory.value,
      createdAt: new Date().toISOString()
    };
    
    addBookmarkButton.textContent = 'Saving...';
    addBookmarkButton.disabled = true;
    
    const response = await saveBookmark(bookmarkData);
    
    if (response.success) {
      showStatus('Bookmark saved successfully!', 'success');
      loadRecentBookmarks(); // Refresh the list
    } else {
      showStatus('Failed to save bookmark', 'error');
    }
    
    addBookmarkButton.textContent = 'Add to Favorites';
    addBookmarkButton.disabled = false;
    
  } catch (error) {
    console.error('Error saving bookmark:', error);
    showStatus('Error saving bookmark', 'error');
    addBookmarkButton.textContent = 'Add to Favorites';
    addBookmarkButton.disabled = false;
  }
});

// Check if URL is already bookmarked
async function checkIfBookmarked(url) {
  try {
    const response = await fetch(`${API_URL}/check?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.isBookmarked;
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}

// Save bookmark to Cloudflare Worker
async function saveBookmark(bookmarkData) {
  try {
    // Get user token from storage
    const storage = await chrome.storage.local.get('userToken');
    const userToken = storage.userToken || 'anonymous';
    
    const response = await fetch(`${API_URL}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(bookmarkData)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return { success: false, error: error.message };
  }
}

// Load recent bookmarks
async function loadRecentBookmarks() {
  try {
    // Get user token from storage
    const storage = await chrome.storage.local.get('userToken');
    const userToken = storage.userToken || 'anonymous';
    
    const response = await fetch(`${API_URL}/bookmarks/recent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.bookmarks.length > 0) {
      renderBookmarks(data.bookmarks);
    } else {
      bookmarksContainer.innerHTML = '<div class="no-bookmarks">No bookmarks yet</div>';
    }
  } catch (error) {
    console.error('Error loading recent bookmarks:', error);
    bookmarksContainer.innerHTML = '<div class="error">Failed to load bookmarks</div>';
  }
}

// Render bookmarks list
function renderBookmarks(bookmarks) {
  bookmarksContainer.innerHTML = '';
  
  bookmarks.slice(0, 5).forEach(bookmark => {
    const bookmarkItem = document.createElement('div');
    bookmarkItem.className = 'bookmark-item';
    
    bookmarkItem.innerHTML = `
      <div class="bookmark-info">
        <div class="bookmark-title" title="${bookmark.title}">
          ${bookmark.title}
          <span class="category-tag">${bookmark.category}</span>
        </div>
      </div>
      <div class="bookmark-actions">
        <button class="delete-btn" data-id="${bookmark.id}">Remove</button>
      </div>
    `;
    
    bookmarksContainer.appendChild(bookmarkItem);
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const bookmarkId = e.target.dataset.id;
      await deleteBookmark(bookmarkId);
      loadRecentBookmarks(); // Refresh the list
    });
  });
}

// Delete bookmark
async function deleteBookmark(bookmarkId) {
  try {
    // Get user token from storage
    const storage = await chrome.storage.local.get('userToken');
    const userToken = storage.userToken || 'anonymous';
    
    const response = await fetch(`${API_URL}/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showStatus('Bookmark removed', 'success');
    } else {
      showStatus('Failed to remove bookmark', 'error');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    showStatus('Error removing bookmark', 'error');
    return { success: false, error: error.message };
  }
}

// Update bookmark status display
function updateBookmarkStatus(isBookmarked) {
  if (isBookmarked) {
    showStatus('This page is already in your favorites', 'success');
    addBookmarkButton.textContent = 'Update Bookmark';
  } else {
    statusMessage.innerHTML = '';
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.innerHTML = `<div class="status-message ${type}">${message}</div>`;
  
  // Auto-clear after 3 seconds
  setTimeout(() => {
    statusMessage.innerHTML = '';
  }, 3000);
}

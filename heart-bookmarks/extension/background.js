// Background service worker for Heart Bookmarks extension
const API_URL = 'https://heart-bookmarks.info-e8f.workers.dev';

// Listen for installation event
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Heart Bookmarks extension installed');
  
  // Generate a unique anonymous user ID if none exists
  const storage = await chrome.storage.local.get('userToken');
  if (!storage.userToken) {
    const uniqueId = generateUniqueId();
    await chrome.storage.local.set({ userToken: uniqueId });
    console.log('Generated anonymous user token');
  }
});

// Context menu to add bookmarks
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-to-heart-bookmarks',
    title: 'Add to Heart Bookmarks',
    contexts: ['page', 'link']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-to-heart-bookmarks') {
    const url = info.linkUrl || info.pageUrl;
    const title = tab.title;
    
    try {
      // Get user token from storage
      const storage = await chrome.storage.local.get('userToken');
      const userToken = storage.userToken || 'anonymous';
      
      // Create bookmark data
      const bookmarkData = {
        title: title,
        url: url,
        favicon: tab.favIconUrl || '',
        category: 'general',
        createdAt: new Date().toISOString()
      };
      
      // Send bookmark data to API
      const response = await fetch(`${API_URL}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(bookmarkData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/heart128.png',
          title: 'Heart Bookmarks',
          message: 'Bookmark added successfully!'
        });
      } else {
        // Show error notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/heart128.png',
          title: 'Heart Bookmarks',
          message: 'Failed to add bookmark'
        });
      }
    } catch (error) {
      console.error('Error adding bookmark from context menu:', error);
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/heart128.png',
        title: 'Heart Bookmarks',
        message: 'Error adding bookmark'
      });
    }
  }
});

// Generate a unique ID for anonymous users
function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Check for sync opportunities
chrome.alarms.create('sync-bookmarks', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-bookmarks') {
    try {
      // Get user token from storage
      const storage = await chrome.storage.local.get('userToken');
      const userToken = storage.userToken || 'anonymous';
      
      // Call sync endpoint
      await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      console.log('Bookmarks synced successfully');
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
    }
  }
});

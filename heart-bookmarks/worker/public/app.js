// Heart Bookmarks Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const API_URL = location.hostname === 'localhost' ? 'http://localhost:8787' : '';
  let userToken = null;
  let currentCategory = 'all';
  let currentPage = 1;
  let currentSort = 'newest';
  
  // Elements
  const bookmarksGrid = document.getElementById('bookmarks-grid');
  const categoriesList = document.getElementById('categories-list');
  const currentCategoryTitle = document.getElementById('current-category');
  const totalBookmarksElem = document.getElementById('total-bookmarks');
  const usernameElem = document.getElementById('username');
  const sortBySelect = document.getElementById('sort-by');
  const paginationElem = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');
  
  // Modals
  const addBookmarkModal = document.getElementById('add-bookmark-modal');
  const addBookmarkForm = document.getElementById('add-bookmark-form');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelAddBtn = document.getElementById('cancel-add');
  const addBookmarkBtn = document.getElementById('add-bookmark-btn');
  
  // Initialize application
  init();
  
  async function init() {
    // Get user token from local storage
    userToken = localStorage.getItem('userToken');
    
    // If no token, generate one
    if (!userToken) {
      userToken = generateUniqueId();
      localStorage.setItem('userToken', userToken);
    }
    
    // Display anonymous username
    usernameElem.textContent = `User: ${userToken.substring(0, 8)}...`;
    
    // Load data
    await Promise.all([
      loadBookmarks(),
      loadCategories()
    ]);
    
    // Setup event listeners
    setupEventListeners();
  }
  
  function setupEventListeners() {
    // Category selection
    categoriesList.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const category = e.target.dataset.category;
        setActiveCategory(category);
        loadBookmarks();
      }
    });
    
    // Sorting
    sortBySelect.addEventListener('change', () => {
      currentSort = sortBySelect.value;
      loadBookmarks();
    });
    
    // Search input
    searchInput.addEventListener('input', debounce(() => {
      loadBookmarks();
    }, 300));
    
    // Add bookmark modal
    addBookmarkBtn.addEventListener('click', () => {
      openAddBookmarkModal();
    });
    
    closeModalBtn.addEventListener('click', () => {
      closeAddBookmarkModal();
    });
    
    cancelAddBtn.addEventListener('click', () => {
      closeAddBookmarkModal();
    });
    
    // Add bookmark form
    addBookmarkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBookmark();
    });
  }
  
  async function loadBookmarks() {
    // Show loading state
    bookmarksGrid.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading your bookmarks...</p>
      </div>
    `;
    
    try {
      // Build URL
      let url = `${API_URL}/bookmarks?page=${currentPage}`;
      
      // Add category filter if not "all"
      if (currentCategory !== 'all') {
        url += `&category=${currentCategory}`;
      }
      
      // Add search query if present
      const searchQuery = searchInput.value.trim();
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      // Fetch bookmarks
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        renderBookmarks(data.bookmarks);
        renderPagination(data.pagination);
        totalBookmarksElem.textContent = data.pagination.totalItems;
      } else {
        bookmarksGrid.innerHTML = `
          <div class="error-message">
            <p>Failed to load bookmarks. Please try again.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      bookmarksGrid.innerHTML = `
        <div class="error-message">
          <p>Error loading bookmarks. Please check your connection and try again.</p>
        </div>
      `;
    }
  }
  
  async function loadCategories() {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        renderCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  
  function renderBookmarks(bookmarks) {
    if (bookmarks.length === 0) {
      bookmarksGrid.innerHTML = `
        <div class="empty-state">
          <p>No bookmarks found. Add your first bookmark to get started!</p>
          <button class="btn primary" onclick="document.getElementById('add-bookmark-btn').click()">
            Add Bookmark
          </button>
        </div>
      `;
      return;
    }
    
    // Sort bookmarks
    bookmarks = sortBookmarks(bookmarks, currentSort);
    
    bookmarksGrid.innerHTML = bookmarks.map(bookmark => `
      <div class="bookmark-card" data-id="${bookmark.id}">
        <div class="bookmark-header">
          <div class="bookmark-favicon">
            ${bookmark.favicon ? `<img src="${bookmark.favicon}" alt="" width="16" height="16">` : ''}
          </div>
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
        </div>
        <div class="bookmark-body">
          <div class="bookmark-url">
            <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer">${truncateUrl(bookmark.url)}</a>
          </div>
          ${bookmark.description ? `<div class="bookmark-description">${escapeHtml(bookmark.description)}</div>` : ''}
          <div class="bookmark-actions">
            <button class="visit-btn" onclick="window.open('${bookmark.url}', '_blank')">Visit</button>
            <button class="copy-btn" data-url="${bookmark.url}">Copy URL</button>
            <button class="delete btn delete" data-id="${bookmark.id}">Delete</button>
          </div>
        </div>
        <div class="bookmark-footer">
          <span class="bookmark-category">${bookmark.category || 'general'}</span>
          <span class="bookmark-date">${formatDate(bookmark.createdAt)}</span>
        </div>
      </div>
    `).join('');
    
    // Setup copy and delete buttons
    setupCopyButtons();
    setupDeleteButtons();
  }
  
  function renderCategories(categories) {
    // Remove loading indicator
    const loadingItem = categoriesList.querySelector('.loading');
    if (loadingItem) {
      loadingItem.remove();
    }
    
    // Add custom categories
    categories.forEach(category => {
      // Skip if category is already in the list
      if (categoriesList.querySelector(`[data-category="${category.category}"]`)) {
        return;
      }
      
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="#" data-category="${category.category}">
          ${category.category} (${category.count})
        </a>
      `;
      categoriesList.appendChild(li);
    });
  }
  
  function renderPagination(pagination) {
    const { page, totalPages } = pagination;
    
    if (totalPages <= 1) {
      paginationElem.innerHTML = '';
      return;
    }
    
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
      <button 
        ${page === 1 ? 'disabled' : ''} 
        data-page="${page - 1}" 
        class="pagination-prev"
      >
        &laquo;
      </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
        <button 
          data-page="${i}" 
          class="${i === page ? 'active' : ''}"
        >
          ${i}
        </button>
      `;
    }
    
    // Next button
    paginationHtml += `
      <button 
        ${page === totalPages ? 'disabled' : ''} 
        data-page="${page + 1}" 
        class="pagination-next"
      >
        &raquo;
      </button>
    `;
    
    paginationElem.innerHTML = paginationHtml;
    
    // Setup pagination event listeners
    paginationElem.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          currentPage = parseInt(btn.dataset.page);
          loadBookmarks();
        }
      });
    });
  }
  
  function setActiveCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // Update UI
    document.querySelectorAll('#categories-list a').forEach(a => {
      a.classList.remove('active');
    });
    
    document.querySelector(`#categories-list a[data-category="${category}"]`).classList.add('active');
    currentCategoryTitle.textContent = category === 'all' ? 'All Bookmarks' : capitalizeFirstLetter(category);
  }
  
  function sortBookmarks(bookmarks, sortBy) {
    switch (sortBy) {
      case 'newest':
        return bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return bookmarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'alphabetical':
        return bookmarks.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return bookmarks;
    }
  }
  
  function setupCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        navigator.clipboard.writeText(url)
          .then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 2000);
          })
          .catch(err => {
            console.error('Error copying URL:', err);
          });
      });
    });
  }
  
  function setupDeleteButtons() {
    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        
        if (confirm('Are you sure you want to delete this bookmark?')) {
          try {
            const response = await fetch(`${API_URL}/bookmarks/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
            
            const data = await response.json();
            
            if (data.success) {
              // Remove bookmark from UI
              const card = btn.closest('.bookmark-card');
              card.classList.add('deleting');
              setTimeout(() => {
                card.remove();
              }, 300);
              
              // Reload categories
              loadCategories();
            } else {
              alert('Failed to delete bookmark');
            }
          } catch (error) {
            console.error('Error deleting bookmark:', error);
            alert('Error deleting bookmark');
          }
        }
      });
    });
  }
  
  async function saveBookmark() {
    const url = document.getElementById('bookmark-url').value;
    const title = document.getElementById('bookmark-title').value;
    const category = document.getElementById('bookmark-category').value;
    const description = document.getElementById('bookmark-description').value;
    
    if (!url || !title) {
      alert('URL and title are required');
      return;
    }
    
    try {
      const bookmarkData = {
        url,
        title,
        category,
        description,
        createdAt: new Date().toISOString()
      };
      
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
        // Close modal
        closeAddBookmarkModal();
        
        // Reset form
        addBookmarkForm.reset();
        
        // Reload bookmarks and categories
        loadBookmarks();
        loadCategories();
      } else {
        alert('Failed to save bookmark');
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
      alert('Error saving bookmark');
    }
  }
  
  function openAddBookmarkModal() {
    addBookmarkModal.classList.add('active');
  }
  
  function closeAddBookmarkModal() {
    addBookmarkModal.classList.remove('active');
  }
  
  // Utility Functions
  
  function generateUniqueId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  function truncateUrl(url) {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      
      // Remove www. if present
      if (domain.startsWith('www.')) {
        domain = domain.slice(4);
      }
      
      return domain;
    } catch (e) {
      return url;
    }
  }
  
  function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
});

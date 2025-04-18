/**
 * Micro-interactions for enhancing user experience
 * Following Bauhaus minimal design principles
 */

// Subtle hover interactions for links
function initLinkInteractions() {
  const links = document.querySelectorAll('a:not([class*="no-hover"])');
  
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      // Add subtle scale effect
      link.style.transition = 'transform 0.2s ease-out';
      link.style.transform = 'translateY(-1px)';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'translateY(0)';
    });
  });
}

// Subtle scroll progress indicator
function initScrollProgress() {
  // Only add to pages with significant content
  const contentEl = document.querySelector('article') || document.querySelector('main');
  if (!contentEl || contentEl.offsetHeight < window.innerHeight * 1.5) return;
  
  // Create progress bar if it doesn't exist
  let progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.classList.add('scroll-progress');
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 2px;
      background-color: currentColor;
      opacity: 0.5;
      z-index: 1000;
      transform-origin: left;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(progressBar);
  }
  
  // Update progress on scroll
  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    
    progressBar.style.width = `${scrollPercent}%`;
    progressBar.style.opacity = scrollTop > 100 ? '0.5' : '0';
  };
  
  window.addEventListener('scroll', updateProgress);
  // Initial update
  updateProgress();
}

// Subtle focus states for interactive elements
function initFocusStates() {
  const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  
  focusableElements.forEach(el => {
    el.addEventListener('focus', () => {
      // Add subtle outline that respects dark/light mode
      el.style.outline = 'none';
      el.style.boxShadow = 'var(--focus-ring, 0 0 0 2px oklch(var(--accent) / 0.3))';
    });
    
    el.addEventListener('blur', () => {
      el.style.boxShadow = 'none';
    });
  });
}

// Image reveal on scroll
function initImageReveal() {
  if (!window.IntersectionObserver) return;
  
  const images = document.querySelectorAll('img:not([loading="eager"]):not(.revealed)');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.classList.add('revealed');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '0px 0px 100px 0px',
    threshold: 0.1
  });
  
  images.forEach(img => {
    // Only observe images that aren't already loaded
    if (!img.complete || !img.classList.contains('revealed')) {
      imageObserver.observe(img);
    } else {
      img.classList.add('revealed');
    }
  });
}

// Subtle bookmark hover effect
function initBookmarkInteractions() {
  const bookmarkItems = document.querySelectorAll('.bookmark-card');
  
  bookmarkItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      // Add subtle background change
      item.style.transition = 'background-color 0.2s ease';
      item.style.backgroundColor = 'oklch(var(--surface) / 0.5)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });
  });
}

// Initialize all interactions
function initMicroInteractions() {
  initLinkInteractions();
  initScrollProgress();
  initFocusStates();
  initImageReveal();
  initBookmarkInteractions();
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initMicroInteractions);

// Re-initialize on Astro page transitions
document.addEventListener('astro:page-load', initMicroInteractions);

// Clean up on Astro page unload
document.addEventListener('astro:before-swap', () => {
  // Remove scroll progress bar before page transitions
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    progressBar.remove();
  }
});

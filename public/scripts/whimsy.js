/**
 * Whimsical interactions for your Bauhaus-inspired website
 * Focusing on geometric, playful elements that maintain minimalism
 * 
 * Performance-conscious implementation:
 * - Only initializes if user manually opts in via a toggle
 * - Respects prefers-reduced-motion
 * - Uses minimal DOM operations
 */

// Create a toggle to enable whimsical elements
function createWhimsyToggle() {
  // Only create if it doesn't exist yet
  if (document.querySelector('.whimsy-toggle')) return;
  
  const toggle = document.createElement('button');
  toggle.classList.add('whimsy-toggle');
  toggle.setAttribute('aria-label', 'Toggle whimsical elements');
  toggle.setAttribute('title', 'Toggle whimsical elements');
  toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v.01"></path><path d="M8 11.5a4 4 0 1 1 8 0"></path></svg>`;
  
  document.body.appendChild(toggle);
  
  // Check if whimsy was previously enabled
  const whimsyEnabled = localStorage.getItem('whimsyEnabled') === 'true';
  if (whimsyEnabled) {
    document.body.classList.add('whimsy-mode');
    initAllWhimsicalElements();
  }
  
  // Toggle whimsical elements on click
  toggle.addEventListener('click', () => {
    const isCurrentlyEnabled = document.body.classList.toggle('whimsy-mode');
    localStorage.setItem('whimsyEnabled', isCurrentlyEnabled);
    
    if (isCurrentlyEnabled) {
      initAllWhimsicalElements();
      // Show brief toast notification
      showToast('whimsy enabled!');
    } else {
      removeWhimsicalElements();
      showToast('whimsy disabled');
    }
  });
}

// Show a minimal toast notification
function showToast(message) {
  const existingToast = document.querySelector('.whimsy-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.classList.add('whimsy-toast');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove toast after animation
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Custom cursor with geometric trails
function initGeometricCursor() {
  if (document.querySelector('.geometric-cursor')) return;
  
  const cursor = document.createElement('div');
  cursor.classList.add('geometric-cursor');
  document.body.appendChild(cursor);

  // Create trail elements
  const trailCount = 3;
  const trails = [];
  
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement('div');
    trail.classList.add('cursor-trail');
    trail.style.setProperty('--index', i);
    document.body.appendChild(trail);
    trails.push(trail);
  }

  // Position history for trail effect
  const positions = [];
  
  // Update cursor position on mouse move
  document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('whimsy-mode')) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    
    // Store position for trails
    positions.unshift({ x: mouseX, y: mouseY });
    if (positions.length > trailCount) {
      positions.pop();
    }
    
    // Update trail positions
    trails.forEach((trail, index) => {
      if (positions[index]) {
        trail.style.transform = `translate(${positions[index].x}px, ${positions[index].y}px) scale(${1 - (index * 0.2)})`;
        trail.style.opacity = 1 - (index * 0.3);
      }
    });
  });
}

// Bauhaus-inspired Easter Eggs (random geometric shapes that appear on click)
function initBauhausEasterEggs() {
  const colors = ['#E53935', '#1E88E5', '#FDD835', '#000000']; // Bauhaus colors + black
  const shapes = ['circle', 'square', 'triangle'];
  
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('whimsy-mode')) return;
    
    // Don't create shapes when clicking interactive elements
    if (e.target.closest('a, button, input, textarea, select, .bookmark-card, .whimsy-toggle, .whimsy-toast')) {
      return;
    }
    
    const shape = document.createElement('div');
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 30) + 10; // 10-40px
    
    shape.classList.add('bauhaus-shape', shapeType);
    shape.style.width = `${size}px`;
    shape.style.height = `${size}px`;
    shape.style.backgroundColor = color;
    shape.style.left = `${e.clientX - (size/2)}px`;
    shape.style.top = `${e.clientY - (size/2)}px`;
    
    document.body.appendChild(shape);
    
    // Remove after animation
    setTimeout(() => {
      shape.remove();
    }, 1000);
  });
}

// Letter shuffle effect on headings (minimal version to preserve performance)
function initLetterShuffleEffect() {
  const elements = document.querySelectorAll('.bauhaus-title');
  
  elements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      if (!document.body.classList.contains('whimsy-mode')) return;
      
      const originalText = element.textContent;
      let currentText = '';
      
      // Simple one-time shuffle for better performance
      for (let i = 0; i < originalText.length; i++) {
        if (originalText[i] === ' ') {
          currentText += ' ';
        } else {
          currentText += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        }
      }
      
      element.textContent = currentText;
      
      // Reset after a brief delay
      setTimeout(() => {
        element.textContent = originalText;
      }, 400);
    });
  });
}

// Clean up any whimsical elements when disabled
function removeWhimsicalElements() {
  document.querySelectorAll('.bauhaus-shape, .cursor-trail, .geometric-cursor').forEach(el => el.remove());
}

// Initialize all whimsical elements
function initAllWhimsicalElements() {
  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    initGeometricCursor();
    initBauhausEasterEggs();
    initLetterShuffleEffect();
  }
}

// Initialize just the toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create toggle with minimal delay to ensure page is loaded
  setTimeout(createWhimsyToggle, 1000);
});

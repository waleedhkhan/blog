/**
 * Whimsical interactions for your Bauhaus-inspired website
 * Focusing on geometric, playful elements that maintain minimalism
 */

// Custom cursor with geometric trails
function initGeometricCursor() {
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
    // Don't create shapes when clicking interactive elements
    if (e.target.closest('a, button, input, textarea, select, .bookmark-card')) {
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

// Floating elements effect
function initFloatingElements() {
  const elements = document.querySelectorAll('.bookmark-card, .bauhaus-title, .bauhaus-card');
  
  elements.forEach(element => {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const mouseX = e.clientX - rect.left; 
      const mouseY = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const moveX = (mouseX - centerX) / 20;
      const moveY = (mouseY - centerY) / 20;
      
      element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translate(0, 0)';
    });
  });
}

// Text scramble effect on hover for headings
function initTextScramble() {
  const elements = document.querySelectorAll('.bauhaus-title');
  
  elements.forEach(element => {
    const originalText = element.textContent;
    let frameRequest;
    let frame = 0;
    
    const randomChar = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      return chars[Math.floor(Math.random() * chars.length)];
    };
    
    const updateText = () => {
      let currentText = '';
      const totalFrames = 20;
      
      for (let i = 0; i < originalText.length; i++) {
        if (originalText[i] === ' ') {
          currentText += ' ';
          continue;
        }
        
        // Progress determines how likely we are to show the original character
        const progress = Math.max(0, frame - (i * 2)) / totalFrames;
        
        if (Math.random() < progress) {
          currentText += originalText[i];
        } else {
          currentText += randomChar();
        }
      }
      
      element.textContent = currentText;
      
      if (frame < totalFrames + (originalText.length * 2)) {
        frame++;
        frameRequest = requestAnimationFrame(updateText);
      } else {
        element.textContent = originalText;
      }
    };
    
    element.addEventListener('mouseenter', () => {
      frame = 0;
      frameRequest = requestAnimationFrame(updateText);
    });
    
    element.addEventListener('mouseleave', () => {
      cancelAnimationFrame(frameRequest);
      element.textContent = originalText;
    });
  });
}

// Initialize all whimsical elements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    // Only initialize if user hasn't set reduced motion preference
    setTimeout(() => {
      initGeometricCursor();
      initBauhausEasterEggs();
      initFloatingElements();
      initTextScramble();
    }, 1000); // Slight delay to ensure page is fully loaded
  }
});

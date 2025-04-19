/**
 * Fun interactions for the blog
 * Let's make this site more playful!
 */

// We'll load confetti dynamically to avoid server-side import issues
let confetti;

document.addEventListener('astro:page-load', async () => {
  // Dynamically import confetti
  try {
    const confettiModule = await import('canvas-confetti');
    confetti = confettiModule.default;
  } catch (error) {
    console.error("Failed to load confetti:", error);
    // Create a fallback confetti function that does nothing
    confetti = () => {};
  }

  // Initialize fun interactions with a slight delay to ensure DOM is fully ready
  setTimeout(() => {
    initConfettiEffects();
    initBouncyHeadings();
    initTiltableImages();
    initCursorEffects();
    initCursorBlob();
    initParallaxEffects();
    initKeyboardShortcuts();
    initClickSounds();
    initEasterEggs();
    initShakeEffects();
  }, 100);
});

/**
 * Confetti effects for clicks on important elements
 */
function initConfettiEffects() {
  // Add confetti to important buttons and actions
  document.querySelectorAll('button, .action-btn, .theme-toggle').forEach(element => {
    element.addEventListener('click', (e) => {
      const rect = element.getBoundingClientRect();
      const x = (rect.left + rect.right) / 2 / window.innerWidth;
      const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
      
      // Create a more sophisticated confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#2A2F4F', '#917FB3', '#E5BEEC', '#FDE2F3'],
        disableForReducedMotion: true,
        gravity: 1.2,
        scalar: 0.8,
        ticks: 150
      });
      
      // Secondary burst for more organic feel
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: x + (Math.random() - 0.5) * 0.1, y: y + (Math.random() - 0.5) * 0.1 },
        colors: ['#2A2F4F', '#917FB3', '#E5BEEC', '#FDE2F3'],
        disableForReducedMotion: true,
        gravity: 1 + Math.random() * 0.6,
        scalar: 0.7 + Math.random() * 0.4,
        ticks: 200
      });
    });
  });
}

/**
 * Make headings bouncy and fun
 */
function initBouncyHeadings() {
  // Split headings into individual characters for animation
  document.querySelectorAll('h1, h2, h3').forEach(heading => {
    if (heading.dataset.animated === 'true') return;
    
    const text = heading.textContent;
    heading.textContent = '';
    heading.dataset.animated = 'true';
    
    // Create spans for each character with staggered delays
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? ' ' : char;
      span.style.transitionDelay = `${i * 20}ms`;
      
      // Add wobble effect on hover with smoother animation
      span.addEventListener('mouseover', () => {
        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
          span.style.animation = 'wobble 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        });
        
        setTimeout(() => {
          span.style.animation = '';
        }, 600);
      });
      
      heading.appendChild(span);
    });
  });
}

/**
 * Make images tiltable and interactive with smoother transitions
 */
function initTiltableImages() {
  document.querySelectorAll('img:not(.logo)').forEach(img => {
    // Use throttled event handler for better performance
    let ticking = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let rafId = null;
    
    img.addEventListener('mousemove', (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      if (!ticking) {
        ticking = true;
        
        rafId = requestAnimationFrame(() => {
          const rect = img.getBoundingClientRect();
          const x = lastMouseX - rect.left;
          const y = lastMouseY - rect.top;
          
          const xPercent = (x / rect.width - 0.5) * 20;
          const yPercent = (y / rect.height - 0.5) * 20;
          
          img.style.transform = `perspective(1000px) rotateX(${-yPercent}deg) rotateY(${xPercent}deg) scale(1.05)`;
          
          ticking = false;
        });
      }
    });
    
    img.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      // Use FLIP animation technique for smoother return
      const first = img.getBoundingClientRect();
      img.style.transform = '';
      const last = img.getBoundingClientRect();
      
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      
      img.style.transform = `translate(${dx}px, ${dy}px) perspective(1000px) rotateX(${img._lastYPercent || 0}deg) rotateY(${img._lastXPercent || 0}deg) scale(1.05)`;
      
      requestAnimationFrame(() => {
        img.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        img.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        
        // Reset transition after animation completes
        setTimeout(() => {
          img.style.transition = '';
        }, 500);
      });
    });
    
    // Add click-to-zoom functionality with smoother transitions
    img.addEventListener('click', () => {
      img.classList.toggle('zoomed');
      
      if (img.classList.contains('zoomed')) {
        // Save current position and state
        const rect = img.getBoundingClientRect();
        img._originalPosition = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        };
        
        // Apply zoom with smooth transition
        img.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.01s linear';
        img.style.transform = 'scale(1.5)';
        img.style.zIndex = '999';
        img.style.position = 'relative';
        
        // Play a fun "pop" sound
        playSound('pop');
      } else {
        // Smooth transition back to original state
        img.style.transform = '';
        img.style.zIndex = '';
        
        // Reset position after animation completes
        setTimeout(() => {
          img.style.position = '';
          img.style.transition = '';
        }, 500);
      }
    });
  });
}

/**
 * Add fun cursor effects with smoother movement
 */
function initCursorEffects() {
  // Create cursor dot
  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  
  // Create cursor trail with smoother animation
  const trail = [];
  const trailLength = 10;
  
  for (let i = 0; i < trailLength; i++) {
    const dot = document.createElement('div');
    dot.className = 'cursor-trail-dot';
    dot.style.width = `${8 - (i * 0.7)}px`;
    dot.style.height = `${8 - (i * 0.7)}px`;
    dot.style.backgroundColor = `rgba(42, 47, 79, ${1 - i * 0.1})`;
    dot.style.position = 'fixed';
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    dot.style.zIndex = '9998';
    dot.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(dot);
    trail.push({
      element: dot,
      x: 0,
      y: 0,
      // Add spring physics parameters
      vx: 0,
      vy: 0
    });
  }
  
  // Mouse position
  let mouseX = 0;
  let mouseY = 0;
  
  // Update cursor position with smooth animation
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Use requestAnimationFrame for smoother cursor movement
  function updateCursorPosition() {
    // Update main cursor dot with direct positioning for responsiveness
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
    
    // Update trail with spring physics for smoother following
    const springFactor = 0.15;
    const friction = 0.8;
    
    trail.forEach((dot, i) => {
      if (i === 0) {
        // First dot follows the cursor directly with slight delay
        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        
        dot.vx = dot.vx * friction + dx * springFactor;
        dot.vy = dot.vy * friction + dy * springFactor;
        
        dot.x += dot.vx;
        dot.y += dot.vy;
      } else {
        // Other dots follow the previous dot
        const prevDot = trail[i - 1];
        const dx = prevDot.x - dot.x;
        const dy = prevDot.y - dot.y;
        
        dot.vx = dot.vx * friction + dx * springFactor;
        dot.vy = dot.vy * friction + dy * springFactor;
        
        dot.x += dot.vx;
        dot.y += dot.vy;
      }
      
      dot.element.style.left = `${dot.x}px`;
      dot.element.style.top = `${dot.y}px`;
    });
    
    requestAnimationFrame(updateCursorPosition);
  }
  
  // Start the animation loop
  updateCursorPosition();
  
  // Change cursor size on interactive elements with smoother transitions
  document.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursorDot.style.backgroundColor = 'var(--accent, #2A2F4F)';
      cursorDot.style.mixBlendMode = 'difference';
    });
    
    el.addEventListener('mouseleave', () => {
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorDot.style.backgroundColor = '';
      cursorDot.style.mixBlendMode = '';
    });
  });
}

/**
 * Fluid cursor blob effect with spring physics
 */
function initCursorBlob() {
  const blob = document.createElement('div');
  blob.className = 'cursor-blob';
  document.body.appendChild(blob);
  let blobX = 0, blobY = 0, blobVX = 0, blobVY = 0;
  const springFactor = 0.2, friction = 0.8;
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  function updateBlob() {
    const dx = mouseX - blobX;
    const dy = mouseY - blobY;
    blobVX = blobVX * friction + dx * springFactor;
    blobVY = blobVY * friction + dy * springFactor;
    blobX += blobVX;
    blobY += blobVY;
    blob.style.left = `${blobX}px`;
    blob.style.top = `${blobY}px`;
    const size = 20 + Math.min(10, Math.hypot(blobVX, blobVY) * 2);
    blob.style.width = `${size}px`;
    blob.style.height = `${size}px`;
    requestAnimationFrame(updateBlob);
  }
  updateBlob();
}

/**
 * Parallax scrolling effects for elements with .parallax
 */
function initParallaxEffects() {
  document.querySelectorAll('.parallax').forEach(section => {
    const speed = parseFloat(section.dataset.parallaxSpeed) || 0.3;
    window.addEventListener('scroll', () => {
      const offset = window.scrollY;
      section.style.transform = `translateY(${offset * speed}px)`;
    });
  });
}

/**
 * Add keyboard shortcuts for fun interactions
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Show keyboard shortcuts on '?' key
    if (e.key === '?') {
      showShortcutsModal();
    }
    
    // Navigation shortcuts
    if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      window.location.href = '/';
    }
    
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      window.location.href = '/bookmarks';
    }
    
    // Confetti explosion on 'c' key
    if (e.key === 'c' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      confetti({
        particleCount: 200,
        spread: 180,
        origin: { x: 0.5, y: 0.5 }
      });
      playSound('tada');
    }
    
    // Shake the page on 's' key
    if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
      e.preventDefault();
      document.body.classList.add('shake');
      setTimeout(() => {
        document.body.classList.remove('shake');
      }, 500);
      playSound('shake');
    }
  });
}

/**
 * Show keyboard shortcuts modal
 */
function showShortcutsModal() {
  // Create modal if it doesn't exist
  let modal = document.querySelector('.shortcuts-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    
    const content = document.createElement('div');
    content.className = 'shortcuts-content';
    content.innerHTML = `
      <h2>Keyboard Shortcuts</h2>
      <ul>
        <li><kbd>?</kbd> Show this help</li>
        <li><kbd>Ctrl/⌘</kbd> + <kbd>H</kbd> Go to home</li>
        <li><kbd>Ctrl/⌘</kbd> + <kbd>B</kbd> Go to bookmarks</li>
        <li><kbd>Ctrl/⌘</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> Confetti explosion!</li>
        <li><kbd>Ctrl/⌘</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> Shake the page!</li>
      </ul>
      <button class="close-modal">Close</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Add close button functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    });
  }
  
  // Show modal
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
  
  // Add click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  });
}

/**
 * Add sound effects for more fun
 */
function initClickSounds() {
  // Create audio elements
  const sounds = {
    click: 'https://assets.mixkit.co/sfx/preview/mixkit-light-button-click-1113.mp3',
    pop: 'https://assets.mixkit.co/sfx/preview/mixkit-bubble-pop-up-notification-2357.mp3',
    tada: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
    shake: 'https://assets.mixkit.co/sfx/preview/mixkit-plastic-bubble-click-1124.mp3'
  };
  
  const audioElements = {};
  
  Object.entries(sounds).forEach(([name, url]) => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto';
    audioElements[name] = audio;
  });
  
  // Add click sounds to buttons
  document.querySelectorAll('button, .action-btn').forEach(button => {
    button.addEventListener('click', () => {
      playSound('click');
    });
  });
  
  // Expose play sound function globally
  window.playSound = (name) => {
    if (audioElements[name]) {
      audioElements[name].currentTime = 0;
      audioElements[name].play().catch(() => {
        // Ignore errors - user might not have interacted with the page yet
      });
    }
  };
}

/**
 * Add fun easter eggs
 */
function initEasterEggs() {
  // Konami code (up, up, down, down, left, right, left, right, b, a)
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      
      if (konamiIndex === konamiCode.length) {
        // Activate special effect
        activateMatrixEffect();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
  
  // Add draggable functionality to bookmark cards
  document.querySelectorAll('.bookmark-card').forEach(card => {
    makeDraggable(card);
  });
}

/**
 * Matrix rain effect (easter egg)
 */
function activateMatrixEffect() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Play sound
  playSound('tada');
  
  // Matrix characters
  const chars = '01';
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = [];
  
  // Initialize drops
  for (let i = 0; i < columns; i++) {
    drops[i] = 1;
  }
  
  // Draw matrix
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2A2F4F';
    ctx.font = `${fontSize}px monospace`;
    
    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      
      drops[i]++;
    }
  }
  
  // Run matrix effect
  const interval = setInterval(draw, 33);
  
  // Remove after 5 seconds
  setTimeout(() => {
    clearInterval(interval);
    document.body.removeChild(canvas);
  }, 5000);
}

/**
 * Make an element draggable
 */
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;
  
  element.style.position = 'relative';
  element.style.cursor = 'grab';
  
  element.addEventListener('mousedown', dragMouseDown);
  
  function dragMouseDown(e) {
    e.preventDefault();
    // Get mouse position
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Change cursor
    element.style.cursor = 'grabbing';
    element.style.zIndex = '1000';
    isDragging = true;
    
    // Add event listeners
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
  }
  
  function elementDrag(e) {
    e.preventDefault();
    
    if (!isDragging) return;
    
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Set element's new position
    element.style.top = (element.offsetTop - pos2) + 'px';
    element.style.left = (element.offsetLeft - pos1) + 'px';
  }
  
  function closeDragElement() {
    // Remove event listeners
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
    
    // Reset cursor
    element.style.cursor = 'grab';
    isDragging = false;
    
    // Animate back to original position
    if (Math.abs(parseInt(element.style.top || '0')) > 100 || 
        Math.abs(parseInt(element.style.left || '0')) > 100) {
      // If dragged too far, animate back with a bounce
      element.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      element.style.top = '0px';
      element.style.left = '0px';
      
      setTimeout(() => {
        element.style.transition = '';
      }, 500);
    }
  }
}

/**
 * Add shake effects to elements
 */
function initShakeEffects() {
  // Add shake class to body for global shake effect
  document.body.classList.add('can-shake');
  
  // Add shake effect to bookmark cards on double click
  document.querySelectorAll('.bookmark-card').forEach(card => {
    card.addEventListener('dblclick', () => {
      card.classList.add('shake');
      setTimeout(() => {
        card.classList.remove('shake');
      }, 500);
      
      // Copy URL to clipboard
      const url = card.querySelector('a')?.href;
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          // Show copied notification
          const notification = document.createElement('div');
          notification.className = 'copy-notification';
          notification.textContent = 'URL copied!';
          notification.style.position = 'fixed';
          notification.style.bottom = '20px';
          notification.style.right = '20px';
          notification.style.padding = '10px 20px';
          notification.style.backgroundColor = 'var(--accent, #2A2F4F)';
          notification.style.color = 'white';
          notification.style.borderRadius = '5px';
          notification.style.zIndex = '9999';
          notification.style.opacity = '0';
          notification.style.transform = 'translateY(20px)';
          notification.style.transition = 'all 0.3s ease';
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
          }, 10);
          
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }, 2000);
          
          // Play sound
          playSound('pop');
        });
      }
    });
  });
}

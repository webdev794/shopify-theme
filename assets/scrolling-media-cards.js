document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="scrolling-media-cards"]');
  
  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    
    const track = section.querySelector('.scrolling-media-cards__track');
    const prevBtn = section.querySelector('.scrolling-media-cards__control--prev');
    const nextBtn = section.querySelector('.scrolling-media-cards__control--next');
    const autoplay = section.dataset.autoplay === 'true';
    const autoplaySpeed = parseInt(section.dataset.autoplaySpeed) || 4000;
    const pauseOnHover = section.dataset.pauseOnHover === 'true';
    
    let autoplayTimer = null;
    let isPaused = false;
    let currentScrollPosition = 0;
    let cardWidth = 280;
    let gap = 24;
    
    // Calculate card width dynamically
    function getCardWidth() {
      const card = section.querySelector('.scrolling-media-cards__card');
      if (card) {
        const rect = card.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(track);
        const gapValue = parseInt(computedStyle.gap) || 24;
        return rect.width + gapValue;
      }
      return 304; // Default: 280px + 24px gap
    }
    
    function updateDimensions() {
      cardWidth = getCardWidth();
    }
    
    // Scroll to specific position
    function scrollToPosition(position, animate = true) {
      if (!animate) {
        track.style.transition = 'none';
      } else {
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      }
      
      track.style.transform = `translateX(-${position}px)`;
      
      if (!animate) {
        // Force reflow
        track.offsetHeight;
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    }
    
    // Get current scroll position
    function getCurrentPosition() {
      const transform = track.style.transform;
      if (transform) {
        const match = transform.match(/translateX\(-([0-9.]+)px\)/);
        if (match) {
          return parseFloat(match[1]);
        }
      }
      return 0;
    }
    
    // Scroll next
    function scrollNext() {
      updateDimensions();
      const currentPos = getCurrentPosition();
      const maxScroll = track.scrollWidth / 2 - track.parentElement.clientWidth;
      
      let newPos = currentPos + cardWidth * 2; // Scroll 2 cards at a time
      
      // If we've reached the end, loop back to start
      if (newPos >= maxScroll) {
        newPos = 0;
      }
      
      scrollToPosition(newPos);
    }
    
    // Scroll previous
    function scrollPrev() {
      updateDimensions();
      const currentPos = getCurrentPosition();
      const maxScroll = track.scrollWidth / 2 - track.parentElement.clientWidth;
      
      let newPos = currentPos - cardWidth * 2; // Scroll 2 cards at a time
      
      // If we're at the start, go to end
      if (newPos < 0) {
        newPos = maxScroll;
      }
      
      scrollToPosition(newPos);
    }
    
    // Start autoplay
    function startAutoplay() {
      if (!autoplay || section.blocks.length <= 1) return;
      stopAutoplay();
      autoplayTimer = setInterval(function() {
        if (!isPaused) {
          scrollNext();
        }
      }, autoplaySpeed);
    }
    
    // Stop autoplay
    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    
    // Event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        stopAutoplay();
        scrollPrev();
        if (autoplay) startAutoplay();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        stopAutoplay();
        scrollNext();
        if (autoplay) startAutoplay();
      });
    }
    
    // Pause on hover
    if (pauseOnHover) {
      section.addEventListener('mouseenter', function() {
        isPaused = true;
        section.classList.add('scrolling-media-cards--paused');
      });
      
      section.addEventListener('mouseleave', function() {
        isPaused = false;
        section.classList.remove('scrolling-media-cards--paused');
      });
    }
    
    // Handle visibility change
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        isPaused = true;
      } else {
        isPaused = false;
      }
    });
    
    // Initialize
    updateDimensions();
    
    // Reset scroll position on load to avoid empty space
    const maxScroll = track.scrollWidth / 2 - track.parentElement.clientWidth;
    if (maxScroll > 0) {
      scrollToPosition(0, false);
    }
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        updateDimensions();
        const currentPos = getCurrentPosition();
        const newMaxScroll = track.scrollWidth / 2 - track.parentElement.clientWidth;
        if (currentPos > newMaxScroll) {
          scrollToPosition(0, false);
        }
      }, 250);
    });
    
    if (autoplay) startAutoplay();
    
    // Store instance for cleanup
    section._smcInstance = {
      stopAutoplay: stopAutoplay,
      startAutoplay: startAutoplay
    };
  });
});

// Shopify section events
document.addEventListener('shopify:section:unload', function(e) {
  const section = e.target;
  if (section && section._smcInstance) {
    section._smcInstance.stopAutoplay();
  }
});

document.addEventListener('shopify:section:load', function(e) {
  const section = e.target;
  if (section && section._smcInstance) {
    section._smcInstance.startAutoplay();
  }
});

// Initialize on Shopify section load
document.addEventListener('shopify:section:select', function(e) {
  const section = e.target;
  if (section && section._smcInstance) {
    section._smcInstance.stopAutoplay();
  }
});

document.addEventListener('shopify:section:deselect', function(e) {
  const section = e.target;
  if (section && section._smcInstance) {
    section._smcInstance.startAutoplay();
  }
});
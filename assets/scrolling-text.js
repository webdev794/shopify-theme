document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="scrolling-text"]');
  
  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    
    const track = section.querySelector('.scrolling-text__track');
    const pauseOnHover = section.dataset.pauseOnHover === 'true';
    
    if (pauseOnHover && track) {
      section.classList.add('scrolling-text--pause-on-hover');
    }
    
    // Ensure smooth animation on Safari
    if (track) {
      track.addEventListener('animationiteration', function() {
        // Reset transform to avoid jitter
        this.style.animationPlayState = 'paused';
        this.style.transform = 'translateX(0)';
        this.style.animationPlayState = 'running';
      });
    }
    
    // Handle visibility change - pause when tab not visible
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        track.style.animationPlayState = 'paused';
      } else {
        track.style.animationPlayState = 'running';
      }
    });
    
    // Pause on mouse enter (already handled by CSS if class is added)
    // But also handle with JS for extra reliability
    if (pauseOnHover) {
      section.addEventListener('mouseenter', function() {
        track.style.animationPlayState = 'paused';
      });
      
      section.addEventListener('mouseleave', function() {
        track.style.animationPlayState = 'running';
      });
    }
    
    // Debug: Log if animation is running
    console.log('Scrolling text initialized:', {
      items: track ? track.children.length : 0,
      pauseOnHover: pauseOnHover,
      speed: section.dataset.speed || '30s'
    });
  });
});

// Shopify section reload
document.addEventListener('shopify:section:unload', function(e) {
  const section = e.target;
  if (section && section._scrollingText) {
    clearTimeout(section._scrollingText.timer);
  }
});

document.addEventListener('shopify:section:load', function(e) {
  const section = e.target;
  const track = section.querySelector('.scrolling-text__track');
  if (track) {
    // Ensure animation restarts smoothly
    track.style.animationPlayState = 'running';
  }
});

/* Theme: scroll-velocity link for scrolling-text */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function bind(section) {
    if (section.dataset.scrollVelocity !== 'true') return;
    if (section._stVelocity) return;
    section._stVelocity = true;

    var track = section.querySelector('.scrolling-text__track');
    if (!track) return;

    var base = parseFloat(section.style.getPropertyValue('--scrolling-text-speed')) ||
               parseFloat(getComputedStyle(section).getPropertyValue('--scrolling-text-speed')) || 30;
    // Also try data attribute
    var baseDuration = parseFloat(section.dataset.baseSpeed) || base || 30;
    var velocity = 0;
    var lastY = window.scrollY;
    var lastT = performance.now();
    var current = baseDuration;

    window.addEventListener('scroll', function () {
      var now = performance.now();
      var y = window.scrollY;
      var dt = Math.max(now - lastT, 1);
      velocity = velocity * 0.7 + (Math.abs(y - lastY) / dt) * 0.3;
      lastY = y;
      lastT = now;
    }, { passive: true });

    function tick() {
      velocity *= 0.92;
      var boost = 1 - Math.min(velocity * 8, 0.65);
      var target = baseDuration * Math.max(0.35, Math.min(1.4, boost));
      current += (target - current) * 0.12;
      track.style.animationDuration = current.toFixed(2) + 's';
      requestAnimationFrame(tick);
    }
    tick();
  }

  function init(scope) {
    (scope || document).querySelectorAll('[data-section-type="scrolling-text"]').forEach(bind);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else init();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
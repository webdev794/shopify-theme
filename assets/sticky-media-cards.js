document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="sticky-media-cards"]');
  
  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    
    // Video controls
    const videoWrappers = section.querySelectorAll('.sticky-media-cards__video-wrapper');
    
    videoWrappers.forEach(function(wrapper) {
      const video = wrapper.querySelector('.sticky-media-cards__video');
      const control = wrapper.querySelector('.sticky-media-cards__video-control');
      
      if (!video || !control) return;
      
      // Auto-play with sound off
      video.muted = true;
      video.play().catch(function() {});
      
      control.addEventListener('click', function(e) {
        e.preventDefault();
        if (video.paused) {
          video.play();
          control.classList.remove('is-playing');
        } else {
          video.pause();
          control.classList.add('is-playing');
        }
      });
      
      // Update control icon on play/pause
      video.addEventListener('play', function() {
        control.classList.remove('is-playing');
      });
      
      video.addEventListener('pause', function() {
        control.classList.add('is-playing');
      });
    });
    
    // Intersection Observer for scroll animations
    if ('IntersectionObserver' in window) {
      const cards = section.querySelectorAll('.sticky-media-cards__card-inner');
      
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
          }
        });
      }, {
        threshold: 0.3
      });
      
      cards.forEach(function(card) {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
      });
    }
  });
});

/* Suvara: progressive storytelling + active card highlight */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initSection(section) {
    if (!section || section._smcStory) return;
    section._smcStory = true;
    var cards = section.querySelectorAll('.sticky-media-cards__section');
    if (!cards.length) return;

    var progress = document.createElement('div');
    progress.className = 'sticky-media-cards__progress';
    progress.innerHTML = '<div class="sticky-media-cards__progress-bar"></div>';
    section.appendChild(progress);
    var bar = progress.querySelector('.sticky-media-cards__progress-bar');

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cards.forEach(function (c) {
              c.classList.remove('is-active-story');
            });
            entry.target.classList.add('is-active-story');
          }
        });
      },
      { threshold: 0.45, rootMargin: '-10% 0px -25% 0px' }
    );
    cards.forEach(function (c) {
      io.observe(c);
    });

    function onScroll() {
      var rect = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      if (total <= 0) {
        bar.style.width = '100%';
        return;
      }
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var pct = (scrolled / total) * 100;
      bar.style.width = pct.toFixed(1) + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function init(scope) {
    (scope || document)
      .querySelectorAll('[data-section-type="sticky-media-cards"]')
      .forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else init();
  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });
})();
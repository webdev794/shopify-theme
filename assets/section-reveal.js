(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FAILSAFE_MS = 3000;
  var CLEAR_MS = 900;

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.getAttribute('data-section-reveal') === 'false') return true;
    if (el.closest('.shopify-section-group-header-group')) return true;
    if (el.closest('.shopify-section-group-footer-group')) return true;
    var id = el.id || '';
    if (id === 'shopify-section-header' || id === 'shopify-section-footer') return true;
    // Sticky scroll-zoom sections manage their own motion
    if (el.querySelector('[data-scroll-zoom]')) return true;
    return false;
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    // Only treat as "already visible" when the section top is well into
    // the upper half of the screen — otherwise keep entrance animation.
    return rect.top < window.innerHeight * 0.45 && rect.bottom > 0;
  }

  function reveal(el) {
    if (!el) return;
    el.classList.add('is-visible');
    // Drop animation classes after the transition so no transform remains
    window.setTimeout(function () {
      el.classList.remove('section-reveal', 'is-visible');
    }, CLEAR_MS);
  }

  function init() {
    var sections = document.querySelectorAll('.shopify-section');
    if (!sections.length) return;

    if (REDUCED_MOTION) {
      sections.forEach(function (section) {
        section.classList.remove('section-reveal', 'is-visible');
      });
      return;
    }

    var toObserve = [];

    sections.forEach(function (section) {
      if (shouldSkip(section)) {
        section.classList.remove('section-reveal', 'is-visible');
        return;
      }

      // Already on screen: leave fully visible (no flash)
      if (isInViewport(section)) {
        section.classList.remove('section-reveal', 'is-visible');
        return;
      }

      section.classList.add('section-reveal');
      section.classList.remove('is-visible');
      toObserve.push(section);
    });

    if (!toObserve.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        // Trigger a bit before the section is fully in view
        rootMargin: '0px 0px -4% 0px',
        threshold: 0.05
      }
    );

    toObserve.forEach(function (section) {
      observer.observe(section);
    });

    // Failsafe: only force-reveal sections that are ON SCREEN but still
    // stuck hidden. Do NOT reveal below-the-fold sections early — that
    // would remove the entrance animation before the user scrolls to them.
    window.setTimeout(function () {
      document.querySelectorAll('.shopify-section.section-reveal:not(.is-visible)').forEach(function (el) {
        if (!isInViewport(el)) return;
        reveal(el);
        try {
          observer.unobserve(el);
        } catch (e) {}
      });
    }, FAILSAFE_MS);
  }

  function scheduleInit() {
    if (window.requestIdleCallback) {
      requestIdleCallback(function () { init(); }, { timeout: 1200 });
    } else {
      setTimeout(init, 1);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  document.addEventListener('shopify:section:load', function () {
    setTimeout(init, 50);
  });
})();
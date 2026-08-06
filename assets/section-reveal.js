/**
 * Global section scroll-reveal
 * Full motion: fade + move in from bottom-right when scrolled into view.
 * Safety: never leaves sections stuck invisible; clears classes after motion
 * so transforms do not keep covering the header mega menu.
 */
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FAILSAFE_MS = 3000;
  var CLEAR_MS = 800;

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.getAttribute('data-section-reveal') === 'false') return true;
    if (el.closest('.shopify-section-group-header-group')) return true;
    if (el.closest('.shopify-section-group-footer-group')) return true;
    var id = el.id || '';
    if (id === 'shopify-section-header' || id === 'shopify-section-footer') return true;
    return false;
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
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
        rootMargin: '0px 0px -6% 0px',
        threshold: 0.08
      }
    );

    toObserve.forEach(function (section) {
      observer.observe(section);
    });

    // Failsafe only — does not change the normal animation path
    window.setTimeout(function () {
      document.querySelectorAll('.shopify-section.section-reveal:not(.is-visible)').forEach(function (el) {
        reveal(el);
        try {
          observer.unobserve(el);
        } catch (e) {}
      });
    }, FAILSAFE_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function () {
    setTimeout(init, 50);
  });
})();

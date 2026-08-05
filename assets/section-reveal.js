/**
 * Global section scroll-reveal
 * Uses IntersectionObserver so every .shopify-section animates in
 * from the bottom-right when it enters the viewport while scrolling.
 *
 * Opt out: add data-section-reveal="false" on a section root, or it is
 * skipped automatically for header/footer groups.
 */
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    return rect.top < window.innerHeight * 0.95 && rect.bottom > 40;
  }

  function init() {
    var sections = document.querySelectorAll('.shopify-section');
    if (!sections.length) return;

    if (REDUCED_MOTION) {
      sections.forEach(function (section) {
        section.classList.add('section-reveal', 'is-visible');
      });
      return;
    }

    var toObserve = [];

    sections.forEach(function (section) {
      if (shouldSkip(section)) {
        section.classList.add('section-reveal', 'is-visible');
        return;
      }

      // Already on screen: leave visible, no hide/show flash
      if (isInViewport(section)) {
        section.classList.add('section-reveal', 'is-visible');
        return;
      }

      // Below the fold: start hidden, observe for entry
      section.classList.add('section-reveal');
      toObserve.push(section);
    });

    if (!toObserve.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
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

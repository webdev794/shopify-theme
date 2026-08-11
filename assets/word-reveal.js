/**
 * Suvara word-stagger reveal (signature typography motion)
 * Splits section heading / subheading text into words and animates
 * them rising from below with a staggered delay on scroll.
 *
 * Refined easing + slightly longer stagger for a more editorial feel.
 * Targets common section header patterns only — not product cards,
 * article titles inside grids, footer, or already-animated blocks.
 */
(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER_STEP = 1; // CSS --stagger units; delay is calc(n * 60ms)
  var CLEAR_MS = 1000;
  var FAILSAFE_MS = 3500;

  // Section-level titles only. Avoid product/card titles and nested content.
  var TARGET_SELECTORS = [
    // Explicit header wrappers
    '[class$="__header"] > [class*="__heading"]',
    '[class$="__header"] > [class*="__subheading"]',
    '[class$="__header"] > [class*="__description"]',
    '[class$="__header"] > [class*="__title"]',
    // Common section heading patterns (direct section content)
    '.shopify-section > * > [class*="__heading"]:not([class*="card"]):not([class*="product"]):not([class*="item"])',
    '.shopify-section > * > [class*="__subheading"]:not([class*="card"]):not([class*="product"])',
    '.shopify-section > * > * > [class*="__heading"]:not([class*="card"]):not([class*="product"]):not([class*="item"])',
    '.shopify-section > * > * > [class*="__subheading"]:not([class*="card"]):not([class*="product"])',
    // Named sections with slightly different structure
    '.shop-the-kit__heading',
    '.shop-the-kit__subheading',
    '.featured-products__heading',
    '.featured-products__subheading',
    '.featured-products__description',
    '.mix-match-pack__heading',
    '.mix-match-pack__subheading',
    '.blog-posts__heading',
    '.blog-posts__subheading',
    '.testimonials__heading',
    '.testimonials__subheading',
    '.text-with-icons__heading',
    '.text-with-icons__subheading',
    '.trending-products__heading',
    '.trending-products__subheading',
    '.scrolling-media-cards__heading',
    '.scrolling-media-cards__subheading',
    '.sticky-media-cards__heading',
    '.sticky-media-cards__subheading',
    '.social-media-gallery__heading',
    '.social-media-gallery__subheading',
    '.slideshow-with-marquee__heading',
    '.slideshow-with-marquee__subheading',
    '.media-with-text-overlay__heading',
    '.media-with-text-overlay__preheading',
    '.media-grid__heading',
    '.scrollable-collection__heading',
    '.scrollable-collection__subheading',
    '.lookbook__heading',
    '.lookbook__subheading',
    '.newsletter__heading',
    '.newsletter__subheading',
    '.pairing-products__heading',
    '.pairing-products__subheading',
    '.featured-collections-tabs__heading',
    '.featured-collections-tabs__subheading',
    '.hero__heading',
    '.hero__subheading',
    '.hero-carousel__heading',
    '.hero-carousel__subheading',
    '.burst-effects__title'
  ].join(',');

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.classList.contains('word-reveal')) return true; // already processed
    if (el.closest('[data-word-reveal="false"]')) return true;
    if (el.closest('.hlt')) return true; // highlight-text-with-images has its own motion
    if (el.closest('.shopify-section-group-header-group')) return true;
    if (el.closest('.shopify-section-group-footer-group')) return true;
    if (el.closest('.product-card, .card, .cart-item, .blog-card, .article__comments')) return true;
    // Skip if element has complex nested HTML (RTE, links, images) — only plain text
    if (el.querySelector('img, svg, video, iframe, a, button, input, .hlt__word, .word-reveal__word')) return true;
    var text = (el.textContent || '').trim();
    if (!text || text.length < 2) return true;
    return false;
  }

  function splitIntoWords(el) {
    var raw = el.textContent || '';
    // Normalize whitespace; keep original words
    var words = raw.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;

    // Preserve heading semantics: keep the same tag, replace contents
    el.classList.add('word-reveal');
    el.setAttribute('aria-label', raw.trim());

    var line = document.createElement('span');
    line.className = 'word-reveal__line';
    line.setAttribute('aria-hidden', 'true');

    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'word-reveal__word';
      span.style.setProperty('--stagger', String(i * STAGGER_STEP));
      span.textContent = word;
      line.appendChild(span);
    });

    el.textContent = '';
    el.appendChild(line);
    return true;
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
  }

  function reveal(el) {
    el.classList.add('is-visible');
    window.setTimeout(function () {
      el.classList.add('is-done');
    }, CLEAR_MS);
  }

  function collectTargets() {
    var nodes = document.querySelectorAll(TARGET_SELECTORS);
    var list = [];
    var seen = new Set();

    nodes.forEach(function (el) {
      if (seen.has(el) || shouldSkip(el)) return;
      seen.add(el);
      list.push(el);
    });

    return list;
  }

  function init() {
    if (REDUCED_MOTION) return;

    var targets = collectTargets();
    if (!targets.length) return;

    var toObserve = [];

    targets.forEach(function (el) {
      if (!splitIntoWords(el)) return;

      if (isInViewport(el)) {
        // Already on screen — show immediately (no flash of hidden words)
        el.classList.add('is-visible', 'is-done');
        return;
      }

      toObserve.push(el);
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
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.15
      }
    );

    toObserve.forEach(function (el) {
      observer.observe(el);
    });

    // Failsafe for elements already near viewport but missed by observer
    window.setTimeout(function () {
      toObserve.forEach(function (el) {
        if (el.classList.contains('is-visible')) return;
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
      requestIdleCallback(function () {
        init();
      }, { timeout: 1500 });
    } else {
      setTimeout(init, 40);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  // Theme editor: re-run when a section is reloaded
  document.addEventListener('shopify:section:load', function () {
    setTimeout(init, 80);
  });
})();
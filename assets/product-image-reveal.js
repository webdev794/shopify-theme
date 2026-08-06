/**
 * Luxury product image reveal — card/product media only.
 * Does not target titles, prices, vendors, or text blocks.
 * Above-the-fold media: untouched. Below-the-fold: animate once on scroll in.
 *
 * Safety: failsafe clears any stuck opacity:0; classes removed after motion.
 * Once an element has been prepared/revealed, it is never re-hidden.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SELECTORS = [
    '.product-card__image-wrapper',
    '.card__media',
    '.trending-products__image-wrapper',
    '.scrollable-collection__product-image-wrapper',
    '.shop-the-kit__product-image-wrapper',
    '.pairing-products__main-image-wrapper',
    '.pairing-products__item-image',
    '.sticky-media-cards__image-wrapper',
    '.lookbook__image-wrapper',
    '.product__media-item',
    '.product__media',
    '.complementary-products__image-wrapper',
    '[data-product-image]'
  ].join(',');

  var prepared = new WeakSet();
  var revealed = new WeakSet();
  var FAILSAFE_MS = 3000;
  var CLEAR_MS = 700;

  function isAboveOrInView(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function show(el) {
    if (revealed.has(el)) return;
    revealed.add(el);
    el.classList.add('pir-visible');
    window.setTimeout(function () {
      el.classList.remove('pir-prepare', 'pir-visible');
    }, CLEAR_MS);
  }

  function init() {
    var nodes = document.querySelectorAll(SELECTORS);
    if (!nodes.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15
      }
    );

    nodes.forEach(function (el) {
      if (prepared.has(el) || revealed.has(el)) return;
      if (el.closest('.shopify-section-group-header-group')) return;
      if (el.closest('.shopify-section-group-footer-group')) return;

      prepared.add(el);

      if (isAboveOrInView(el)) return;

      el.classList.add('pir-prepare');
      observer.observe(el);
    });

    // Failsafe only — normal path is still the IntersectionObserver animation
    window.setTimeout(function () {
      document.querySelectorAll('.pir-prepare:not(.pir-visible)').forEach(function (el) {
        show(el);
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

  // Re-scan when the DOM grows (e.g. infinite scroll / section AJAX),
  // but never re-hide something already revealed.
  if (typeof MutationObserver !== 'undefined') {
    var scheduled = false;
    var mo = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        init();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();


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
  var FAILSAFE_MS = 4000;
  var CLEAR_MS = 700;
  var started = false;

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
    if (started) return;
    started = true;

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
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12
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

    window.setTimeout(function () {
      document.querySelectorAll('.pir-prepare:not(.pir-visible)').forEach(function (el) {
        if (!isAboveOrInView(el)) return;
        show(el);
        try { observer.unobserve(el); } catch (e) {}
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
    started = false;
    setTimeout(init, 100);
  });
})();

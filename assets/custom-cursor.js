/**
 * Suvara custom cursor — interactive states
 * - Site-wide rose cursor (via CSS snippet)
 * - Grows / softens on interactive elements (links, buttons, cards)
 * - "Explore" state over media / lookbook / product images
 * - Optional soft trail on product & collection pages
 * - Fully disabled on touch / reduced-motion
 */
(() => {
  'use strict';

  if (document.querySelector('meta[name="custom-cursor-init"]')) return;

  const meta = document.createElement('meta');
  meta.name = 'custom-cursor-init';
  meta.content = 'true';
  document.head.appendChild(meta);

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (REDUCED || !FINE) return;

  const body = document.body;

  // --- Interactive state classes on <body> ---
  // .cursor-hover   → links, buttons, cards
  // .cursor-media   → images, video, lookbook hotspots, media grids
  // .cursor-drag    → carousels / comparison handles (optional)

  const HOVER_SELECTOR = [
    'a',
    'button',
    '[role="button"]',
    'input[type="submit"]',
    'input[type="button"]',
    '.product-card',
    '.card',
    '.card-wrapper',
    '.collection-card',
    '.product-form__submit',
    '.add-to-cart',
    '.shopify-payment-button__button',
    '[data-cursor-hover]'
  ].join(',');

  const MEDIA_SELECTOR = [
    '.lookbook__image-wrapper',
    '.lookbook [data-hotspot]',
    '.hero__media',
    '.hero__image',
    '.hero-carousel__media',
    '.media-grid__item',
    '.sticky-media-cards__image',
    '.scrolling-media-cards__image',
    '.image-comparison',
    '.product__media',
    '.card__media',
    '[data-cursor-media]'
  ].join(',');

  let hoverDepth = 0;
  let mediaDepth = 0;

  function syncClasses() {
    body.classList.toggle('cursor-hover', hoverDepth > 0);
    body.classList.toggle('cursor-media', mediaDepth > 0 && hoverDepth === 0);
  }

  function onEnterHover() {
    hoverDepth++;
    syncClasses();
  }
  function onLeaveHover() {
    hoverDepth = Math.max(0, hoverDepth - 1);
    syncClasses();
  }
  function onEnterMedia() {
    mediaDepth++;
    syncClasses();
  }
  function onLeaveMedia() {
    mediaDepth = Math.max(0, mediaDepth - 1);
    syncClasses();
  }

  function bindDelegated() {
    // Use pointer events on document for dynamic content (theme editor, AJAX)
    document.addEventListener('pointerover', function (e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest(HOVER_SELECTOR)) onEnterHover();
      else if (t.closest(MEDIA_SELECTOR)) onEnterMedia();
    }, true);

    document.addEventListener('pointerout', function (e) {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest(HOVER_SELECTOR)) onLeaveHover();
      else if (t.closest(MEDIA_SELECTOR)) onLeaveMedia();
    }, true);
  }

  // --- Page-type helpers (product / collection trail) ---
  const isProductOrCollectionPage = () => {
    const path = window.location.pathname;
    if (path.includes('/products/') || path.includes('/collections/') || path.includes('/search')) {
      return true;
    }
    return (
      document.querySelector('.product') !== null ||
      document.querySelector('.collection') !== null ||
      document.querySelector('.product-form') !== null
    );
  };

  const updatePageClass = () => {
    body.classList.remove('template-product', 'template-collection', 'template-search', 'product-page', 'collection-page');
    if (isProductOrCollectionPage()) {
      body.classList.add('template-product', 'product-page');
    }
  };

  // --- Soft trail (product / collection only) ---
  function initTrail() {
    if (!isProductOrCollectionPage()) return;

    let trailThrottle = false;
    const trailElements = [];

    document.addEventListener('mousemove', (e) => {
      if (trailThrottle) return;
      trailThrottle = true;

      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,107,157,0.7), rgba(204,51,102,0.2));
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        z-index: 9999;
        opacity: 0.55;
        transform: translate(-50%, -50%) scale(1);
        transition: opacity 0.45s ease, transform 0.45s ease;
      `;
      document.body.appendChild(trail);
      trailElements.push(trail);

      requestAnimationFrame(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'translate(-50%, -50%) scale(0.4)';
      });

      setTimeout(() => {
        if (trail.parentNode) trail.parentNode.removeChild(trail);
        const idx = trailElements.indexOf(trail);
        if (idx > -1) trailElements.splice(idx, 1);
      }, 480);

      setTimeout(() => {
        trailThrottle = false;
      }, 55);
    }, { passive: true });

    // Cap residual nodes
    setInterval(() => {
      if (trailElements.length > 24) {
        const toRemove = trailElements.splice(0, 12);
        toRemove.forEach((el) => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      }
    }, 8000);
  }

  // --- Boot ---
  const boot = () => {
    updatePageClass();
    bindDelegated();
    initTrail();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', updatePageClass);
  document.addEventListener('shopify:section:reload', updatePageClass);
  window.addEventListener('popstate', updatePageClass);
})();
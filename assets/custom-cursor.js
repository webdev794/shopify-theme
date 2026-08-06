// ========== CUSTOM CURSOR JAVASCRIPT ==========
// Handles dynamic cursor switching based on page context

(() => {
  'use strict';

  // Check if cursor is already initialized
  if (document.querySelector('meta[name="custom-cursor-init"]')) return;
  
  const meta = document.createElement('meta');
  meta.name = 'custom-cursor-init';
  meta.content = 'true';
  document.head.appendChild(meta);

  // Function to check if we're on a product or collection page
  const isProductOrCollectionPage = () => {
    // Check URL patterns
    const path = window.location.pathname;
    if (path.includes('/products/')) return true;
    if (path.includes('/collections/')) return true;
    if (path.includes('/search')) return true;
    
    // Check for product/collection elements
    const hasProductElements = document.querySelector('.product') !== null;
    const hasCollectionElements = document.querySelector('.collection') !== null;
    const hasProductForm = document.querySelector('.product-form') !== null;
    
    return hasProductElements || hasCollectionElements || hasProductForm;
  };

  // Function to switch cursor based on page type
  const updateCursor = () => {
    const body = document.body;
    
    // Remove existing page-type classes
    body.classList.remove('template-product', 'template-collection', 'template-search', 'product-page', 'collection-page');
    
    if (isProductOrCollectionPage()) {
      // Add classes for product/collection pages
      body.classList.add('template-product', 'product-page');
    }
  };

  // Update cursor on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCursor);
  } else {
    updateCursor();
  }

  // Update cursor when Shopify sections are loaded/reloaded
  document.addEventListener('shopify:section:load', updateCursor);
  document.addEventListener('shopify:section:reload', updateCursor);

  // History / SPA navigation only — avoid a full-tree MutationObserver
  window.addEventListener('popstate', updateCursor);

  // Optional: Add subtle cursor trail effect for product pages
  if (isProductOrCollectionPage()) {
    let trailElements = [];
    let trailTimeout = null;
    
    const createTrail = (x, y) => {
      // Only create trail on product pages
      if (!isProductOrCollectionPage()) return;
      
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: radial-gradient(circle, #ff6b9d, #cc3366);
        left: ${x}px;
        top: ${y}px;
        z-index: 9999;
        opacity: 0.6;
        transform: translate(-50%, -50%);
        transition: opacity 0.4s ease, transform 0.4s ease;
      `;
      document.body.appendChild(trail);
      
      trailElements.push(trail);
      
      // Remove trail after animation
      setTimeout(() => {
        trail.style.opacity = '0';
        trail.style.transform = 'translate(-50%, -50%) scale(0.5)';
        setTimeout(() => {
          if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
          }
        }, 400);
      }, 600);
    };

    // Add trail on mousemove (throttled)
    let trailThrottle = false;
    document.addEventListener('mousemove', (e) => {
      if (trailThrottle) return;
      trailThrottle = true;
      
      createTrail(e.clientX, e.clientY);
      
      setTimeout(() => {
        trailThrottle = false;
      }, 60);
    });

    // Clean up trails periodically
    setInterval(() => {
      if (trailElements.length > 30) {
        const toRemove = trailElements.splice(0, 15);
        toRemove.forEach(el => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      }
    }, 10000);
  }
})();
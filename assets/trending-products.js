/* trending-products.js */
(function () {
  'use strict';

  const MONEY_FORMAT = (window.Shopify && window.Shopify.money_format) || '${{amount}}';

  function formatMoney(cents) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    const value = (parseInt(cents, 10) / 100).toFixed(2);
    return MONEY_FORMAT
      .replace(/\{\{\s*amount\s*\}\}/, value)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(value))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','));
  }

  function ensureModal() {
    let overlay = document.getElementById('tp-quick-view-modal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'tp-quick-view-modal';
    overlay.className = 'tp-qv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Quick view');
    overlay.innerHTML = `
      <div class="tp-qv-modal">
        <button type="button" class="tp-qv-close" aria-label="Close">&times;</button>
        <div class="tp-qv-body">
          <div class="tp-qv-loading">Loading product…</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.tp-qv-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    return overlay;
  }

  function openModal() {
    const overlay = ensureModal();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('tp-quick-view-modal');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function showLoading() {
    const body = ensureModal().querySelector('.tp-qv-body');
    body.innerHTML = '<div class="tp-qv-loading">Loading product…</div>';
  }

  function showError(msg) {
    const body = ensureModal().querySelector('.tp-qv-body');
    body.innerHTML = `<div class="tp-qv-error">${msg || 'Unable to load product.'}</div>`;
  }

  function renderProduct(product) {
    const body = ensureModal().querySelector('.tp-qv-body');
    const image = product.featured_image || (product.images && product.images[0]) || '';
    const variant = (product.variants && product.variants.find(v => v.available)) || (product.variants && product.variants[0]);
    const price = variant ? variant.price : product.price;
    const compare = variant ? variant.compare_at_price : product.compare_at_price;
    const available = product.available && variant && variant.available;

    let priceHtml = `<span class="tp-qv-price--current">${formatMoney(price)}</span>`;
    if (compare && parseInt(compare, 10) > parseInt(price, 10)) {
      priceHtml = `<span class="tp-qv-price--compare">${formatMoney(compare)}</span>` + priceHtml;
    }

    const desc = (product.description || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);

    body.innerHTML = `
      <div class="tp-qv-media">
        ${image ? `<img src="${image}" alt="${(product.title || '').replace(/"/g, '&quot;')}" loading="lazy">` : ''}
      </div>
      <div class="tp-qv-details">
        ${product.vendor ? `<p class="tp-qv-vendor">${product.vendor}</p>` : ''}
        <h2 class="tp-qv-title">${product.title || ''}</h2>
        <div class="tp-qv-price">${priceHtml}</div>
        ${desc ? `<p class="tp-qv-description">${desc}${desc.length >= 280 ? '…' : ''}</p>` : ''}
        <div class="tp-qv-actions">
          <button type="button" class="tp-qv-add" data-variant-id="${variant ? variant.id : ''}" ${available ? '' : 'disabled'}>
            ${available ? 'Add to Cart' : 'Sold Out'}
          </button>
          <a href="${product.url || '#'}" class="tp-qv-view-full">View Full Details</a>
        </div>
      </div>
    `;

    const addBtn = body.querySelector('.tp-qv-add');
    if (addBtn && available) {
      addBtn.addEventListener('click', function () {
        const vid = this.dataset.variantId;
        if (!vid) return;
        this.disabled = true;
        this.textContent = 'Adding…';
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: vid, quantity: 1 })
        })
          .then(r => r.json())
          .then(() => {
            this.textContent = 'Added ✓';
            this.style.background = 'var(--color-success, #2ecc71)';
            setTimeout(() => {
              this.textContent = 'Add to Cart';
              this.style.background = '';
              this.disabled = false;
            }, 1800);
          })
          .catch(() => {
            this.textContent = 'Error';
            this.disabled = false;
            setTimeout(() => { this.textContent = 'Add to Cart'; }, 1500);
          });
      });
    }
  }

  function openQuickView(handle) {
    if (!handle) return;
    openModal();
    showLoading();
    fetch(`/products/${handle}.js`)
      .then(r => {
        if (!r.ok) throw new Error('Product not found');
        return r.json();
      })
      .then(product => renderProduct(product))
      .catch(() => showError('Sorry, we could not load this product.'));
  }

  /* ----- Fast button swap on card hover ----- */
  function setupCardSwap(card) {
    const actions = card.querySelector('.trending-products__actions');
    if (!actions) return;

    const atc = actions.querySelector('.trending-products__add-to-cart, .trending-products__sold-out');
    const qv = actions.querySelector('.trending-products__quick-view');
    if (!atc || !qv) return;

    const gap = 10;

    function applySwap() {
      const atcW = atc.offsetWidth;
      const qvW = qv.offsetWidth;
      // Eye slides left (in front), Add to Cart slides right
      atc.style.transform = `translateX(${qvW + gap}px)`;
      qv.style.transform = `translateX(-${atcW + gap}px)`;
      card.classList.add('is-swapped');
    }

    function resetSwap() {
      atc.style.transform = '';
      qv.style.transform = '';
      card.classList.remove('is-swapped');
    }

    card.addEventListener('mouseenter', applySwap);
    card.addEventListener('mouseleave', resetSwap);

    window.addEventListener('resize', function () {
      if (card.classList.contains('is-swapped')) applySwap();
    });
  }

  /* ----- Init ----- */
  function initSection(section) {
    if (section.dataset.initialized === 'true') return;
    section.dataset.initialized = 'true';

    section.querySelectorAll('.trending-products__add-to-cart').forEach(btn => {
      btn.addEventListener('click', function () {
        const variantId = this.dataset.variantId;
        if (!variantId) return;

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        })
          .then(r => r.json())
          .then(() => {
            this.textContent = 'Added ✓';
            this.style.background = 'var(--color-success, #2ecc71)';
            setTimeout(() => {
              this.textContent = 'Add to Cart';
              this.style.background = '';
            }, 2000);
          })
          .catch(err => console.error('Error adding to cart:', err));
      });
    });

    section.querySelectorAll('.trending-products__quick-view').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(this.dataset.productHandle);
      });
    });

    section.querySelectorAll('.trending-products__card').forEach(setupCardSwap);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-section-type="trending-products"]').forEach(initSection);
  });

  document.addEventListener('shopify:section:load', function (e) {
    const section = e.target.querySelector('[data-section-type="trending-products"]') || e.target;
    if (section && section.matches('[data-section-type="trending-products"]')) {
      section.dataset.initialized = '';
      initSection(section);
    }
  });
})();
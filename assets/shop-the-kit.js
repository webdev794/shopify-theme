document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="shop-the-kit"]');
  
  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    
    const addToCartBtn = section.querySelector('.shop-the-kit__add-to-cart');
    const variantSelectors = section.querySelectorAll('.shop-the-kit__variant-selector');
    const totalPriceElement = section.querySelector('.shop-the-kit__total-amount');
    const products = section.querySelectorAll('.shop-the-kit__product');
    
    let selectedVariants = {};
    let originalPrices = {};
    
    // Store original prices
    products.forEach(function(product) {
      const productId = product.dataset.productId;
      const selector = product.querySelector('.shop-the-kit__variant-selector');
      const priceDisplay = product.querySelector('.shop-the-kit__product-price-current');
      
      if (selector) {
        // Get first variant price
        const firstOption = selector.querySelector('option');
        if (firstOption) {
          const priceMatch = firstOption.dataset.price;
          if (priceMatch) {
            originalPrices[productId] = priceMatch;
          }
        }
      } else if (priceDisplay) {
        // Store displayed price
        originalPrices[productId] = priceDisplay.textContent.trim();
      }
    });
    
    // Update total price function
    function updateTotalPrice() {
      let total = 0;
      let allSelected = true;
      
      products.forEach(function(product) {
        const productId = product.dataset.productId;
        const selector = product.querySelector('.shop-the-kit__variant-selector');
        const priceDisplay = product.querySelector('.shop-the-kit__product-price-current');
        
        if (selector) {
          const selectedOption = selector.options[selector.selectedIndex];
          if (selectedOption) {
            // Get price from data attribute or parse from option text
            let priceString = selectedOption.dataset.price;
            if (!priceString) {
              // Fallback: extract from text content
              const optionText = selectedOption.textContent.trim();
              const priceMatch = optionText.match(/\$\d+\.?\d*/);
              if (priceMatch) {
                priceString = priceMatch[0];
              }
            }
            
            if (priceString) {
              // Convert string to number (remove currency symbols)
              const numericPrice = parseFloat(priceString.replace(/[^0-9.]/g, ''));
              if (!isNaN(numericPrice)) {
                total += numericPrice;
              }
            }
          }
        } else if (priceDisplay) {
          // Use displayed price
          const priceText = priceDisplay.textContent.trim();
          const numericPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
          if (!isNaN(numericPrice)) {
            total += numericPrice;
          }
        }
      });
      
      // Update total display
      if (totalPriceElement) {
        const currencySymbol = '$';
        const formattedTotal = currencySymbol + total.toFixed(2);
        totalPriceElement.textContent = formattedTotal;
      }
    }
    
    // Handle variant changes
    variantSelectors.forEach(function(selector) {
      selector.addEventListener('change', function(e) {
        const productContainer = this.closest('.shop-the-kit__product');
        const productId = productContainer.dataset.productId;
        const selectedOption = this.options[this.selectedIndex];
        
        // Update price display
        const priceDisplay = productContainer.querySelector('.shop-the-kit__product-price-current');
        if (priceDisplay && selectedOption.dataset.price) {
          priceDisplay.textContent = selectedOption.dataset.price;
        }
        
        // Store selected variant
        selectedVariants[productId] = {
          variantId: this.value,
          price: selectedOption.dataset.price || null
        };
        
        updateTotalPrice();
      });
      
      // Trigger initial change to set defaults
      selector.dispatchEvent(new Event('change'));
    });
    
    // Add to cart functionality
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', function() {
        const items = [];
        const missing = [];

        products.forEach(function(product, index) {
          const productId = product.dataset.productId;
          const titleEl = product.querySelector('.shop-the-kit__product-title');
          const title = titleEl ? titleEl.textContent.trim() : ('Product ' + (index + 1));
          const selector = product.querySelector('.shop-the-kit__variant-selector');
          let variantId = null;

          if (selector) {
            variantId = selector.value;
          } else {
            const variantInput = product.querySelector('[data-variant-id]');
            variantId = variantInput ? variantInput.getAttribute('data-variant-id') : null;
          }

          // Guard: empty / placeholder select values
          if (variantId && String(variantId).trim() !== '' && String(variantId) !== '0') {
            items.push({
              id: parseInt(variantId, 10),
              quantity: 1
            });
          } else {
            missing.push(title);
          }
        });

        if (missing.length || items.length === 0) {
          alert(
            missing.length
              ? 'Please select options for: ' + missing.join(', ')
              : 'Please select options for all products.'
          );
          return;
        }

        // Expected count must match product cards on the page
        if (items.length !== products.length) {
          console.warn('[shop-the-kit] item count mismatch', items.length, products.length);
          alert('Could not read all kit products. Please refresh and try again.');
          return;
        }

        const defaultLabel =
          addToCartBtn.getAttribute('data-default-label') ||
          addToCartBtn.textContent ||
          'Add Kit to Cart';
        addToCartBtn.setAttribute('data-default-label', defaultLabel);

        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Adding...';
        addToCartBtn.classList.add('loading');

        /*
         * ONE request for the whole kit.
         * Parallel /cart/add.js calls race each other and Shopify often
         * drops one line item (e.g. 4 products → only 3 in cart).
         * https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-add-js
         */
        fetch((window.Shopify && window.Shopify.routes && window.Shopify.routes.root
          ? window.Shopify.routes.root
          : '/') + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ items: items })
        })
          .then(function(response) {
            return response.json().then(function(data) {
              return { ok: response.ok, status: response.status, data: data };
            });
          })
          .then(function(result) {
            if (!result.ok) {
              var msg =
                (result.data && (result.data.description || result.data.message)) ||
                'Failed to add kit to cart';
              throw new Error(msg);
            }

            // Shopify returns { items: [...] } for multi-add
            var added = (result.data && result.data.items) ? result.data.items.length : items.length;
            if (added < items.length) {
              console.warn('[shop-the-kit] only some items added', added, 'of', items.length, result.data);
              throw new Error('Only ' + added + ' of ' + items.length + ' products were added. Please check availability and try again.');
            }

            addToCartBtn.textContent = 'Added! ✓';
            addToCartBtn.style.background = 'var(--color-success, #2ecc71)';

            // Refresh cart UI
            document.dispatchEvent(new CustomEvent('cart:updated', { detail: result.data }));
            if (window.theme && typeof window.theme.updateCartCount === 'function') {
              window.theme.updateCartCount();
            }
            // Header cart count (common pattern)
            fetch((window.Shopify && window.Shopify.routes && window.Shopify.routes.root
              ? window.Shopify.routes.root
              : '/') + 'cart.js')
              .then(function(r) { return r.json(); })
              .then(function(cart) {
                var countEls = document.querySelectorAll('[data-cart-count], .header__cart-count, .cart-count');
                countEls.forEach(function(el) {
                  el.textContent = String(cart.item_count || 0);
                  if (cart.item_count > 0) el.classList.remove('hidden', 'is-empty');
                });
              })
              .catch(function() {});

            if (window.theme && typeof window.theme.openCartDrawer === 'function') {
              window.theme.openCartDrawer();
            }

            setTimeout(function() {
              addToCartBtn.disabled = false;
              addToCartBtn.textContent = defaultLabel;
              addToCartBtn.style.background = '';
              addToCartBtn.classList.remove('loading');
            }, 2000);
          })
          .catch(function(error) {
            console.error('[shop-the-kit] add error:', error);
            alert(error.message || 'There was an error adding the kit to your cart. Please try again.');
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = defaultLabel;
            addToCartBtn.classList.remove('loading');
            addToCartBtn.style.background = '';
          });
      });
    }
  });
});

/* Theme: use shared Complete the Look batcher when available */
(function () {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-stk-add-kit], [data-complete-look-add]');
    if (!btn || !window.ThemeCompleteTheLook) return;
    // Existing handlers still run; this is a progressive enhancement hook
  }, true);
})();

/*
 * Scroll-linked circle reveal for the big kit image (same technique as
 * images-with-text-carousel.js). Progress is driven by how close the
 * image is to its sticky pin point, NOT viewport center — since
 * .shop-the-kit__media is `position: sticky`, once it pins its
 * getBoundingClientRect() stops changing, so a center-based trigger
 * would freeze wherever it happened to be. Using distance-from-pin
 * instead means the circle finishes expanding exactly as the image
 * settles into place, and reverses naturally on scroll-up.
 */
(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initMorph(target) {
    if (target.dataset.stkMorphInit) return;
    target.dataset.stkMorphInit = 'true';
    if (reducedMotion.matches) return;

    const media = target.closest('.shop-the-kit__media');
    let ticking = false;

    function computeProgress() {
      const rect = target.getBoundingClientRect();
      // Reads the CSS `top` value live, so this works whether the section
      // is in standard mode (top: 100px) or full-bleed mode (top: 0) —
      // and on mobile, where .shop-the-kit__media isn't sticky at all
      // (top: 0, position: relative), without any special-casing here.
      const pinTop = media ? parseFloat(getComputedStyle(media).top) || 0 : 0;
      const start = window.innerHeight * 0.75;
      const distance = rect.top - pinTop;
      const progress = (start - distance) / start;
      return Math.max(0, Math.min(1, progress));
    }

    function update() {
      ticking = false;
      target.style.setProperty('--stk-morph-progress', computeProgress().toFixed(3));
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    // Only let the CSS clip-path apply once JS has actually taken control —
    // avoids the image staying stuck as a small circle if JS fails to load.
    target.setAttribute('data-stk-morph-ready', 'true');
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    update();
  }

  function initAll(root) {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('[data-stk-morph]').forEach(initMorph);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const target = event.target;
    if (target && target.querySelectorAll) {
      target.querySelectorAll('[data-stk-morph]').forEach(function (el) {
        delete el.dataset.stkMorphInit;
        el.removeAttribute('data-stk-morph-ready');
      });
    }
    initAll(event.target);
  });
})();
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="mix-match-pack"]');

  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';

    const maxItems = parseInt(section.dataset.maxItems) || 4;
    const selectBtns = section.querySelectorAll('.mix-match-pack__select-product');
    const addPackBtn = section.querySelector('.mix-match-pack__add-pack');
    const totalPriceElement = section.querySelector('.mix-match-pack__total-price');
    const savingsElement = section.querySelector('.mix-match-pack__savings');
    const selectedCountElement = section.querySelector('.mix-match-pack__selected-count');
    const variantSelectors = section.querySelectorAll('.mix-match-pack__variant-selector');
    const progressFill = section.querySelector('.mix-match-pack__progress-fill');
    const tray = section.querySelector('.mix-match-pack__tray');
    const trayEmpty = section.querySelector('.mix-match-pack__tray-empty');

    // Order in which products were selected, so the tray reads left-to-right
    // in the order the person built their pack.
    let selectedProducts = [];
    let selectedVariants = {};
    let selectedMeta = {}; // { productId: { title, image } } for tray chips

    // Helper: Parse price from cents
    function parsePriceFromCents(priceString) {
      if (!priceString) return 0;
      let cleaned = priceString.replace(/[^0-9]/g, '');
      let value = parseInt(cleaned, 10);
      if (isNaN(value)) return 0;
      return value / 100;
    }

    // Helper: Format price
    function formatPrice(amount) {
      return '$' + amount.toFixed(2);
    }

    // Initialize selected variants with prices (not yet selected, just cached)
    variantSelectors.forEach(function(selector) {
      const productId = selector.dataset.productId;
      const selectedOption = selector.options[selector.selectedIndex];
      const priceText = selectedOption ? selectedOption.dataset.price || '0' : '0';

      selectedVariants[productId] = {
        variantId: selectedOption ? selectedOption.value : '',
        price: parsePriceFromCents(priceText)
      };
    });

    // Update variant selection
    variantSelectors.forEach(function(selector) {
      selector.addEventListener('change', function() {
        const productId = this.dataset.productId;
        const selectedOption = this.options[this.selectedIndex];
        const productCard = this.closest('.mix-match-pack__product-card');
        const selectBtn = productCard ? productCard.querySelector('.mix-match-pack__select-product') : null;

        if (selectedOption) {
          const priceText = selectedOption.dataset.price || '0';
          const priceValue = parsePriceFromCents(priceText);

          selectedVariants[productId] = {
            variantId: selectedOption.value,
            price: priceValue
          };

          if (selectBtn) {
            selectBtn.dataset.variantId = selectedOption.value;
            selectBtn.dataset.price = priceText;
          }

          const priceCurrent = productCard ? productCard.querySelector('.mix-match-pack__product-price-current') : null;
          if (priceCurrent) {
            priceCurrent.textContent = formatPrice(priceValue);
          }

          if (selectedProducts.includes(productId)) {
            updateSummary();
          }
        }
      });
    });

    // Toggle a product's selected state. Shared by the card button and the
    // tray chip's remove control, so both stay in sync automatically.
    function toggleProduct(productId) {
      const btn = section.querySelector('.mix-match-pack__select-product[data-product-id="' + productId + '"]');
      if (btn) btn.click();
    }

    // Select/Deselect product
    selectBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const productId = this.dataset.productId;
        const productCard = this.closest('.mix-match-pack__product-card');
        const priceText = this.dataset.price || '0';
        const priceValue = parsePriceFromCents(priceText);

        if (this.classList.contains('selected')) {
          // Deselect
          this.classList.remove('selected');
          const label = this.querySelector('.mix-match-pack__select-product-label');
          if (label) label.textContent = section.dataset.selectLabel || 'Select';
          if (productCard) {
            productCard.classList.remove('mix-match-pack__product-card--selected');
          }

          const index = selectedProducts.indexOf(productId);
          if (index > -1) {
            selectedProducts.splice(index, 1);
          }
          delete selectedMeta[productId];
        } else {
          if (selectedProducts.length >= maxItems) {
            alert('You can select a maximum of ' + maxItems + ' items.');
            return;
          }

          // Select
          this.classList.add('selected');
          const label = this.querySelector('.mix-match-pack__select-product-label');
          if (label) label.textContent = 'Added ✓';
          if (productCard) {
            productCard.classList.add('mix-match-pack__product-card--selected');
          }

          if (!selectedVariants[productId]) {
            const variantSelector = productCard ? productCard.querySelector('.mix-match-pack__variant-selector') : null;
            if (variantSelector) {
              const selectedOption = variantSelector.options[variantSelector.selectedIndex];
              selectedVariants[productId] = {
                variantId: selectedOption ? selectedOption.value : '',
                price: parsePriceFromCents(selectedOption ? selectedOption.dataset.price : '0')
              };
            } else {
              selectedVariants[productId] = {
                variantId: this.dataset.variantId || '',
                price: priceValue
              };
            }
          }

          selectedMeta[productId] = {
            title: this.dataset.title || '',
            image: this.dataset.image || '',
            comparePrice: parsePriceFromCents(this.dataset.comparePrice || '0'),
            price: (selectedVariants[productId] && selectedVariants[productId].price) || priceValue
          };

          if (!selectedProducts.includes(productId)) {
            selectedProducts.push(productId);
          }
        }

        updateSummary();
      });
    });

    // Renders the tray chips, progress bar, total, savings, and button state
    // from the current selectedProducts array — the single source of truth.
    function updateSummary() {
      // Total + savings
      let total = 0;
      let compareTotal = 0;

      selectedProducts.forEach(function(productId) {
        const variantData = selectedVariants[productId];
        const meta = selectedMeta[productId];
        if (variantData && variantData.price) {
          total += variantData.price;
        }
        if (meta && meta.comparePrice > (variantData ? variantData.price : 0)) {
          compareTotal += meta.comparePrice;
        } else if (variantData) {
          compareTotal += variantData.price;
        }
      });

      if (totalPriceElement) {
        totalPriceElement.textContent = formatPrice(total);
      }

      if (savingsElement) {
        const savings = compareTotal - total;
        if (savings > 0.004) {
          savingsElement.textContent = 'You\u2019re saving ' + formatPrice(savings);
          savingsElement.hidden = false;
        } else {
          savingsElement.hidden = true;
        }
      }

      if (selectedCountElement) {
        selectedCountElement.textContent = selectedProducts.length;
      }

      if (progressFill) {
        const pct = Math.min(100, (selectedProducts.length / maxItems) * 100);
        progressFill.style.width = pct + '%';
      }

      if (addPackBtn) {
        addPackBtn.disabled = selectedProducts.length === 0;
      }

      renderTray();
    }

    function renderTray() {
      if (!tray) return;

      // Clear existing chips (keep the empty-state paragraph node around to reuse)
      const existingChips = tray.querySelectorAll('.mix-match-pack__chip');
      existingChips.forEach(function(chip) { chip.remove(); });

      if (selectedProducts.length === 0) {
        if (trayEmpty) trayEmpty.hidden = false;
        return;
      }

      if (trayEmpty) trayEmpty.hidden = true;

      selectedProducts.forEach(function(productId) {
        const meta = selectedMeta[productId] || {};
        const chip = document.createElement('div');
        chip.className = 'mix-match-pack__chip';
        chip.setAttribute('data-product-id', productId);

        const img = document.createElement('img');
        img.className = 'mix-match-pack__chip-image';
        img.src = meta.image || '';
        img.alt = meta.title || '';
        img.loading = 'lazy';
        chip.appendChild(img);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'mix-match-pack__chip-remove';
        remove.setAttribute('aria-label', 'Remove ' + (meta.title || 'item') + ' from pack');
        remove.textContent = '\u00d7';
        remove.addEventListener('click', function(e) {
          e.stopPropagation();
          toggleProduct(productId);
        });
        chip.appendChild(remove);

        tray.appendChild(chip);
      });
    }

    // Add pack to cart — single batched request so Shopify doesn't drop a
    // line item the way it can when several /cart/add.js calls race.
    if (addPackBtn) {
      addPackBtn.addEventListener('click', function() {
        if (selectedProducts.length === 0) return;

        const items = [];
        selectedProducts.forEach(function(productId) {
          const variantData = selectedVariants[productId];
          if (variantData && variantData.variantId) {
            items.push({
              id: parseInt(variantData.variantId, 10),
              quantity: 1
            });
          }
        });

        if (items.length === 0) {
          alert('Please select items for your pack.');
          return;
        }

        const defaultLabel = addPackBtn.getAttribute('data-default-label') || addPackBtn.textContent;
        addPackBtn.setAttribute('data-default-label', defaultLabel);

        addPackBtn.disabled = true;
        addPackBtn.textContent = 'Adding...';
        addPackBtn.classList.add('loading');

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
              const msg = (result.data && (result.data.description || result.data.message)) || 'Failed to add pack';
              throw new Error(msg);
            }

            const added = (result.data && result.data.items) ? result.data.items.length : items.length;
            if (added < items.length) {
              throw new Error('Only ' + added + ' of ' + items.length + ' items were added. Please check availability and try again.');
            }

            addPackBtn.textContent = 'Pack Added ✓';
            addPackBtn.style.background = 'var(--color-success, #2ecc71)';

            document.dispatchEvent(new CustomEvent('cart:updated', { detail: result.data }));
            if (window.theme && typeof window.theme.updateCartCount === 'function') {
              window.theme.updateCartCount();
            }
            if (window.theme && typeof window.theme.openCartDrawer === 'function') {
              window.theme.openCartDrawer();
            }

            setTimeout(function() {
              selectedProducts = [];
              selectedMeta = {};
              selectBtns.forEach(function(btn) {
                btn.classList.remove('selected');
                const label = btn.querySelector('.mix-match-pack__select-product-label');
                if (label) label.textContent = section.dataset.selectLabel || 'Select';
                const card = btn.closest('.mix-match-pack__product-card');
                if (card) {
                  card.classList.remove('mix-match-pack__product-card--selected');
                }
              });
              updateSummary();

              addPackBtn.textContent = defaultLabel;
              addPackBtn.style.background = '';
              addPackBtn.disabled = true;
              addPackBtn.classList.remove('loading');
            }, 2500);
          })
          .catch(function(error) {
            console.error('[mix-match-pack] add error:', error);
            alert(error.message || 'There was an error adding your pack. Please try again.');
            addPackBtn.disabled = false;
            addPackBtn.textContent = defaultLabel;
            addPackBtn.classList.remove('loading');
            addPackBtn.style.background = '';
          });
      });
    }

    // Initialize variant data for all products
    function initializeVariantData() {
      const productCards = section.querySelectorAll('.mix-match-pack__product-card');
      productCards.forEach(function(card) {
        const productContainer = card.closest('.mix-match-pack__product');
        if (!productContainer) return;
        const productId = productContainer.dataset.productId;
        const variantSelector = card.querySelector('.mix-match-pack__variant-selector');
        const selectBtn = card.querySelector('.mix-match-pack__select-product');

        if (variantSelector) {
          const selectedOption = variantSelector.options[variantSelector.selectedIndex];
          if (selectedOption) {
            selectedVariants[productId] = {
              variantId: selectedOption.value,
              price: parsePriceFromCents(selectedOption.dataset.price || '0')
            };
            if (selectBtn) {
              selectBtn.dataset.variantId = selectedOption.value;
              selectBtn.dataset.price = selectedOption.dataset.price || '0';
            }
          }
        } else if (selectBtn) {
          selectedVariants[productId] = {
            variantId: selectBtn.dataset.variantId || '',
            price: parsePriceFromCents(selectBtn.dataset.price || '0')
          };
        }
      });
    }

    // Cache the default "Select" label text so we can restore it reliably.
    const firstLabel = section.querySelector('.mix-match-pack__select-product-label');
    if (firstLabel) section.dataset.selectLabel = firstLabel.textContent.trim();

    initializeVariantData();
    updateSummary();
  });
});

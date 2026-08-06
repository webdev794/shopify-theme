// ========== HEADER JAVASCRIPT ==========
// This file contains all functionality for the header section

(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  const desktopHover = window.matchMedia('(min-width: 990px) and (hover: hover)');
  const desktopWidth = window.matchMedia('(min-width: 990px)');

    /* --- Animated panel close (slide up) then remove [open] --- */
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PANEL_CLOSE_MS = 900;

  const getDropdownPanel = (details) =>
    details.querySelector('.header__mega-menu, .header__submenu');

  const clearPanelInline = (panel) => {
    if (!panel) return;
    panel.style.animation = '';
    panel.style.transition = '';
    panel.style.opacity = '';
    panel.style.transform = '';
  };

  const forceClose = (details) => {
    const panel = getDropdownPanel(details);
    clearPanelInline(panel);
    details.classList.remove('is-closing');
    details.removeAttribute('open');
    delete details.dataset.closing;
  };

  const animatedClose = (details) => {
    if (!details || !details.open) return;
    if (details.dataset.closing === 'true') return;

    const panel = getDropdownPanel(details);
    // Mobile / reduced motion / no panel → instant
    if (!panel || REDUCED_MOTION || !desktopWidth.matches) {
      forceClose(details);
      return;
    }

    details.dataset.closing = 'true';
    details.classList.add('is-closing');

    const isMega = panel.classList.contains('header__mega-menu');

    // Freeze plate at fully-open pose (cancel open keyframe)
    panel.style.animation = 'none';
    panel.style.transition = 'none';
    if (isMega) {
      panel.style.opacity = '1';
      panel.style.transform = 'translate3d(0, 0, 0)';
    } else {
      panel.style.opacity = '1';
      panel.style.transform = 'translateX(-50%) translateY(0)';
    }
    void panel.offsetHeight;

    // Whole plate moves up as one unit (content stays fixed on the plate)
    if (isMega) {
      panel.style.transition =
        'opacity 0.5s ease, transform 0.72s cubic-bezier(0.4, 0, 0.2, 1)';
      panel.style.opacity = '0';
      panel.style.transform = 'translate3d(0, -56px, 0)';
    } else {
      panel.style.transition =
        'opacity 0.4s ease, transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
      panel.style.opacity = '0';
      panel.style.transform = 'translateX(-50%) translateY(-20px)';
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      panel.removeEventListener('transitionend', onEnd);
      forceClose(details);
    };

    const onEnd = (event) => {
      if (event.target !== panel) return;
      if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') return;
      finish();
    };
    panel.addEventListener('transitionend', onEnd);
    window.setTimeout(finish, PANEL_CLOSE_MS);
  };


  /* --- Close open dropdowns on outside click and Escape --- */
  const closeDropdowns = (except) => {
    header.querySelectorAll('details[open]').forEach((details) => {
      if (details === except) return;
      // Don't animate-close the mobile drawer or search with mega logic
      if (details.classList.contains('header__mobile-menu') || details.classList.contains('header__search')) {
        details.removeAttribute('open');
        return;
      }
      animatedClose(details);
    });
  };

  /* --- Desktop: animate close when summary is clicked while open --- */
  header.querySelectorAll('[data-header-dropdown] > summary').forEach((summary) => {
    summary.addEventListener('click', (event) => {
      if (!desktopWidth.matches) return;
      const details = summary.parentElement;
      if (!details || !details.open) return;
      if (details.dataset.closing === 'true') {
        event.preventDefault();
        return;
      }
      // Prevent native instant close; run slide-up instead
      event.preventDefault();
      animatedClose(details);
    });
  });

  /* --- Character Animation on Hover for ALL Menu Items --- */
  const animateMenuLetters = () => {
    const menuLinks = document.querySelectorAll('.header__menu-link:not([data-char-animated])');
    
    menuLinks.forEach(link => {
      // Skip if link has children (already processed)
      if (link.children.length > 0) return;
      
      const text = link.textContent.trim();
      if (!text) return;
      
      // Apply to ALL menu items
      link.setAttribute('data-char-animated', 'true');
      
      // Store original text
      const originalText = text;
      link.innerHTML = '';
      
      // Create wrapper with individual character spans
      const wrapper = document.createElement('span');
      wrapper.className = 'char-wrapper';
      wrapper.setAttribute('aria-label', originalText.toUpperCase());
      
      // Split into characters
      originalText.split('').forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.className = 'char-split';
        span.setAttribute('aria-hidden', 'true');
        span.style.whiteSpace = 'pre';
        span.style.transitionDelay = (index * 30) + 'ms';
        wrapper.appendChild(span);
      });
      
      link.appendChild(wrapper);
    });
  };

  // Run once when idle so it does not compete with first paint / LCP
  var runMenuLetters = function () {
    if (window.requestIdleCallback) {
      requestIdleCallback(animateMenuLetters, { timeout: 2000 });
    } else {
      setTimeout(animateMenuLetters, 1);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMenuLetters);
  } else {
    runMenuLetters();
  }
  document.addEventListener('shopify:section:load', animateMenuLetters);

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeDropdowns();
  });

  header.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openDetails = event.target.closest('details[open]');
    if (openDetails) {
      if (openDetails.classList.contains('header__mobile-menu') || openDetails.classList.contains('header__search')) {
        openDetails.removeAttribute('open');
      } else {
        animatedClose(openDetails);
      }
      const summary = openDetails.querySelector('summary');
      if (summary) summary.focus();
    }
  });

  /* --- Keep aria-expanded in sync + only one top-level panel open at a time --- */
  header.querySelectorAll('details').forEach((details) => {
    const summary = details.querySelector(':scope > summary');
    if (summary) summary.setAttribute('aria-expanded', String(details.open));

    details.addEventListener('toggle', () => {
      if (summary) summary.setAttribute('aria-expanded', String(details.open));
      // Nested mobile accordions shouldn't close their parent menu
      if (details.open && !details.closest('details[open] details')) {
        closeDropdowns(details);
      }
    });
  });

  /* --- Optional: open desktop dropdowns on hover (with close delay) --- */
  if (header.hasAttribute('data-hover-menus')) {
    header.querySelectorAll('.header__menu-item').forEach((item) => {
      const details = item.querySelector('[data-header-dropdown]');
      if (!details) return;

      let closeTimer = null;

      const cancelClose = () => {
        clearTimeout(closeTimer);
        closeTimer = null;
      };

      const scheduleClose = () => {
        cancelClose();
        closeTimer = setTimeout(() => {
          // Keep open if the pointer is still over the item or the panel
          // (covers the gap between trigger and full-bleed mega menu).
          if (item.matches(':hover') || details.matches(':hover')) return;
          animatedClose(details);
        }, 120);
      };

      item.addEventListener('pointerenter', (event) => {
        if (!desktopHover.matches || event.pointerType === 'touch') return;
        cancelClose();
        // Cancel in-progress close animation if user re-enters
        if (details.dataset.closing === 'true') {
          const panel = getDropdownPanel(details);
          clearPanelInline(panel);
          details.classList.remove('is-closing');
          delete details.dataset.closing;
          // stay open; replay open animation
          details.removeAttribute('open');
          void details.offsetHeight;
          details.setAttribute('open', '');
          return;
        }
        if (!details.open) details.setAttribute('open', '');
      });

      item.addEventListener('pointerleave', (event) => {
        if (!desktopHover.matches || event.pointerType === 'touch') return;
        // Moving into a descendant panel (mega menu / submenu) — stay open
        if (event.relatedTarget && details.contains(event.relatedTarget)) {
          cancelClose();
          return;
        }
        scheduleClose();
      });

      // Mega / dropdown panels can sit outside the <li> hit box visually;
      // keep the menu open while the pointer is over the panel itself.
      details.addEventListener('pointerenter', (event) => {
        if (!desktopHover.matches || event.pointerType === 'touch') return;
        cancelClose();
        if (details.dataset.closing === 'true') {
          const panel = getDropdownPanel(details);
          clearPanelInline(panel);
          details.classList.remove('is-closing');
          delete details.dataset.closing;
          details.removeAttribute('open');
          void details.offsetHeight;
          details.setAttribute('open', '');
          return;
        }
        if (!details.open) details.setAttribute('open', '');
      });

      details.addEventListener('pointerleave', (event) => {
        if (!desktopHover.matches || event.pointerType === 'touch') return;
        if (event.relatedTarget && item.contains(event.relatedTarget)) {
          cancelClose();
          return;
        }
        scheduleClose();
      });
    });
  }

  /* --- Sticky header: scrolled shadow + optional hide on scroll down --- */
  if (header.classList.contains('header--sticky')) {
    const hideOnScroll = header.hasAttribute('data-hide-on-scroll');
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('header--scrolled', y > 4);

      if (hideOnScroll) {
        const scrollingDown = y > lastY;
        const panelOpen = header.querySelector('details[open]');
        const focusWithin = header.contains(document.activeElement);

        if (scrollingDown && y > 150 && !panelOpen && !focusWithin) {
          header.classList.add('header--hidden');
        } else if (!scrollingDown || y <= 150) {
          header.classList.remove('header--hidden');
        }
      }

      lastY = y;
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();
  }

  /* --- Mobile menu: lock body scroll while open, close on desktop resize --- */
  const mobileMenu = header.querySelector('[data-header-mobile-menu]');
  if (mobileMenu) {
    mobileMenu.addEventListener('toggle', () => {
      document.body.classList.toggle('header-mobile-menu-open', mobileMenu.open);
    });

    const onDesktopChange = (event) => {
      if (event.matches && mobileMenu.open) mobileMenu.removeAttribute('open');
    };
    if (desktopWidth.addEventListener) {
      desktopWidth.addEventListener('change', onDesktopChange);
    } else if (desktopWidth.addListener) {
      desktopWidth.addListener(onDesktopChange);
    }
  }

  /* --- Focus search input when search panel opens --- */
  const search = header.querySelector('[data-header-search]');
  if (search) {
    search.addEventListener('toggle', () => {
      if (search.open) {
        const searchInput = search.querySelector('[data-predictive-search-input]');
        if (searchInput) searchInput.focus();
      }
    });
  }

  /* --- Predictive search --- */
  const input = header.querySelector('[data-predictive-search-input]');
  const results = header.querySelector('[data-predictive-search-results]');
  const predictiveUrl = header.dataset.predictiveSearchUrl;
  let abortController = null;
  let debounceTimer = null;

  const renderResults = (products, query) => {
    if (!results) return;
    results.innerHTML = '';

    if (!products || !products.length) {
      const emptyLabel = input && input.form ? input.form.dataset.noResultsLabel : '';
      if (emptyLabel) {
        const empty = document.createElement('span');
        empty.className = 'header__search-empty';
        empty.textContent = emptyLabel;
        results.appendChild(empty);
      }
      return;
    }

    const list = document.createElement('ul');
    list.className = 'list-unstyled';

    products.forEach((product) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'header__search-result-link';
      link.href = product.url;

      if (product.featured_image && product.featured_image.url) {
        const image = document.createElement('img');
        image.className = 'header__search-result-image';
        const separator = product.featured_image.url.includes('?') ? '&' : '?';
        image.src = product.featured_image.url + separator + 'width=80';
        image.alt = product.featured_image.alt || product.title || '';
        image.width = 40;
        image.height = 40;
        image.loading = 'lazy';
        link.appendChild(image);
      }

      const title = document.createElement('span');
      title.textContent = product.title || '';
      link.appendChild(title);

      item.appendChild(link);
      list.appendChild(item);
    });

    const viewAllItem = document.createElement('li');
    const viewAll = document.createElement('a');
    viewAll.className = 'header__search-view-all';
    viewAll.href = (header.dataset.searchUrl || '/search') + '?q=' + encodeURIComponent(query);
    viewAll.textContent = input ? input.form.dataset.viewAllLabel || 'View all results' : 'View all results';
    viewAllItem.appendChild(viewAll);
    list.appendChild(viewAllItem);

    results.appendChild(list);
  };

  if (input && results && predictiveUrl) {
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = input.value.trim();

      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(() => {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        const params = new URLSearchParams({
          q: query,
          'resources[type]': 'product',
          'resources[limit]': '5',
          'resources[options][unavailable_products]': 'last',
        });

        fetch(predictiveUrl + '.json?' + params.toString(), { signal: abortController.signal })
          .then((response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
          })
          .then((data) => {
            const products = (data.resources && data.resources.results && data.resources.results.products) || [];
            renderResults(products, query);
          })
          .catch((error) => {
            if (error.name !== 'AbortError') {
              if (results) results.innerHTML = '';
            }
          });
      }, 300);
    });
  }

  /* --- Localization selectors submit on change --- */
  header.querySelectorAll('[data-localization-select]').forEach((select) => {
    select.addEventListener('change', () => {
      const form = select.closest('form');
      if (form) form.submit();
    });
  });

  /* --- Cart count sync ---
     The badge is server-rendered, so without JS it only changes on page
     load. This block keeps it live for every way the cart can change:
     1. `cart:updated` events dispatched by theme code (e.g. quick add)
     2. ANY AJAX call to the cart endpoints — including from third-party
        apps — by observing fetch/XHR and re-reading /cart.js
     3. Back/forward-cache restores, which otherwise show a stale count */
  const badge = header.querySelector('[data-cart-count]');
  const badgeText = header.querySelector('[data-cart-count-text]');

  const renderCartCount = (count) => {
    if (typeof count !== 'number') return;
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
      if (count > 0) {
        badge.classList.remove('header__cart-count--bump');
        // Force reflow so the animation can replay on consecutive updates
        void badge.offsetWidth;
        badge.classList.add('header__cart-count--bump');
      }
    }
    if (badgeText) {
      // Optional data-template="[count] items in cart" wins; otherwise
      // swap the number inside the server-rendered text
      if (badgeText.dataset.template) {
        badgeText.textContent = badgeText.dataset.template.replace('[count]', count);
      } else {
        badgeText.textContent = badgeText.textContent.replace(/\d+/, count);
      }
    }
  };

  document.addEventListener('cart:updated', (event) => {
    const detail = event.detail || {};
    const count = typeof detail.item_count === 'number'
      ? detail.item_count
      : detail.cart && typeof detail.cart.item_count === 'number'
        ? detail.cart.item_count
        : null;
    if (count !== null) renderCartCount(count);
  });

  let cartSyncTimer = null;
  const syncCartFromServer = () => {
    clearTimeout(cartSyncTimer);
    // Small debounce: batched cart operations trigger one refresh
    cartSyncTimer = setTimeout(() => {
      fetch('/cart.js', { headers: { Accept: 'application/json' } })
        .then((response) => (response.ok ? response.json() : null))
        .then((cart) => {
          if (cart && typeof cart.item_count === 'number') renderCartCount(cart.item_count);
        })
        .catch(() => {});
    }, 300);
  };

  const CART_MUTATION_ROUTES = ['/cart/add', '/cart/change', '/cart/update', '/cart/clear'];
  const isCartMutation = (url) => {
    if (!url) return false;
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      return CART_MUTATION_ROUTES.some((route) => pathname.startsWith(route));
    } catch (error) {
      return false;
    }
  };

  // Observe fetch-based cart calls (theme code and most apps)
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0] && args[0].url;
    const result = originalFetch.apply(this, args);
    if (isCartMutation(url)) {
      result.then(syncCartFromServer).catch(() => {});
    }
    return result;
  };

  // Observe XMLHttpRequest-based cart calls (older apps)
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (isCartMutation(url)) {
      this.addEventListener('loadend', syncCartFromServer);
    }
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  // Pages restored from the back/forward cache can carry a stale badge
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) syncCartFromServer();
  });

  /* --- Minimal / Floating menu overlay --- */
  (function initFloatingMenu() {
    const root = document.querySelector('.header[data-header-minimal]') || header;
    if (!root || !root.hasAttribute('data-header-minimal')) return;

    const trigger = root.querySelector('[data-header-float-trigger]');
    const overlay = root.querySelector('[data-header-float-overlay]');
    if (!trigger || !overlay) return;

    // Move overlay to <body> so parent stacking/overflow cannot hide it
    if (overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }

    const closeBtns = overlay.querySelectorAll('[data-header-float-close]');
    let lastFocus = null;
    let closingTimer = null;

    const openOverlay = (event) => {
      if (event) event.preventDefault();
      lastFocus = document.activeElement;
      overlay.removeAttribute('hidden');
      overlay.hidden = false;
      // reflow before adding class so CSS transition runs
      void overlay.offsetWidth;
      overlay.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('header-float-menu-open');
      const closeBtn = overlay.querySelector('.header-float-overlay__close');
      if (closeBtn) {
        try { closeBtn.focus(); } catch (e) {}
      }
    };

    const closeOverlay = () => {
      overlay.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('header-float-menu-open');
      clearTimeout(closingTimer);
      closingTimer = window.setTimeout(() => {
        if (!overlay.classList.contains('is-open')) {
          overlay.setAttribute('hidden', '');
          overlay.hidden = true;
        }
      }, 450);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus(); } catch (e) {}
      }
    };

    trigger.addEventListener('click', (event) => {
      if (overlay.classList.contains('is-open')) closeOverlay();
      else openOverlay(event);
    });

    closeBtns.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        closeOverlay();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeOverlay();
      }
    });
  })();
})();
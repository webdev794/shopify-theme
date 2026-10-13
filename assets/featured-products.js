/**
 * Featured Products JavaScript
 * Handles carousel navigation, scroll gallery pin, and quick add to cart.
 *
 * v1.7:
 * - Scroll gallery (desktop pin + horizontal track) implemented.
 * - Space above/below CSS variables respected by the pin padding.
 * - Pin end transition stabilized to reduce rare jump-to-bottom.
 * - Mobile (≤749px) uses native horizontal scroll; pin logic is skipped.
 */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileQuery = window.matchMedia('(max-width: 749px)');

  /* ---------------- Carousel ---------------- */

  function initCarousel(section) {
    var grid = section.querySelector('[data-fp-grid]');
    var nav = section.querySelector('[data-fp-nav]');
    if (!grid || !nav || section.dataset.layout !== 'carousel') return;

    var prevBtn = nav.querySelector('[data-fp-prev]');
    var nextBtn = nav.querySelector('[data-fp-next]');
    if (!prevBtn || !nextBtn) return;

    function step() {
      var item = grid.querySelector('.featured-products__item');
      if (!item) return 0;
      var gap = parseInt(getComputedStyle(grid).gap, 10) || 20;
      return item.getBoundingClientRect().width + gap;
    }

    function maxScroll() {
      return grid.scrollWidth - grid.clientWidth;
    }

    function updateButtons() {
      var overflow = maxScroll() > 2;
      nav.hidden = !overflow;
      if (!overflow) return;
      prevBtn.disabled = grid.scrollLeft <= 2;
      nextBtn.disabled = grid.scrollLeft >= maxScroll() - 2;
    }

    function scrollByStep(direction) {
      grid.scrollBy({
        left: direction * step(),
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }

    prevBtn.addEventListener('click', function () { scrollByStep(-1); });
    nextBtn.addEventListener('click', function () { scrollByStep(1); });

    var ticking = false;
    grid.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateButtons();
        ticking = false;
      });
    }, { passive: true });

    nav.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollByStep(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollByStep(1);
      }
    });

    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateButtons, 200);
    });

    updateButtons();
  }

  /* ---------------- Scroll gallery (desktop pin) ---------------- */

  function initScrollGallery(section) {
    if (section.dataset.layout !== 'scroll') return;

    var wrapper = section.querySelector('.featured-products__grid-wrapper--scroll');
    var pin = section.querySelector('[data-fp-scroll-pin]');
    var track = section.querySelector('[data-fp-scroll-track]');
    if (!wrapper || !pin || !track) return;

    var rafId = null;
    var lastState = ''; // '', 'before', 'pinned', 'after'

    function maxTranslate() {
      // How far the track needs to move so the last card can reach the left edge
      var trackWidth = track.scrollWidth;
      var viewWidth = pin.clientWidth || window.innerWidth;
      return Math.max(0, trackWidth - viewWidth);
    }

    function setTransform(x) {
      if (reducedMotion.matches) {
        track.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
        return;
      }
      track.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
    }

    function clearPinClasses() {
      pin.classList.remove('is-pinned', 'is-pinned-end');
    }

    function update() {
      rafId = null;

      // On mobile the CSS turns this into a native horizontal scroller
      if (mobileQuery.matches) {
        if (lastState !== 'mobile') {
          clearPinClasses();
          track.style.transform = '';
          lastState = 'mobile';
        }
        return;
      }

      var rect = wrapper.getBoundingClientRect();
      var viewH = window.innerHeight || document.documentElement.clientHeight;

      // Progress through the tall wrapper (0 = top of wrapper at top of viewport,
      // 1 = bottom of wrapper at bottom of viewport)
      // Usable pin range is the middle portion where the pin stays fixed.
      var totalScrollable = rect.height - viewH;
      if (totalScrollable <= 0) {
        clearPinClasses();
        setTransform(0);
        lastState = 'before';
        return;
      }

      var scrolled = -rect.top; // how much of the wrapper has scrolled past the top
      var progress = scrolled / totalScrollable;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      var translate = progress * maxTranslate();
      setTransform(translate);

      // Pin states with hysteresis-friendly thresholds to reduce flicker / jump
      if (rect.top > 0) {
        // Wrapper top is still below the viewport top → not pinned yet
        if (lastState !== 'before') {
          clearPinClasses();
          lastState = 'before';
        }
      } else if (rect.bottom <= viewH) {
        // Wrapper bottom has reached or passed the viewport bottom → end state
        // Set absolute-at-bottom FIRST, then remove fixed, to avoid a frame where
        // the pin is neither fixed nor anchored (which causes the jump).
        if (lastState !== 'after') {
          pin.classList.add('is-pinned-end');
          // Force layout so absolute position is applied while still fixed
          void pin.offsetHeight;
          pin.classList.remove('is-pinned');
          lastState = 'after';
        }
      } else {
        // Inside the pin range
        if (lastState !== 'pinned') {
          pin.classList.add('is-pinned');
          pin.classList.remove('is-pinned-end');
          lastState = 'pinned';
        }
      }
    }

    function onScrollOrResize() {
      if (rafId != null) return;
      rafId = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', onScrollOrResize);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(onScrollOrResize);
    }

    // Initial paint
    update();
  }

  /* ---------------- Quick add ---------------- */

  function initQuickAdd(section) {
    var texts = {
      adding: section.dataset.textAdding || 'Adding…',
      added: section.dataset.textAdded || 'Added ✓',
      error: section.dataset.textError || 'Error',
      addedNotice: section.dataset.textAddedNotice || 'Product added to cart',
    };

    section.addEventListener('click', function (e) {
      var button = e.target.closest('.product-card__quick-add');
      if (!button || button.disabled) return;
      e.preventDefault();

      var variantId = button.dataset.variantId;
      if (!variantId) return;

      var originalText = button.textContent;
      button.textContent = texts.adding;
      button.disabled = true;

      var body = new FormData();
      body.append('id', variantId);
      body.append('quantity', 1);

      fetch('/cart/add.js', { method: 'POST', body: body, credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (data) {
              throw new Error(data.description || texts.error);
            });
          }
          return response.json();
        })
        .then(function (data) {
          button.textContent = texts.added;
          button.classList.add('product-card__quick-add--success');
          showNotification(texts.addedNotice, 'success');
          refreshCart();

          document.dispatchEvent(new CustomEvent('product:added', {
            detail: { product: data, variantId: variantId },
          }));

          resetButton(button, originalText);
        })
        .catch(function (error) {
          button.textContent = texts.error;
          button.classList.add('product-card__quick-add--error');
          showNotification(error.message || texts.error, 'error');
          resetButton(button, originalText);
        });
    });
  }

  function resetButton(button, originalText) {
    setTimeout(function () {
      button.textContent = originalText;
      button.disabled = false;
      button.classList.remove('product-card__quick-add--success', 'product-card__quick-add--error');
    }, 2000);
  }

  function refreshCart() {
    fetch('/cart.js')
      .then(function (response) { return response.json(); })
      .then(function (cart) {
        document.querySelectorAll('.cart-count, .cart__count, .cart-item-count').forEach(function (el) {
          el.textContent = cart.item_count;
        });

        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { item_count: cart.item_count, cart: cart },
        }));
      })
      .catch(function (error) {
        console.error('Error fetching cart:', error);
      });
  }

  function showNotification(message, type) {
    if (window.theme && window.theme.notifications) {
      window.theme.notifications.show(message, type);
      return;
    }

    var existing = document.querySelector('.featured-products__notification');
    if (existing) existing.remove();

    var notification = document.createElement('div');
    notification.className = 'featured-products__notification featured-products__notification--' + (type || 'success');
    notification.setAttribute('role', 'status');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(function () { notification.remove(); }, 300);
    }, 3000);
  }

  /* ---------------- Quick View grow + Add to Cart avoidance ---------------- */

  function initQuickViewAvoidance(section) {
    if (section.dataset.layout !== 'scroll') return;

    var buttons = section.querySelectorAll('.product-card__quick-view');

    buttons.forEach(function (btn) {
      var card = btn.closest('.product-card');
      if (!card) return;
      var atc = card.querySelector('.product-card__quick-add--animated');

      function activate() {
        btn.classList.add('fp-quick-view-active');
        if (atc) atc.classList.add('fp-atc-avoid');
      }

      function deactivate() {
        btn.classList.remove('fp-quick-view-active');
        if (atc) atc.classList.remove('fp-atc-avoid');
      }

      btn.addEventListener('mouseenter', activate);
      btn.addEventListener('mouseleave', deactivate);
      btn.addEventListener('focus', activate);
      btn.addEventListener('blur', deactivate);
      // Touch devices: treat touch as hover-in, release on touchend
      btn.addEventListener('touchstart', activate, { passive: true });
      btn.addEventListener('touchend', deactivate);
      btn.addEventListener('touchcancel', deactivate);
    });
  }

  /* ---------------- Add to Cart avoidance (reverse pairing) ---------------- */

  function initAddToCartAvoidance(section) {
    if (section.dataset.layout !== 'scroll') return;

    var atcButtons = section.querySelectorAll('.product-card__quick-add--animated');

    atcButtons.forEach(function (atc) {
      var card = atc.closest('.product-card');
      if (!card) return;
      var quickView = card.querySelector('.product-card__quick-view');
      if (!quickView) return;

      function activate() {
        quickView.classList.add('fp-quick-view-avoid');
      }

      function deactivate() {
        quickView.classList.remove('fp-quick-view-avoid');
      }

      atc.addEventListener('mouseenter', activate);
      atc.addEventListener('mouseleave', deactivate);
      atc.addEventListener('focus', activate);
      atc.addEventListener('blur', deactivate);
      atc.addEventListener('touchstart', activate, { passive: true });
      atc.addEventListener('touchend', deactivate);
      atc.addEventListener('touchcancel', deactivate);
    });
  }

  /* ---------------- Overlay name/price slide toggle ---------------- */

  function initOverlaySlide(section) {
    if (section.dataset.layout !== 'scroll') return;

    var targets = section.querySelectorAll(
      '.product-card__overlay-title, .product-card__overlay-price'
    );

    targets.forEach(function (el) {
      // One touch = one move. It slides to the right end and stays there,
      // ignoring further cursor movement, until it's touched again — then
      // it slides back to the left. mouseenter (not mousemove/hover-css)
      // is what gives us that "fire once per touch" behavior.
      el.addEventListener('mouseenter', function () {
        el.classList.toggle('fp-slide-right');
      });

      // Touch devices have no hover state — a tap does the same toggle.
      el.addEventListener('click', function () {
        if (!window.matchMedia('(hover: hover)').matches) {
          el.classList.toggle('fp-slide-right');
        }
      });
    });
  }

  /* ---------------- Init ---------------- */

  function initSection(section) {
    if (section.dataset.fpInit) return;
    section.dataset.fpInit = 'true';
    initCarousel(section);
    initScrollGallery(section);
    initQuickAdd(section);
    initQuickViewAvoidance(section);
    initAddToCartAvoidance(section);
    initOverlaySlide(section);
  }

  function initAll(root) {
    var scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('[data-section-type="featured-products"]').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    // Allow re-init when the section DOM is replaced in the theme editor
    var target = event.target;
    if (target && target.querySelectorAll) {
      target.querySelectorAll('[data-section-type="featured-products"]').forEach(function (el) {
        delete el.dataset.fpInit;
      });
      if (target.dataset && target.dataset.sectionType === 'featured-products') {
        delete target.dataset.fpInit;
      }
    }
    initAll(event.target);
  });
})();
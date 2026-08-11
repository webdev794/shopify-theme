/**
 * Featured Products JavaScript
 * Handles carousel navigation, quick add to cart,
 * animated ATC letter split, and scroll gallery.
 *
 * v1.13 — Smooth lerp / inertia + removed external theme references
 */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

    window.addEventListener('resize', updateButtons);
    updateButtons();
  }

  /* ---------------- Quick add ---------------- */

  function initQuickAdd(section) {
    var texts = {
      adding: section.dataset.textAdding || 'Adding…',
      added: section.dataset.textAdded || 'Added',
      error: section.dataset.textError || 'Error',
      addedNotice: section.dataset.textAddedNotice || 'Added to cart',
    };

    section.addEventListener('click', function (e) {
      var button = e.target.closest('.product-card__quick-add');
      if (!button || button.disabled) return;
      e.preventDefault();

      var variantId = button.dataset.variantId;
      if (!variantId) return;

      var wordEl = button.querySelector('.fp-atc__word');
      var originalHTML = wordEl ? wordEl.innerHTML : null;
      var originalText = button.textContent;
      if (wordEl) {
        wordEl.textContent = texts.adding;
      } else {
        button.textContent = texts.adding;
      }
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
          if (wordEl) {
            wordEl.textContent = texts.added;
          } else {
            button.textContent = texts.added;
          }
          button.classList.add('product-card__quick-add--success');
          showNotification(texts.addedNotice, 'success');
          refreshCart();

          document.dispatchEvent(new CustomEvent('product:added', {
            detail: { product: data, variantId: variantId },
          }));

          resetButton(button, originalText, originalHTML, wordEl);
        })
        .catch(function (error) {
          if (wordEl) {
            wordEl.textContent = texts.error;
          } else {
            button.textContent = texts.error;
          }
          button.classList.add('product-card__quick-add--error');
          showNotification(error.message || texts.error, 'error');
          resetButton(button, originalText, originalHTML, wordEl);
        });
    });
  }

  function resetButton(button, originalText, originalHTML, wordEl) {
    setTimeout(function () {
      if (wordEl && originalHTML != null) {
        wordEl.innerHTML = originalHTML;
      } else {
        button.textContent = originalText;
      }
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

  /* ---------------- Animated ATC letter split ---------------- */
  function enhanceAtcButtons(section) {
    section.querySelectorAll('[data-fp-atc]').forEach(function (btn) {
      if (btn.dataset.fpAtcReady) return;
      btn.dataset.fpAtcReady = 'true';
      var labelEl = btn.querySelector('[data-fp-atc-label]');
      if (!labelEl) return;
      var text = (labelEl.textContent || '').trim();
      if (!text) return;
      labelEl.textContent = '';
      labelEl.removeAttribute('data-fp-atc-label');
      for (var i = 0; i < text.length; i++) {
        var span = document.createElement('span');
        span.className = 'fp-atc__char';
        span.style.setProperty('--i', String(i));
        span.innerHTML = text[i] === ' ' ? '&nbsp;' : text[i];
        labelEl.appendChild(span);
      }
    });
  }

  /* ---------------- Quick View modal portal ---------------- */
  function portalizeQuickViewModals(section) {
    var modals = section.querySelectorAll('.quick-view-modal, [data-quick-view-modal]');
    modals.forEach(function (modal) {
      if (modal.dataset.fpPortaled) return;
      modal.dataset.fpPortaled = 'true';
      document.body.appendChild(modal);
    });
  }

  /* ---------------- Scroll gallery (true pinned horizontal) ---------------- */
  function initScrollGallery(section) {
    if (section.dataset.layout !== 'scroll') return;
    if (section.dataset.fpScrollInit) return;
    section.dataset.fpScrollInit = 'true';

    var reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var isMobile = window.matchMedia('(max-width: 749px)');
    var wrapper = section.querySelector('.featured-products__grid-wrapper--scroll');
    var pin = section.querySelector('[data-fp-scroll-pin]');
    var track = section.querySelector('[data-fp-scroll-track]');
    var grid = section.querySelector('[data-fp-grid]');
    if (!wrapper || !pin || !track || !grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.featured-products__item'));
    if (!items.length) return;

    var pinStart = 0;
    var pinDistance = 0;
    var maxX = 0;
    var wrapperRect = null;
    var state = 'before';
    var itemOffsets = [];
    var trackGap = 24;
    var TRAVERSAL_FRACTION = 0.82;

    // --- Smooth / inertia variables ---
    var targetProgress = 0;   // real progress from scrollY
    var currentProgress = 0;  // smoothed progress that drives the transform
    var lerpFactor = 0.12;    // lower = more lag / softer stop (0.08–0.18 feels good)
    var isAnimating = false;
    var rafId = null;

    function disablePin() {
      wrapper.style.height = 'auto';
      pin.classList.remove('is-pinned', 'is-pinned-end');
      pin.style.width = '';
      pin.style.left = '';
      track.style.transform = '';
      items.forEach(function (item) {
        item.style.transform = '';
        item.style.opacity = '';
      });
      state = 'before';
      targetProgress = 0;
      currentProgress = 0;
      stopLoop();
    }

    function recalc() {
      if (reducedMotionMq.matches || isMobile.matches) {
        disablePin();
        return;
      }

      pin.classList.remove('is-pinned', 'is-pinned-end');
      pin.style.width = '';
      pin.style.left = '';
      wrapper.style.height = 'auto';

      maxX = Math.max(0, track.scrollWidth - pin.clientWidth);
      pinDistance = maxX + window.innerHeight * 0.55;
      wrapper.style.height = (window.innerHeight + pinDistance) + 'px';

      var rawOffsets = items.map(function (item) { return item.offsetLeft; });
      var baseOffset = rawOffsets.length ? rawOffsets[0] : 0;
      itemOffsets = rawOffsets.map(function (v) { return v - baseOffset; });
      trackGap = parseFloat(getComputedStyle(track).columnGap) ||
                 parseFloat(getComputedStyle(track).gap) || 24;

      var rect = wrapper.getBoundingClientRect();
      pinStart = rect.top + window.scrollY;
      wrapperRect = { left: rect.left, width: rect.width };

      // Keep current visual position as close as possible after recalc
      state = 'before';
      updateTargetFromScroll();
      currentProgress = targetProgress;
      applyVisual(currentProgress);
    }

    function setCardEffects(progress) {
      var viewCenter = window.innerWidth * 0.5;
      var CENTER_DEADZONE = 0.04;

      var computed = items.map(function (item, i) {
        var ir = item.getBoundingClientRect();
        var itemCenter = ir.left + ir.width * 0.5;
        var dist = Math.max(-1.2, Math.min(1.2, (itemCenter - viewCenter) / window.innerWidth));
        var absDist = Math.abs(dist);
        var opacity = Math.max(0.28, Math.min(1, 1 - absDist * 0.32));

        var itemWidth = item.offsetWidth;
        var itemLeft = itemOffsets[i] || 0;
        var itemCenterOffset = itemLeft + itemWidth / 2;
        var progressCenter = maxX > 0 ? (itemCenterOffset - window.innerWidth / 2) / maxX : 0;
        progressCenter = Math.max(0, Math.min(1, progressCenter));

        var stepProgress = maxX > 0
          ? (itemWidth + trackGap) / maxX
          : (items.length ? 1 / items.length : 1);

        var windowEnd = progressCenter;
        var windowStart = Math.max(0, windowEnd - stepProgress);
        var riseProgress;

        if (progress <= windowStart) {
          riseProgress = 0;
        } else if (progress >= windowEnd) {
          riseProgress = 1;
        } else if (windowEnd > windowStart) {
          riseProgress = (progress - windowStart) / (windowEnd - windowStart);
        } else {
          riseProgress = 1;
        }

        var entryOffset = ir.height ? ir.height * 0.12 : 36;
        var y = (1 - riseProgress) * entryOffset;

        var transform;
        if (absDist < CENTER_DEADZONE && riseProgress >= 0.98) {
          transform = '';
        } else {
          var scale = 1 - absDist * 0.07;
          transform = 'translate3d(0, ' + y + 'px, 0) scale(' + scale + ')';
        }

        return { transform: transform, opacity: String(opacity) };
      });

      computed.forEach(function (c, i) {
        items[i].style.transform = c.transform;
        items[i].style.opacity = c.opacity;
      });
    }

    function applyVisual(progress) {
      var shift = -maxX * progress;
      track.style.transform = 'translate3d(' + shift + 'px,0,0)';
      setCardEffects(progress);
    }

    function updateTargetFromScroll() {
      var scrollY = window.scrollY;
      var pinEnd = pinStart + pinDistance;

      if (scrollY < pinStart) {
        if (state !== 'before') {
          pin.classList.remove('is-pinned', 'is-pinned-end');
          pin.style.width = '';
          pin.style.left = '';
          state = 'before';
        }
        targetProgress = 0;
      } else if (scrollY <= pinEnd) {
        if (state !== 'pinned') {
          pin.classList.add('is-pinned');
          pin.classList.remove('is-pinned-end');
          if (wrapperRect) {
            pin.style.left = wrapperRect.left + 'px';
            pin.style.width = wrapperRect.width + 'px';
          }
          state = 'pinned';
        }

        var rawProgress = pinDistance > 0
          ? (scrollY - pinStart) / pinDistance
          : 1;
        targetProgress = TRAVERSAL_FRACTION > 0
          ? Math.min(1, rawProgress / TRAVERSAL_FRACTION)
          : 1;
      } else {
        if (state !== 'after') {
          pin.classList.remove('is-pinned');
          pin.classList.add('is-pinned-end');
          pin.style.left = '';
          pin.style.width = '';
          state = 'after';
        }
        targetProgress = 1;
      }
    }

    // Continuous animation loop that lerps currentProgress → targetProgress
    function loop() {
      var diff = targetProgress - currentProgress;

      if (Math.abs(diff) < 0.0004) {
        currentProgress = targetProgress;
        applyVisual(currentProgress);
        isAnimating = false;
        rafId = null;
        return;
      }

      // Lerp
      currentProgress += diff * lerpFactor;
      applyVisual(currentProgress);

      rafId = requestAnimationFrame(loop);
    }

    function startLoop() {
      if (isAnimating) return;
      isAnimating = true;
      rafId = requestAnimationFrame(loop);
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isAnimating = false;
    }

    function onScroll() {
      if (reducedMotionMq.matches || isMobile.matches) return;
      updateTargetFromScroll();
      startLoop();          // keep the lerp running
    }

    function onResize() {
      clearTimeout(onResize._t);
      onResize._t = setTimeout(recalc, 80);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', recalc);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recalc);
    }

    var imgs = track.querySelectorAll('img');
    imgs.forEach(function (img) {
      if (!img.complete) {
        img.addEventListener('load', recalc, { once: true });
        img.addEventListener('error', recalc, { once: true });
      }
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        clearTimeout(ro._t);
        ro._t = setTimeout(recalc, 60);
      });
      ro.observe(track);
      ro.observe(wrapper);
    }

    // Safety recalcs
    setTimeout(recalc, 400);
    setTimeout(recalc, 1200);

    recalc();
  }

  /* ---------------- Init ---------------- */

  function initSection(section) {
    if (section.dataset.fpInit) return;
    section.dataset.fpInit = 'true';
    initCarousel(section);
    initQuickAdd(section);
    enhanceAtcButtons(section);
    portalizeQuickViewModals(section);
    initScrollGallery(section);
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
    var section = event.target.querySelector('[data-section-type="featured-products"]') || event.target;
    if (section && section.getAttribute && section.getAttribute('data-section-type') === 'featured-products') {
      section.dataset.fpInit = '';
      section.dataset.fpScrollInit = '';
    }
    initAll(event.target);
  });
})();
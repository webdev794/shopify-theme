/* ==========================================================================
   The Edit — Product Showcase (Glow Reveal)
   Static script. Reads all per-section settings from data-* attributes on
   the section root (set by the .liquid file) instead of having Liquid
   values baked into this file. Scans every [data-te] root on the page so
   it works correctly even if the section is added more than once.
   ========================================================================== */

(function () {
  function initSection(root) {
    if (!root || root.dataset.teInit === 'true') return;
    root.dataset.teInit = 'true';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fineHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var marqueeEl = root.querySelector('[data-te-marquee]');
    var isMarquee = !!marqueeEl;
    var tiltSetting = root.getAttribute('data-te-tilt-enabled') === 'true';
    var tiltEnabled = tiltSetting && fineHover && !reduceMotion && !isMarquee;
    var gapSetting = parseInt(root.getAttribute('data-te-gap'), 10) || 24;
    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-te-card]'));
    var tiltEls = Array.prototype.slice.call(root.querySelectorAll('[data-te-tilt]'));

    // Staggered scroll-reveal — this is what triggers the glow color-bloom.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var i = cards.indexOf(entry.target);
            setTimeout(function () { entry.target.classList.add('is-in'); }, Math.min(i % 8, 8) * 90);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      cards.forEach(function (c) { io.observe(c); });
    }

    // Cursor-tracked tilt + glare (disabled inside the auto-scrolling marquee).
    if (tiltEnabled) {
      tiltEls.forEach(function (el) {
        var raf = null;
        var bounds = null;

        function onMove(e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            bounds = bounds || el.getBoundingClientRect();
            var px = (e.clientX - bounds.left) / bounds.width;
            var py = (e.clientY - bounds.top) / bounds.height;
            var rx = (0.5 - py) * 10;
            var ry = (px - 0.5) * 12;
            el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(1.015)';
            el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
            el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
          });
        }
        el.addEventListener('pointerenter', function (e) {
          if (e.pointerType !== 'mouse') return;
          bounds = el.getBoundingClientRect();
          el.classList.add('is-tilting');
        });
        el.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse') return;
          onMove(e);
        });
        el.addEventListener('pointerleave', function (e) {
          if (e.pointerType !== 'mouse') return;
          el.classList.remove('is-tilting');
          el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
          bounds = null;
        });
      });
    }

    // Slider: drag-to-scroll + progress rail + prev/next.
    var grid = root.querySelector('[data-te-grid]');
    var prevBtn = root.querySelector('[data-te-prev]');
    var nextBtn = root.querySelector('[data-te-next]');
    var railFill = root.querySelector('[data-te-rail-fill]');

    if (grid && grid.getAttribute('data-te-layout') === 'slider') {
      function updateNavState() {
        var maxScroll = grid.scrollWidth - grid.clientWidth;
        if (prevBtn) prevBtn.disabled = grid.scrollLeft <= 4;
        if (nextBtn) nextBtn.disabled = grid.scrollLeft >= maxScroll - 4;
        if (railFill && maxScroll > 0) {
          var visibleRatio = Math.min(grid.clientWidth / grid.scrollWidth, 1);
          var progress = grid.scrollLeft / maxScroll;
          var fillWidth = visibleRatio * 100;
          var leftPos = progress * (100 - fillWidth);
          railFill.style.width = fillWidth + '%';
          railFill.style.left = leftPos + '%';
        } else if (railFill) {
          railFill.style.width = '100%';
          railFill.style.left = '0%';
        }
      }
      function scrollByCard(dir) {
        var card = grid.querySelector('[data-te-card]');
        var amount = card ? card.getBoundingClientRect().width + gapSetting : 280;
        grid.scrollBy({ left: dir * amount, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (prevBtn) prevBtn.addEventListener('click', function () { scrollByCard(-1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { scrollByCard(1); });
      grid.addEventListener('scroll', updateNavState, { passive: true });
      updateNavState();

      var isDown = false, startX = 0, startScroll = 0, moved = false;
      grid.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startScroll = grid.scrollLeft;
        grid.classList.add('is-dragging');
      });
      window.addEventListener('pointermove', function (e) {
        if (!isDown) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 3) moved = true;
        grid.scrollLeft = startScroll - dx;
      });
      window.addEventListener('pointerup', function () {
        if (!isDown) return;
        isDown = false;
        grid.classList.remove('is-dragging');
      });
      grid.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    }

    // Marquee: continuous auto-scroll, optional pause-on-hover/touch, reduced-motion fallback.
    if (marqueeEl) {
      var pauseOnHover = marqueeEl.getAttribute('data-te-pause') === 'true';
      if (reduceMotion) {
        marqueeEl.classList.add('te__marquee--reduced-motion');
      } else if (pauseOnHover) {
        marqueeEl.addEventListener('pointerenter', function () { marqueeEl.setAttribute('data-paused', 'true'); });
        marqueeEl.addEventListener('pointerleave', function () { marqueeEl.setAttribute('data-paused', 'false'); });
        marqueeEl.addEventListener('touchstart', function () { marqueeEl.setAttribute('data-paused', 'true'); }, { passive: true });
        marqueeEl.addEventListener('touchend', function () { marqueeEl.setAttribute('data-paused', 'false'); }, { passive: true });
      }
    }

    // Working AJAX quick-add (single-variant products only; others link to PDP).
    var quickAddBtns = Array.prototype.slice.call(root.querySelectorAll('[data-te-quick-add]'));
    quickAddBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.state === 'adding' || btn.dataset.state === 'sold-out' || btn.disabled) return;
        var variantId = btn.getAttribute('data-variant-id');
        btn.dataset.state = 'adding';

        fetch(window.Shopify && Shopify.routes && Shopify.routes.root ? Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (result) {
            if (!result.ok) throw new Error((result.data && result.data.description) || 'Could not add to cart');
            btn.dataset.state = 'added';
            document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: result.data }));
            setTimeout(function () { btn.dataset.state = 'idle'; }, 1800);
          })
          .catch(function () {
            btn.dataset.state = 'error';
            setTimeout(function () { btn.dataset.state = 'idle'; }, 1800);
          });
      });
    });

    // Wishlist — persisted in localStorage, no account/app required.
    // Toggling updates EVERY button for that product handle, so it stays in
    // sync across the duplicated cards inside the marquee.
    var WISHLIST_KEY = 'te-wishlist';
    function readWishlist() {
      try { return JSON.parse(window.localStorage.getItem(WISHLIST_KEY)) || []; }
      catch (e) { return []; }
    }
    function writeWishlist(list) {
      try { window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch (e) {}
    }
    var wishlistBtns = Array.prototype.slice.call(root.querySelectorAll('[data-te-wishlist]'));
    if (wishlistBtns.length) {
      var wishlist = readWishlist();
      function setWishlistState(handle, active) {
        wishlistBtns.forEach(function (b) {
          if (b.getAttribute('data-handle') !== handle) return;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }
      wishlistBtns.forEach(function (btn) {
        var handle = btn.getAttribute('data-handle');
        if (wishlist.indexOf(handle) > -1) setWishlistState(handle, true);
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var list = readWishlist();
          var idx = list.indexOf(handle);
          var nowActive;
          if (idx > -1) {
            list.splice(idx, 1);
            nowActive = false;
          } else {
            list.push(handle);
            nowActive = true;
          }
          writeWishlist(list);
          setWishlistState(handle, nowActive);
          document.dispatchEvent(new CustomEvent('wishlist:updated', { bubbles: true, detail: { handle: handle, list: list } }));
        });
      });
    }

    // Color swatches — swap image, price, and quick-add variant without a page reload.
    var swatchGroups = Array.prototype.slice.call(root.querySelectorAll('[data-te-swatches]'));
    swatchGroups.forEach(function (group) {
      var card = group.closest('[data-te-card]');
      if (!card) return;
      var swatches = Array.prototype.slice.call(group.querySelectorAll('[data-te-swatch]'));
      var baseImg = card.querySelector('[data-te-img-base]');
      var revealImg = card.querySelector('[data-te-img-reveal]');
      var priceEl = card.querySelector('[data-te-price]');
      var comparePriceEl = card.querySelector('[data-te-compare-price]');
      var badgeEl = card.querySelector('.te__badge');
      var quickAddBtn = card.querySelector('[data-te-quick-add]');

      swatches.forEach(function (swatch) {
        swatch.addEventListener('click', function () {
          swatches.forEach(function (s) { s.classList.remove('is-active'); });
          swatch.classList.add('is-active');

          var image = swatch.getAttribute('data-image');
          var revealImage = swatch.getAttribute('data-reveal-image');
          var price = swatch.getAttribute('data-price');
          var comparePrice = swatch.getAttribute('data-compare-price');
          var available = swatch.getAttribute('data-available') === 'true';
          var variantId = swatch.getAttribute('data-variant-id');

          if (baseImg && image) baseImg.src = image;
          if (revealImg && revealImage) revealImg.src = revealImage;
          if (priceEl && price) priceEl.textContent = price;
          if (comparePriceEl) comparePriceEl.textContent = comparePrice || '';

          if (badgeEl) {
            if (!available) {
              badgeEl.style.display = '';
              badgeEl.setAttribute('data-te-badge', 'sold-out');
              badgeEl.textContent = 'Sold out';
            } else if (comparePrice) {
              badgeEl.style.display = '';
              badgeEl.setAttribute('data-te-badge', 'sale');
              badgeEl.textContent = 'Sale';
            } else {
              badgeEl.style.display = 'none';
            }
          }

          if (quickAddBtn) {
            quickAddBtn.setAttribute('data-variant-id', variantId);
            if (!available) {
              quickAddBtn.dataset.state = 'sold-out';
              quickAddBtn.setAttribute('disabled', 'disabled');
            } else {
              quickAddBtn.dataset.state = 'idle';
              quickAddBtn.removeAttribute('disabled');
            }
          }
        });
      });
    });
  }

  // Initialize every instance of this section present on the page.
  var roots = Array.prototype.slice.call(document.querySelectorAll('[data-te]'));
  roots.forEach(initSection);

  // Shopify theme editor: initialize a freshly-added/re-rendered section
  // without needing a full page reload.
  document.addEventListener('shopify:section:load', function (evt) {
    var newRoot = evt.target.querySelector('[data-te]');
    if (newRoot) initSection(newRoot);
  });
})();

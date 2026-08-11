/**
 * Suvara mouse-tilt
 * Items with [data-tilt-item] lean toward the cursor while the
 * pointer is over a [data-mouse-tilt] container.
 *
 * Also auto-binds product cards (.card-wrapper / .product-card) so tilt
 * becomes a central part of the shopping experience without per-section markup.
 *
 * Desktop + fine pointer only. Respects prefers-reduced-motion.
 * Does not run on touch devices.
 */
(function () {
  'use strict';

  var REDUCED =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_HOVER =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (REDUCED || !FINE_HOVER) return;

  var MAX_DEFAULT = 6;
  var MAX_CARD = 5;
  var active = null;
  var raf = 0;
  var lastX = 0;
  var lastY = 0;

  function getMax(root) {
    var raw = getComputedStyle(root).getPropertyValue('--tilt-max').trim();
    var n = parseFloat(raw);
    if (!isNaN(n)) return n;
    if (root.classList.contains('card-wrapper') || root.classList.contains('product-card')) {
      return MAX_CARD;
    }
    return MAX_DEFAULT;
  }

  function applyTilt(root, clientX, clientY) {
    var max = getMax(root);
    var items = root.querySelectorAll('[data-tilt-item]');
    if (!items.length) {
      // Treat the root itself as the tilt item when no children are marked
      items = [root];
    }

    items.forEach(function (item) {
      var style = window.getComputedStyle(item);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (item.closest('[aria-hidden="true"]')) return;

      var rect = item.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      var px = (clientX - rect.left) / rect.width - 0.5;
      var py = (clientY - rect.top) / rect.height - 0.5;

      px = Math.max(-0.5, Math.min(0.5, px));
      py = Math.max(-0.5, Math.min(0.5, py));

      var rotY = px * max * 2;
      var rotX = -py * max * 2;
      var lift = (Math.abs(px) + Math.abs(py)) * 4;

      item.style.transform =
        'translate3d(0, ' +
        (-lift).toFixed(2) +
        'px, 0) rotateX(' +
        rotX.toFixed(2) +
        'deg) rotateY(' +
        rotY.toFixed(2) +
        'deg)';
      item.style.transition = 'transform 0.12s ease-out';
    });
  }

  function resetTilt(root) {
    var items = root.querySelectorAll('[data-tilt-item]');
    if (!items.length) items = [root];
    items.forEach(function (item) {
      item.style.transform = '';
      item.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    root.classList.remove('is-tilting');
  }

  function onMove(e) {
    if (!active) return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (!active) return;
      applyTilt(active, lastX, lastY);
    });
  }

  function onEnter(e) {
    var root = e.currentTarget;
    active = root;
    root.classList.add('is-tilting');
    lastX = e.clientX;
    lastY = e.clientY;
    applyTilt(root, lastX, lastY);
  }

  function onLeave(e) {
    var root = e.currentTarget;
    if (active === root) active = null;
    resetTilt(root);
  }

  function bind(root) {
    if (!root || root._mouseTiltBound) return;
    root._mouseTiltBound = true;
    // Perspective on parent for nicer 3D
    if (!root.style.perspective) {
      root.style.perspective = '900px';
    }
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
  }

  function init(scope) {
    var root = scope || document;

    // Explicit containers
    root.querySelectorAll('[data-mouse-tilt]').forEach(bind);

    // Auto-bind product cards so tilt is central to the catalog experience
    root.querySelectorAll('.card-wrapper, .product-card, [data-product-card]').forEach(function (card) {
      // Prefer tilting the media / image area when present
      var media = card.querySelector('.card__media, .product-card__media, [data-tilt-item]');
      if (media && !media.hasAttribute('data-tilt-item')) {
        media.setAttribute('data-tilt-item', '');
      }
      if (!card.hasAttribute('data-mouse-tilt')) {
        card.setAttribute('data-mouse-tilt', '');
      }
      bind(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
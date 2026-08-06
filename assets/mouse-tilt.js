/**
 * Mouse-tilt for hero-style sections
 * Items with [data-tilt-item] lean toward the cursor while the
 * pointer is over a [data-mouse-tilt] container.
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
  var active = null;
  var raf = 0;
  var lastX = 0;
  var lastY = 0;

  function getMax(root) {
    var raw = getComputedStyle(root).getPropertyValue('--tilt-max').trim();
    var n = parseFloat(raw);
    return isNaN(n) ? MAX_DEFAULT : n;
  }

  function applyTilt(root, clientX, clientY) {
    var max = getMax(root);
    var items = root.querySelectorAll('[data-tilt-item]');
    if (!items.length) return;

    items.forEach(function (item) {
      // Skip if not visible (e.g. inactive carousel slide)
      var style = window.getComputedStyle(item);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (item.closest('[aria-hidden="true"]')) return;

      var rect = item.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      var px = (clientX - rect.left) / rect.width - 0.5;
      var py = (clientY - rect.top) / rect.height - 0.5;

      // Clamp so edges don't overshoot when cursor is outside the item
      px = Math.max(-0.5, Math.min(0.5, px));
      py = Math.max(-0.5, Math.min(0.5, py));

      var rotY = px * max * 2;
      var rotX = -py * max * 2;
      // Subtle lift toward camera while tilting (portfolio-card feel)
      var lift = (Math.abs(px) + Math.abs(py)) * 4;

      item.style.transform =
        'translate3d(0, ' +
        (-lift).toFixed(2) +
        'px, 0) rotateX(' +
        rotX.toFixed(2) +
        'deg) rotateY(' +
        rotY.toFixed(2) +
        'deg)';
    });
  }

  function resetTilt(root) {
    root.querySelectorAll('[data-tilt-item]').forEach(function (item) {
      item.style.transform = '';
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
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
  }

  function init(scope) {
    var roots = (scope || document).querySelectorAll('[data-mouse-tilt]');
    roots.forEach(bind);
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

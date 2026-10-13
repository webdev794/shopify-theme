/* ==========================================================================
   Sticky Pinned Story — assets/sticky-pinned-story.js
   No Liquid runs in this file. initAll() loops over every [data-ssr] root
   on the page so this still works correctly if the section is added more
   than once.
   ========================================================================== */
(function () {
  function initStickyPinnedStory(root) {
    if (!root || root.dataset.ssrInit === 'true') return;
    root.dataset.ssrInit = 'true';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-ssr-step]'));
    var images = Array.prototype.slice.call(root.querySelectorAll('[data-ssr-image]'));
    var railNodes = Array.prototype.slice.call(root.querySelectorAll('[data-ssr-rail-node]'));
    var railFills = Array.prototype.slice.call(root.querySelectorAll('[data-ssr-rail-fill]'));

    function setActive(index) {
      steps.forEach(function (step) {
        var i = parseInt(step.getAttribute('data-ssr-step'), 10);
        step.classList.toggle('is-active', i === index);
      });
      images.forEach(function (img) {
        var i = parseInt(img.getAttribute('data-ssr-image'), 10);
        img.classList.toggle('is-active', i === index);
      });
      railNodes.forEach(function (node) {
        var i = parseInt(node.getAttribute('data-ssr-rail-node'), 10);
        node.classList.toggle('is-active', i === index);
      });
      railFills.forEach(function (fill) {
        var i = parseInt(fill.getAttribute('data-ssr-rail-fill'), 10);
        fill.style.height = i < index ? '100%' : '0%';
      });
    }

    if (!steps.length) return;

    railNodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var i = parseInt(node.getAttribute('data-ssr-rail-node'), 10);
        var target = steps[i];
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      setActive(0);
      steps.forEach(function (step) { step.classList.add('is-active'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var i = parseInt(entry.target.getAttribute('data-ssr-step'), 10);
          setActive(i);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    steps.forEach(function (step) { io.observe(step); });
    setActive(0);
  }

  function initAll() {
    var roots = document.querySelectorAll('[data-ssr]');
    for (var i = 0; i < roots.length; i++) initStickyPinnedStory(roots[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /* Shopify theme editor adds/replaces section markup via AJAX without a full
     page reload - this picks up any newly-inserted instance immediately. */
  document.addEventListener('shopify:section:load', function (evt) {
    var root = evt.target.querySelector('[data-ssr]');
    if (root) initStickyPinnedStory(root);
  });
})();
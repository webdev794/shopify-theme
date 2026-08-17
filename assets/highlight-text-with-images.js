// ========== HIGHLIGHT TEXT WITH IMAGES JAVASCRIPT ==========

(() => {
  /* ---------- Scroll reveal ---------- */
  const initReveal = (section) => {
    if (!section.classList.contains('hlt--animated')) return;
    if (section.dataset.hltRevealInit) return;
    section.dataset.hltRevealInit = 'true';

    if (!('IntersectionObserver' in window)) return;

    section.classList.add('hlt--ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add('hlt--visible');
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(section);
  };

  /* ---------- Water bubble magnifier ---------- */
  const BUBBLE_SIZE = 150;
  const ZOOM = 2;

  const initBubble = (section) => {
    if (!section.hasAttribute('data-hlt-bubble')) return;
    if (section.dataset.hltBubbleInit) return;
    section.dataset.hltBubbleInit = 'true';

    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bubble = section.querySelector('.hlt__bubble');
    const lensContent = section.querySelector('.hlt__bubble-content');
    const inner = section.querySelector('.hlt__inner');
    if (!bubble || !lensContent || !inner) return;

    const cloneRoot = document.createElement('div');
    cloneRoot.className = 'hlt__bubble-clone';
    cloneRoot.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:inherit',
      'color:inherit',
      'pointer-events:none',
      'user-select:none'
    ].join(';');

    const cloneInner = inner.cloneNode(true);
    cloneInner.querySelectorAll('a, button').forEach((el) => {
      el.removeAttribute('href');
      el.setAttribute('tabindex', '-1');
      el.style.pointerEvents = 'none';
    });
    cloneInner.querySelectorAll('.hlt__word, .hlt__media').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = el.classList.contains('hlt__media')
        ? 'translateY(0) rotate(var(--hlt-tilt, 0deg))'
        : 'none';
    });
    cloneRoot.appendChild(cloneInner);
    lensContent.appendChild(cloneRoot);

    let raf = null;
    let active = false;

    const measure = () => {
      const sRect = section.getBoundingClientRect();
      const iRect = inner.getBoundingClientRect();
      const innerOffsetX = iRect.left - sRect.left;
      const innerOffsetY = iRect.top - sRect.top;

      section.style.setProperty('--hlt-section-w', `${sRect.width}px`);
      section.style.setProperty('--hlt-section-h', `${sRect.height}px`);
      section.style.setProperty('--hlt-bubble-size', `${BUBBLE_SIZE}px`);
      section.style.setProperty('--hlt-bubble-zoom', String(ZOOM));

      cloneInner.style.position = 'absolute';
      cloneInner.style.left = `${innerOffsetX}px`;
      cloneInner.style.top = `${innerOffsetY}px`;
      cloneInner.style.width = `${iRect.width}px`;
      cloneInner.style.margin = '0';
      cloneInner.style.maxWidth = 'none';
      cloneInner.style.padding = getComputedStyle(inner).padding;
    };

    const updatePosition = (clientX, clientY) => {
      const rect = section.getBoundingClientRect();
      section.style.setProperty('--hlt-bx', `${clientX - rect.left}px`);
      section.style.setProperty('--hlt-by', `${clientY - rect.top}px`);
    };

    const onMove = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updatePosition(e.clientX, e.clientY));
    };

    const onEnter = (e) => {
      measure();
      updatePosition(e.clientX, e.clientY);
      section.classList.add('is-bubbling');
      active = true;
    };

    const onLeave = () => {
      section.classList.remove('is-bubbling');
      active = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    section.addEventListener('mouseenter', onEnter);
    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (active) measure();
      }, 120);
    });
  };

  /* ---------- Boot ---------- */
  const initSection = (section) => {
    initReveal(section);
    initBubble(section);
  };

  const initAll = (root) => {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('[data-hlt]').forEach(initSection);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target.querySelector('[data-hlt]') || event.target;
    if (section && section.matches && section.matches('[data-hlt]')) {
      section.dataset.hltRevealInit = '';
      section.dataset.hltBubbleInit = '';
      const oldContent = section.querySelector('.hlt__bubble-content');
      if (oldContent) oldContent.innerHTML = '';
      initSection(section);
    } else {
      initAll(event.target);
    }
  });
})();

/* Theme: parallax images + scroll-reactive text */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initParallax(section) {
    if (section.dataset.hltParallax !== 'true') return;
    if (section.dataset.hltParallaxInit) return;
    section.dataset.hltParallaxInit = 'true';

    var medias = section.querySelectorAll('.hlt__media');
    if (!medias.length) return;

    function update() {
      var rect = section.getBoundingClientRect();
      var viewH = window.innerHeight || 1;
      // -0.5 when section top at bottom of view, +0.5 when bottom at top
      var progress = (viewH / 2 - (rect.top + rect.height / 2)) / viewH;
      progress = Math.max(-1, Math.min(1, progress));

      medias.forEach(function (el, i) {
        var strength = parseFloat(getComputedStyle(el).getPropertyValue('--hlt-parallax')) || 12;
        var dir = i % 2 === 0 ? 1 : -1;
        var y = progress * strength * dir;
        el.style.transform =
          'translate3d(0, calc(var(--hlt-img-offset-y, 0px) + ' +
          y.toFixed(2) +
          'px), 0) rotate(var(--hlt-tilt, 0deg))';
      });

      if (section.dataset.hltScrollText === 'true') {
        section.querySelectorAll('.hlt__word--accent, .hlt__word--highlight').forEach(function (word, i) {
          var shift = progress * (6 + (i % 3) * 2);
          word.style.transform = 'translate3d(0, ' + shift.toFixed(2) + 'px, 0)';
        });
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  function boot(scope) {
    (scope || document).querySelectorAll('[data-hlt]').forEach(initParallax);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot();
    });
  } else boot();
  document.addEventListener('shopify:section:load', function (e) {
    boot(e.target);
  });
})();
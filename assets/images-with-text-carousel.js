// ========== THE SUVARA RITUAL — Images with Text Carousel ==========

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* --- Scroll-linked circle-to-full reveal (first slide's image) --- */
  const initMorph = (carousel) => {
    const target = carousel.querySelector('[data-iwt-morph]');
    if (!target || reducedMotion.matches) return;

    let ticking = false;

    const computeProgress = () => {
      const rect = target.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      // Start morphing when the image's center is a viewport-height's worth
      // below center; finish exactly as its center reaches viewport center.
      const start = window.innerHeight * 0.6;
      const distance = elCenter - viewportCenter;
      const progress = (start - distance) / start;
      return Math.max(0, Math.min(1, progress));
    };

    const update = () => {
      ticking = false;
      target.style.setProperty('--iwt-morph-progress', computeProgress().toFixed(3));
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Only let the CSS clip-path apply once JS has actually taken control —
    // avoids the image staying stuck as a small circle if JS fails to load.
    target.setAttribute('data-iwt-morph-ready', 'true');
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    update();
  };

  const initCarousel = (carousel) => {
    if (carousel.dataset.iwtInit) return;
    carousel.dataset.iwtInit = 'true';

    const scroller = carousel.querySelector('[data-iwt-scroller]');
    const slides = Array.from(carousel.querySelectorAll('[data-iwt-slide]'));

    initMorph(carousel); // independent of slide count / carousel nav below

    if (!scroller || slides.length < 2) return;

    const prevButton = carousel.querySelector('[data-iwt-prev]');
    const nextButton = carousel.querySelector('[data-iwt-next]');
    const dots = Array.from(carousel.querySelectorAll('[data-iwt-dot]'));
    const playback = carousel.querySelector('[data-iwt-playback]');

    let currentIndex = 0;

    const setCurrent = (index) => {
      currentIndex = index;
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    };

    const goTo = (index) => {
      const target = slides[(index + slides.length) % slides.length];
      scroller.scrollTo({
        left: target.offsetLeft - scroller.offsetLeft,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    };

    /* --- Track the visible slide (works for swipes too) --- */
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setCurrent(slides.indexOf(entry.target));
          });
        },
        { root: scroller, threshold: 0.6 }
      );
      slides.forEach((slide) => observer.observe(slide));
    }

    /* --- Arrows and dots --- */
    if (prevButton) prevButton.addEventListener('click', () => goTo(currentIndex - 1));
    if (nextButton) nextButton.addEventListener('click', () => goTo(currentIndex + 1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => goTo(Number(dot.dataset.iwtDot)));
    });

    /* --- Autoplay --- */
    if (!carousel.hasAttribute('data-autoplay')) return;

    // Reduced motion should stop slides from auto-advancing, but it must
    // not stop the play/pause button from working at all. The previous
    // version returned here whenever reducedMotion.matches was true —
    // before the button's click listener below ever got attached — so the
    // button rendered but silently did nothing when clicked. Reduced
    // motion is folded into shouldPlay() instead now, so autoplay still
    // never runs, but the button itself stays functional.
    if (reducedMotion.matches) {
      // Nothing for it to ever start/stop, so don't leave a button that
      // looks interactive but can never actually do anything.
      if (playback) playback.hidden = true;
    }

    const speed = (Number(carousel.dataset.autoplaySpeed) || 6) * 1000;
    let timer = null;
    let pausedByUser = false;
    let hovered = false;
    let focused = false;
    let visible = true;

    const setPlaybackState = (paused) => {
      carousel.classList.toggle('iwt-carousel--paused', paused);
      scroller.setAttribute('aria-live', paused ? 'polite' : 'off');
      if (playback) {
        const pauseLabel = playback.getAttribute('aria-label');
        if (!playback.dataset.pauseLabel) playback.dataset.pauseLabel = pauseLabel;
        playback.setAttribute(
          'aria-label',
          paused ? playback.dataset.playLabel : playback.dataset.pauseLabel
        );
      }
    };

    const stop = () => {
      clearInterval(timer);
      timer = null;
    };

    const update = () => {
      const timerShouldRun =
        !pausedByUser && !hovered && !focused && visible && !reducedMotion.matches;
      if (timerShouldRun && !timer) {
        timer = setInterval(() => goTo(currentIndex + 1), speed);
      } else if (!timerShouldRun) {
        stop();
      }
      // Icon/label reflect only what the user actually chose — not hover
      // or focus, which pause the timer too but shouldn't visually claim
      // "paused" every time the cursor is sitting over the carousel
      // (which it necessarily is while clicking this button). That
      // mismatch was the actual bug: clicking never looked like it did
      // anything, because hover was masking the click's effect.
      setPlaybackState(pausedByUser);
    };

    if (playback) {
      playback.addEventListener('click', () => {
        pausedByUser = !pausedByUser;
        update();
      });
    }

    carousel.addEventListener('pointerenter', () => { hovered = true; update(); });
    carousel.addEventListener('pointerleave', () => { hovered = false; update(); });
    // Scoped to the scroller (slide content), not the whole carousel —
    // this was the actual bug: focus lands on the playback button itself
    // after every click (normal browser behavior), and since moving the
    // mouse away doesn't clear keyboard focus, `focused` stayed true
    // forever after the first click, permanently blocking the timer
    // regardless of pausedByUser. Scoping to the scroller means only
    // focus landing inside a slide (e.g. tabbing to its link) pauses
    // autoplay — focusing the controls doesn't.
    scroller.addEventListener('focusin', () => { focused = true; update(); });
    scroller.addEventListener('focusout', (event) => {
      if (!scroller.contains(event.relatedTarget)) {
        focused = false;
        update();
      }
    });
    // Manual swiping pauses the rotation permanently
    scroller.addEventListener('touchstart', () => { pausedByUser = true; update(); }, { passive: true });

    if ('IntersectionObserver' in window) {
      const visibility = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visible = entry.isIntersecting;
            update();
          });
        },
        { threshold: 0.3 }
      );
      visibility.observe(carousel);
    }

    update();
  };

  const initAll = (root) => {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('[data-iwt-carousel]').forEach(initCarousel);
  };

  initAll();

  /* --- Theme editor integration --- */
  document.addEventListener('shopify:section:load', (event) => {
    initAll(event.target);
  });

  document.addEventListener('shopify:block:select', (event) => {
    const slide = event.target.closest ? event.target.closest('[data-iwt-slide]') : null;
    const target = slide || (event.target.querySelector && event.target.querySelector('[data-iwt-slide]'));
    if (!target) return;
    const scroller = target.closest('[data-iwt-scroller]');
    if (scroller) {
      scroller.scrollTo({ left: target.offsetLeft - scroller.offsetLeft, behavior: 'auto' });
    }
  });
})();
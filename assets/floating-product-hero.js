/* Floating Product Hero — behaviour
   Reads per-instance settings from data-* attributes on the [data-fh] root
   (set by the section's .liquid file) so this single file can safely serve
   every instance of the section on the page. */
(function () {
  function initFloatingHero(root) {
    if (!root || root.dataset.fhInit === 'true') return;
    root.dataset.fhInit = 'true';

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-fh-item]'));
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-fh-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-fh-dot]'));
    var prevBtn = root.querySelector('[data-fh-prev]');
    var nextBtn = root.querySelector('[data-fh-next]');

    var autoplay = root.dataset.autoplay === 'true';
    var autoplaySpeed = (parseFloat(root.dataset.autoplaySpeed) || 5) * 1000;
    var current = 0;
    var timer = null;
    var hasEntered = false;

    function itemsForSlide(index) {
      return items.filter(function (item) {
        return parseInt(item.getAttribute('data-slide-index'), 10) === index + 1;
      });
    }

    function playItemEntrance(slideIndex) {
      itemsForSlide(slideIndex).forEach(function (item) {
        item.classList.remove('is-in', 'is-floating');
        void item.offsetWidth;
        item.classList.add('is-current-slide');
        requestAnimationFrame(function () {
          item.classList.add('is-in');
          var delay = parseFloat(getComputedStyle(item).getPropertyValue('--fh-delay')) || 0;
          setTimeout(function () { item.classList.add('is-floating'); }, (delay + 0.9) * 1000);
        });
      });
    }

    function playContentEntrance(slideEl) {
      var children = slideEl.querySelectorAll('.fh__eyebrow, .fh__heading, .fh__paragraph, .fh__button, .fh__badge');
      children.forEach(function (el) { el.classList.remove('is-in'); });
      void slideEl.offsetWidth;
      requestAnimationFrame(function () {
        children.forEach(function (el) { el.classList.add('is-in'); });
      });
    }

    var transitionType = root.getAttribute('data-transition') || 'fade';

    function exitTransform(type, direction) {
      if (type === 'slide') return direction > 0 ? 'translateX(-100%)' : 'translateX(100%)';
      if (type === 'zoom') return 'scale(0.85)';
      return '';
    }
    function enterStartTransform(type, direction) {
      if (type === 'slide') return direction > 0 ? 'translateX(100%)' : 'translateX(-100%)';
      if (type === 'zoom') return 'scale(0.92)';
      return '';
    }
    function getDirection(fromIndex, toIndex, total) {
      var diff = toIndex - fromIndex;
      if (Math.abs(diff) === total - 1 && total > 1) return diff > 0 ? -1 : 1;
      return diff >= 0 ? 1 : -1;
    }

    function goToSlide(index) {
      var total = slides.length;
      if (!total) return;
      index = ((index % total) + total) % total;
      if (index === current && hasEntered) return;

      var useTransform = transitionType !== 'fade' && !reduceMotion;
      var direction = getDirection(current, index, total);
      var oldSlide = slides[current];
      var newSlide = slides[index];
      var oldItems = itemsForSlide(current);

      if (useTransform) {
        newSlide.style.transition = 'none';
        newSlide.style.transform = enterStartTransform(transitionType, direction);
        void newSlide.offsetWidth;
        newSlide.style.transition = '';
      }

      oldSlide.classList.remove('is-active-slide');
      oldSlide.setAttribute('aria-hidden', 'true');
      if (useTransform) {
        oldSlide.style.transform = exitTransform(transitionType, direction);
      }
      oldItems.forEach(function (item) {
        item.classList.remove('is-in', 'is-floating');
        item.classList.remove('is-current-slide');
      });
      if (dots[current]) dots[current].classList.remove('is-active');

      current = index;

      newSlide.classList.add('is-active-slide');
      newSlide.removeAttribute('aria-hidden');
      if (useTransform) {
        requestAnimationFrame(function () { newSlide.style.transform = ''; });
        setTimeout(function () { oldSlide.style.transform = ''; }, 650);
      }
      if (dots[current]) dots[current].classList.add('is-active');

      playContentEntrance(newSlide);
      playItemEntrance(current);
    }

    function next() { goToSlide(current + 1); restartAutoplay(); }
    function prev() { goToSlide(current - 1); restartAutoplay(); }

    function startAutoplay() {
      stopAutoplay();
      if (!autoplay || slides.length < 2 || reduceMotion) return;
      timer = setInterval(function () { goToSlide(current + 1); }, autoplaySpeed);
    }
    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function restartAutoplay() {
      startAutoplay();
    }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-slide-index'), 10) - 1;
        goToSlide(idx);
        restartAutoplay();
      });
    });
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);

    function playEntrance() {
      hasEntered = true;
      root.classList.add('is-in');
      playContentEntrance(slides[current]);
      playItemEntrance(current);
      startAutoplay();
    }

    if (reduceMotion) {
      root.classList.add('is-in');
      slides.forEach(function (slide) {
        slide.querySelectorAll('.fh__eyebrow, .fh__heading, .fh__paragraph, .fh__button, .fh__badge').forEach(function (el) {
          el.classList.add('is-in');
        });
      });
      items.forEach(function (item) { item.classList.add('is-in'); });
      hasEntered = true;
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            playEntrance();
            obs.disconnect();
          }
        });
      }, { threshold: 0.2 });
      io.observe(root);
    } else {
      playEntrance();
    }

    // Subtle cursor parallax on the floating stage (desktop only) - shifts the
    // whole stage a little. Independent of the per-item repel hover below.
    if (root.dataset.parallax === 'true') {
      var stage = root.querySelector('[data-fh-stage]');
      if (stage && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        var raf = null;
        root.addEventListener('mousemove', function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            var rect = root.getBoundingClientRect();
            var px = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
            var py = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
            stage.style.translate = px + 'px ' + py + 'px';
            raf = null;
          });
        });
        root.addEventListener('mouseleave', function () {
          stage.style.translate = '0px 0px';
        });
      }
    }

    // ---------- Repel hover on individual floating images ----------
    // As the cursor gets close to an image, the image glides AWAY from it
    // (not toward it) - that's why two neighbouring images visibly gain
    // distance between them as the cursor passes between them. Smooth glide
    // both ways, no bounce/overshoot, matching the reference.
    if (root.dataset.magnetic === 'true' && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
      var magnetRadius = parseFloat(root.dataset.magnetRadius) || 220;
      var magnetStrength = parseFloat(root.dataset.magnetStrength) || 34;
      var magnetRaf = null;

      var updateMagnetic = function (clientX, clientY) {
        items.forEach(function (item) {
          if (!item.classList.contains('is-current-slide')) return;
          var rect = item.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          // Vector FROM the cursor TO the item's center - pushing the item
          // further along this same vector moves it away from the cursor.
          var dx = cx - clientX;
          var dy = cy - clientY;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < magnetRadius) {
            var proximity = 1 - dist / magnetRadius;
            var push = proximity * magnetStrength;
            var angle = Math.atan2(dy, dx);
            item.style.setProperty('--fh-mx', (Math.cos(angle) * push).toFixed(1) + 'px');
            item.style.setProperty('--fh-my', (Math.sin(angle) * push).toFixed(1) + 'px');
          } else {
            item.style.setProperty('--fh-mx', '0px');
            item.style.setProperty('--fh-my', '0px');
          }
        });
      };

      var resetMagnetic = function () {
        items.forEach(function (item) {
          item.style.setProperty('--fh-mx', '0px');
          item.style.setProperty('--fh-my', '0px');
        });
      };

      root.addEventListener('mousemove', function (e) {
        if (magnetRaf) return;
        var clientX = e.clientX;
        var clientY = e.clientY;
        magnetRaf = requestAnimationFrame(function () {
          updateMagnetic(clientX, clientY);
          magnetRaf = null;
        });
      });
      root.addEventListener('mouseleave', resetMagnetic);
    }

    document.addEventListener('shopify:section:unload', function (evt) {
      if (evt.detail && evt.detail.sectionId === root.dataset.sectionId) {
        stopAutoplay();
      }
    });
  }

  function initAll(scope) {
    var scopeEl = scope && scope.querySelectorAll ? scope : document;
    var roots = scopeEl.querySelectorAll('[data-fh]');
    Array.prototype.forEach.call(roots, initFloatingHero);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(document); });
  } else {
    initAll(document);
  }

  // Theme editor: re-init when this section is added/re-rendered.
  document.addEventListener('shopify:section:load', function (evt) {
    initAll(evt.target);
  });
})();
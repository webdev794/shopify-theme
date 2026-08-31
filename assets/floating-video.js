/**
 * Floating Video
 *
 * v2: steadier autoplay (no aggressive pause-on-scroll, which caused the
 * "stops sometimes" issue), plus a light mouse/scroll parallax as the
 * foundation for the "living scene" feel. Strength is controlled per-section
 * via the --fv-parallax CSS variable (0 disables it entirely).
 */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initScene(section) {
    if (section.dataset.fvInit) return;
    section.dataset.fvInit = 'true';

    var stage = section.querySelector('[data-fv-stage]');
    var video = section.querySelector('[data-fv-video]');
    var strength = parseFloat(getComputedStyle(section).getPropertyValue('--fv-parallax')) || 0;
    var offsetX = parseFloat(getComputedStyle(section).getPropertyValue('--fv-offset-x')) || 0;
    var offsetY = parseFloat(getComputedStyle(section).getPropertyValue('--fv-offset-y')) || 0;

    /* ---------------- Video playback ---------------- */
    /*
     * Kept deliberately simple: the <video> has the `autoplay` attribute
     * itself, which is reliable for muted+playsinline video in every
     * evergreen browser without needing JS to drive it. JS here only
     * exists as a safety net for the cases autoplay can still fail:
     * iOS Low Power Mode, a tab that was backgrounded on load, or a
     * user's first interaction unblocking a stalled play() promise.
     *
     * We intentionally do NOT pause the video just because it scrolls
     * near the edge of the viewport — that's what caused the earlier
     * "stops sometimes" behavior. Small/short looping clips like this
     * are cheap enough to just keep running, matching how most sites
     * that use these decorative videos (e.g. Webflow builds) treat them.
     */

    if (video) {
      var tryPlay = function () {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {});
        }
      };

      if (reducedMotion.matches) {
        video.pause();
        video.removeAttribute('autoplay');
      } else {
        tryPlay();

        // Safety net: if autoplay was blocked (e.g. iOS Low Power Mode),
        // resume on the first interaction of any kind.
        var resumeOnce = function () {
          if (!video.paused) return;
          tryPlay();
        };
        ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(function (evt) {
          document.addEventListener(evt, resumeOnce, { passive: true, once: true });
        });

        // Browsers can pause background-tab video; resume when the tab
        // becomes visible again instead of leaving it frozen.
        document.addEventListener('visibilitychange', function () {
          if (document.visibilityState === 'visible' && video.paused) {
            tryPlay();
          }
        });
      }
    }

    /* ---------------- Parallax (mouse + scroll) ---------------- */

    if (!stage || strength <= 0 || reducedMotion.matches) return;

    var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    var rafId = null;
    var visible = false;

    if ('IntersectionObserver' in window) {
      var visObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) requestTick();
      }, { threshold: 0 });
      visObserver.observe(section);
    } else {
      visible = true;
    }

    function onPointerMove(e) {
      if (!visible) return;
      var rect = section.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var nx = (e.clientX - cx) / (window.innerWidth / 2);
      var ny = (e.clientY - cy) / (window.innerHeight / 2);
      targetX = Math.max(-1, Math.min(1, nx)) * strength;
      targetY = Math.max(-1, Math.min(1, ny)) * (strength * 0.4);
      requestTick();
    }

    function onScroll() {
      if (!visible) return;
      var rect = section.getBoundingClientRect();
      var viewH = window.innerHeight;
      var progress = 1 - Math.max(0, Math.min(1, rect.top / viewH));
      targetY = (progress - 0.5) * strength * 0.6;
      requestTick();
    }

    function requestTick() {
      if (rafId != null) return;
      rafId = requestAnimationFrame(render);
    }

    function render() {
      rafId = null;
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      stage.style.transform = 'translate3d(' + (currentX + offsetX).toFixed(2) + 'px,' + (currentY + offsetY).toFixed(2) + 'px,0)';
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        requestTick();
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initAll(root) {
    var scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll('[data-section-type="floating-video"]').forEach(initScene);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var target = event.target;
    if (target && target.dataset && target.dataset.sectionType === 'floating-video') {
      delete target.dataset.fvInit;
    }
    initAll(event.target);
  });
})();
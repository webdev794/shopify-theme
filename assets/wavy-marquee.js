/**
 * Suvara Wavy Marquee — scroll-velocity linked ticker
 * Base CSS animation speed scales with page scroll velocity.
 * Optional hybrid items (text + image) supported via .wavy-marquee__item--media
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function WavyMarquee(el) {
    this.el = el;
    this.track = el.querySelector('.wavy-marquee__track');
    if (!this.track) return;

    this.velocityLinked = el.dataset.scrollVelocity === 'true';
    this.baseDuration = parseFloat(getComputedStyle(el).getPropertyValue('--marquee-speed')) || 20;
    this.currentDuration = this.baseDuration;
    this.lastY = window.scrollY;
    this.lastT = performance.now();
    this.velocity = 0;
    this.raf = 0;
    this.visible = true;

    this.init();
  }

  WavyMarquee.prototype.init = function () {
    if (REDUCED) {
      this.track.style.animationPlayState = 'paused';
      return;
    }

    if ('IntersectionObserver' in window) {
      var self = this;
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            self.visible = entry.isIntersecting;
            self.track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
          });
        },
        { threshold: 0.05, rootMargin: '40px' }
      );
      io.observe(this.el);
    }

    document.addEventListener('visibilitychange', function () {
      if (!this.track) return;
    }.bind(this));

    document.addEventListener(
      'visibilitychange',
      function () {
        if (!this.track) return;
        this.track.style.animationPlayState = document.hidden || !this.visible ? 'paused' : 'running';
      }.bind(this)
    );

    if (this.velocityLinked && !REDUCED) {
      window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
      this.tick();
    }

    // Duplicate track content once for seamless loop if needed
    this.ensureLoop();
  };

  WavyMarquee.prototype.ensureLoop = function () {
    // Track already repeats items in Liquid; nothing required
  };

  WavyMarquee.prototype.onScroll = function () {
    var now = performance.now();
    var y = window.scrollY;
    var dt = Math.max(now - this.lastT, 1);
    var dy = Math.abs(y - this.lastY);
    // px per ms → normalize to a 0–1 boost factor
    var v = dy / dt;
    this.velocity = this.velocity * 0.7 + v * 0.3;
    this.lastY = y;
    this.lastT = now;
  };

  WavyMarquee.prototype.tick = function () {
    var self = this;
    // Decay velocity when not scrolling
    this.velocity *= 0.92;

    if (this.visible && this.velocityLinked) {
      // Faster scroll → shorter duration (faster marquee), clamp 0.35x–1.4x
      var boost = 1 - Math.min(this.velocity * 8, 0.65);
      var target = this.baseDuration * Math.max(0.35, Math.min(1.4, boost));
      this.currentDuration += (target - this.currentDuration) * 0.12;
      this.el.style.setProperty('--marquee-speed', this.currentDuration.toFixed(2) + 's');
      // Direction nudge: slight skew on fast scroll
      var skew = Math.min(this.velocity * 12, 4);
      this.track.style.setProperty('--marquee-skew', skew.toFixed(2) + 'deg');
    }

    this.raf = requestAnimationFrame(function () {
      self.tick();
    });
  };

  function init(scope) {
    var root = scope || document;
    root.querySelectorAll('[data-section-type="wavy-marquee"]').forEach(function (el) {
      if (el._wavyMarquee) return;
      el._wavyMarquee = new WavyMarquee(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });
})();
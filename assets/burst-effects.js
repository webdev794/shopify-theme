/**
 * Suvara Burst Effects — impact moment section
 * Variants: fade-up, fade-scale, clip-reveal, parallax, ken-burns, split-up
 * Mobile can use a lighter animation; respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.matchMedia('(max-width: 749px)');

  function resolveAnimation(section) {
    var desktop = section.dataset.animation || 'fade-scale';
    var mobile = section.dataset.mobileAnimation || 'fade-up';
    if (REDUCED) return 'none';
    if (MOBILE.matches && mobile !== 'match') return mobile;
    return desktop;
  }

  function applyClass(section, anim) {
    section.classList.remove(
      'burst--fade-up',
      'burst--fade-scale',
      'burst--clip-reveal',
      'burst--parallax',
      'burst--ken-burns',
      'burst--split-up',
      'burst--none'
    );
    section.classList.add('burst--' + (anim || 'none'));
  }

  function initSection(section) {
    if (section.dataset.burstInit) return;
    section.dataset.burstInit = 'true';

    var anim = resolveAnimation(section);
    applyClass(section, anim);

    var duration = section.dataset.duration || '1';
    var delay = section.dataset.delay || '0.2';
    section.style.setProperty('--burst-duration', duration + 's');
    section.style.setProperty('--burst-delay', delay + 's');

    var content = section.querySelector('.burst-effects__content');
    var image = section.querySelector('.burst-effects__image');
    var media = section.querySelector('.burst-effects__media');

    if (anim === 'none') {
      section.classList.add('is-visible');
      return;
    }

    // Entrance via IntersectionObserver
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            section.classList.add('is-visible');
            io.unobserve(section);
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
      );
      io.observe(section);
    } else {
      section.classList.add('is-visible');
    }

    // Parallax continuous
    if (anim === 'parallax' && image && !REDUCED) {
      function handleParallax() {
        var rect = section.getBoundingClientRect();
        var windowHeight = window.innerHeight;
        var centerPoint = rect.top + rect.height / 2;
        var scrollPercent = centerPoint / windowHeight - 0.5;
        var translateY = scrollPercent * (MOBILE.matches ? 20 : 40);
        image.style.transform = 'translateY(' + translateY + 'px)';
      }
      window.addEventListener('scroll', handleParallax, { passive: true });
      window.addEventListener('resize', handleParallax, { passive: true });
      handleParallax();
    }

    // Ken burns is pure CSS once .is-visible
  }

  function init(scope) {
    (scope || document).querySelectorAll('.burst-effects').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else init();

  document.addEventListener('shopify:section:load', function (e) {
    init(e.target);
  });
})();
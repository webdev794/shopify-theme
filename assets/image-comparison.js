function initImageComparisonSection(section) {
  if (section.dataset.initialized) return;
  section.dataset.initialized = 'true';

  const container = section.querySelector('.image-comparison__container');
  const afterImage = section.querySelector('.image-comparison__after');
  const slider = section.querySelector('.image-comparison__slider');
  const defaultPosition = parseInt(section.dataset.defaultPosition) || 50;

  if (!container || !afterImage || !slider) return;

  let isDragging = false;
  let containerWidth = container.offsetWidth;

  // Set initial position
  function setPosition(percentage) {
    const clamped = Math.min(Math.max(percentage, 5), 95);
    const clip = 'inset(0 0 0 ' + clamped + '%)';
    afterImage.style.clipPath = clip;
    afterImage.style.webkitClipPath = clip;
    slider.style.left = clamped + '%';
  }

  // Get position from mouse/touch event
  function getPosition(e) {
    const rect = container.getBoundingClientRect();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  // Handle move
  function handleMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const percentage = getPosition(e);
    setPosition(percentage);
  }

  // Handle start
  function handleStart(e) {
    isDragging = true;
    container.style.cursor = 'ew-resize';
    slider.style.cursor = 'ew-resize';
    // Prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }

  // Handle end
  function handleEnd() {
    isDragging = false;
    container.style.cursor = '';
    slider.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  }

  // Mouse events
  slider.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);

  // Touch events
  slider.addEventListener('touchstart', handleStart, { passive: true });
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd, { passive: true });
  document.addEventListener('touchcancel', handleEnd, { passive: true });

  // Keyboard support
  slider.setAttribute('tabindex', '0');
  slider.setAttribute('role', 'slider');
  slider.setAttribute('aria-valuemin', '0');
  slider.setAttribute('aria-valuemax', '100');
  slider.setAttribute('aria-valuenow', defaultPosition);

  slider.addEventListener('keydown', function(e) {
    let step = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      step = -5;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      step = 5;
    } else if (e.key === 'Home') {
      e.preventDefault();
      step = -100;
    } else if (e.key === 'End') {
      e.preventDefault();
      step = 100;
    }

    if (step !== 0) {
      const current = parseFloat(slider.style.left) || defaultPosition;
      const newPosition = Math.min(Math.max(current + step, 5), 95);
      setPosition(newPosition);
      slider.setAttribute('aria-valuenow', newPosition);
    }
  });

  // Click on container to jump
  container.addEventListener('click', function(e) {
    if (e.target === slider || e.target.closest('.image-comparison__handle')) return;
    const percentage = getPosition(e);
    setPosition(percentage);
    slider.setAttribute('aria-valuenow', percentage);
  });

  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      containerWidth = container.offsetWidth;
      // Maintain position
      const current = parseFloat(slider.style.left) || defaultPosition;
      setPosition(current);
    }, 250);
  });

  // Initialize
  setPosition(defaultPosition);
  slider.setAttribute('aria-valuenow', defaultPosition);

  // Store instance
  section._imageComparison = {
    setPosition: setPosition,
    destroy: function() {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    }
  };
}

function initAllImageComparisons(root) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  scope.querySelectorAll('[data-section-type="image-comparison"]').forEach(initImageComparisonSection);
}

document.addEventListener('DOMContentLoaded', function() {
  initAllImageComparisons();
});

// Cleanup on section unload
document.addEventListener('shopify:section:unload', function(e) {
  const section = e.target;
  if (section && section._imageComparison) {
    section._imageComparison.destroy();
  }
});

// Reinitialize the fresh DOM copy the editor swaps in on load/setting changes
document.addEventListener('shopify:section:load', function(e) {
  initAllImageComparisons(e.target);
});

/* Theme: comparison modes — animated wipe + vertical axis */
(function () {
  'use strict';

  function initMode(section) {
    var root = section.querySelector('.image-comparison') || section;
    var mode = (section.dataset.compareMode || root.dataset.compareMode || 'slider').toLowerCase();
    var container = section.querySelector('.image-comparison__container, .image-comparison__media, [data-comparison-container]') || root;
    var slider = section.querySelector('.image-comparison__slider, [data-comparison-slider]');
    if (!container) return;

    section.classList.add('image-comparison--mode-' + mode);

    if (mode === 'vertical') {
      section.classList.add('image-comparison--vertical');
      // Reuse existing drag but interpret as vertical if setPosition exists
      if (section._imageComparison && slider) {
        // CSS handles orientation; JS drag already uses clientX — enhance with clientY
      }
    }

    if (mode === 'wipe') {
      var auto = section.dataset.wipeAuto !== 'false';
      var pos = 15;
      var dir = 1;
      function frame() {
        if (!auto) return;
        pos += dir * 0.35;
        if (pos >= 88) dir = -1;
        if (pos <= 12) dir = 1;
        if (section._imageComparison && section._imageComparison.setPosition) {
          section._imageComparison.setPosition(pos);
        } else if (slider) {
          slider.style.left = pos + '%';
          var after = section.querySelector('.image-comparison__after, .image-comparison__image-after');
          if (after) after.style.clipPath = 'inset(0 0 0 ' + pos + '%)';
        }
        section._wipeRaf = requestAnimationFrame(frame);
      }
      // Pause on hover/focus
      section.addEventListener('mouseenter', function () {
        auto = false;
      });
      section.addEventListener('mouseleave', function () {
        auto = section.dataset.wipeAuto !== 'false';
        if (auto && !section._wipeRaf) frame();
      });
      if (auto) frame();
    }
  }

  function init(scope) {
    (scope || document)
      .querySelectorAll('[data-section-type="image-comparison"], .image-comparison-section')
      .forEach(initMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 50);
    });
  } else setTimeout(init, 50);
  document.addEventListener('shopify:section:load', function (e) {
    setTimeout(function () {
      init(e.target);
    }, 50);
  });
})();
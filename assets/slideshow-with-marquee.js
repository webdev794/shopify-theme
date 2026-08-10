document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('[data-section-type="slideshow-with-marquee"]');
  
  sections.forEach(function(section) {
    if (section.dataset.initialized) return;
    section.dataset.initialized = 'true';
    
    const slides = section.querySelectorAll('.slideshow-with-marquee__slide');
    const dots = section.querySelectorAll('.slideshow-with-marquee__dot');
    const prevBtn = section.querySelector('.slideshow-with-marquee__control--prev');
    const nextBtn = section.querySelector('.slideshow-with-marquee__control--next');
    
    const autoplay = section.dataset.autoplay === 'true';
    const autoplaySpeed = parseInt(section.dataset.autoplaySpeed) || 5000;
    const slideHeight = parseInt(section.dataset.slideHeight) || 600;
    const DURATION = 950;
    
    let currentIndex = 0;
    let isAnimating = false;
    let autoplayTimer = null;
    
    const slideshow = section.querySelector('.slideshow-with-marquee__slideshow');
    if (slideshow) {
      slideshow.style.setProperty('--slide-height', slideHeight + 'px');
    }

    // Initial state: first slide expanded from left
    slides.forEach(function(slide, i) {
      slide.setAttribute('data-origin', 'left');
      if (i === 0) {
        slide.setAttribute('data-active', 'true');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.setAttribute('data-active', 'false');
        slide.setAttribute('aria-hidden', 'true');
      }
    });
    
    function goTo(index, direction) {
      if (isAnimating || index === currentIndex || index < 0 || index >= slides.length) return;
      
      isAnimating = true;
      var from = currentIndex;
      var to = index;
      // direction: 1 = next (out left, in from right), -1 = prev
      if (direction === undefined) {
        direction = to > from || (from === slides.length - 1 && to === 0) ? 1 : -1;
        if (from === 0 && to === slides.length - 1) direction = -1;
        if (from === slides.length - 1 && to === 0) direction = 1;
      }

      var leaving = slides[from];
      var entering = slides[to];

      // Horizontal: next = collapse toward left, expand from right
      //             prev = collapse toward right, expand from left
      if (direction >= 0) {
        leaving.setAttribute('data-origin', 'left');
        entering.setAttribute('data-origin', 'right');
      } else {
        leaving.setAttribute('data-origin', 'right');
        entering.setAttribute('data-origin', 'left');
      }

      leaving.setAttribute('data-leaving', 'true');
      leaving.setAttribute('data-active', 'false');
      leaving.setAttribute('aria-hidden', 'true');

      // Force reflow so origin applies before scale
      void entering.offsetWidth;

      entering.setAttribute('data-active', 'true');
      entering.setAttribute('aria-hidden', 'false');
      entering.removeAttribute('data-leaving');

      dots.forEach(function(dot, i) {
        dot.classList.toggle('slideshow-with-marquee__dot--active', i === to);
        if (i === to) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
      
      currentIndex = to;
      
      setTimeout(function() {
        leaving.removeAttribute('data-leaving');
        isAnimating = false;
      }, DURATION);
    }
    
    function next() {
      goTo((currentIndex + 1) % slides.length, 1);
    }
    
    function prev() {
      goTo((currentIndex - 1 + slides.length) % slides.length, -1);
    }
    
    function startAutoplay() {
      if (!autoplay || slides.length <= 1) return;
      stopAutoplay();
      autoplayTimer = setInterval(next, autoplaySpeed);
    }
    
    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        stopAutoplay();
        prev();
        if (autoplay) startAutoplay();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        stopAutoplay();
        next();
        if (autoplay) startAutoplay();
      });
    }
    
    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        const index = parseInt(this.dataset.index, 10);
        if (index !== currentIndex) {
          stopAutoplay();
          goTo(index);
          if (autoplay) startAutoplay();
        }
      });
    });
    
    section.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stopAutoplay();
        prev();
        if (autoplay) startAutoplay();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stopAutoplay();
        next();
        if (autoplay) startAutoplay();
      }
    });
    
    if (section.dataset.stopOnHover === 'true') {
      section.addEventListener('mouseenter', stopAutoplay);
      section.addEventListener('mouseleave', startAutoplay);
    }
    
    if (autoplay) startAutoplay();
    
    section._slideshowInstance = {
      stopAutoplay: stopAutoplay,
      startAutoplay: startAutoplay
    };
  });
});

document.addEventListener('shopify:section:unload', function(e) {
  const section = e.target;
  if (section && section._slideshowInstance) {
    section._slideshowInstance.stopAutoplay();
  }
});

document.addEventListener('shopify:section:load', function(e) {
  const root = e.target;
  if (!root) return;
  const section = root.querySelector('[data-section-type="slideshow-with-marquee"]') || root;
  if (section && section.matches && section.matches('[data-section-type="slideshow-with-marquee"]')) {
    section.dataset.initialized = '';
  }
});
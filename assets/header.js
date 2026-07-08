// ============================================
// HEADER FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initStoreDetails();
  initCartCount();
  initStickyHeader();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('[data-mobile-menu]');
  const sideMenu = document.querySelector('.inner-side-outer');
  
  if (!menuToggle || !sideMenu) return;
  
  // Toggle mobile menu
  menuToggle.addEventListener('click', function(e) {
    e.preventDefault();
    toggleMobileMenu(sideMenu);
  });
  
  // Close on overlay click
  sideMenu.addEventListener('click', function(e) {
    if (e.target === this) {
      toggleMobileMenu(sideMenu, false);
    }
  });
  
  // Mobile tabs with proper switching
  const tabs = document.querySelectorAll('.menu-tab');
  const tabContents = {
    'side-menu-wrapper': document.querySelector('.side-menu-wrapper'),
    'mobile-category-menu-bar': document.querySelector('.mobile-category-menu-bar')
  };
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      const targetId = this.dataset.tab;
      const targetContent = tabContents[targetId];
      
      if (!targetContent) return;
      
      // Update tabs
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      
      // Update content
      Object.values(tabContents).forEach(content => {
        if (content) {
          content.classList.remove('active');
          content.classList.add('hidden');
        }
      });
      
      targetContent.classList.remove('hidden');
      targetContent.classList.add('active');
      
      // Close all open submenus when switching tabs
      closeAllSubmenus();
    });
    
    // Keyboard support for tabs
    tab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
  
  // Submenu toggle (expand/collapse)
  const submenuTriggers = document.querySelectorAll('[data-submenu-trigger]');
  
  submenuTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSubmenu(this);
    });
    
    // Keyboard support for submenu triggers
    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSubmenu(this);
      }
    });
  });
  
  // Close mobile menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (sideMenu && sideMenu.classList.contains('active')) {
        toggleMobileMenu(sideMenu, false);
      }
    }
  });
  
  // Close menu when clicking outside (desktop)
  document.addEventListener('click', function(e) {
    if (sideMenu.classList.contains('active')) {
      const isClickInside = sideMenu.contains(e.target);
      const isMenuButton = e.target.closest('[data-mobile-menu]') || e.target.closest('.menu-toggler-icon');
      
      if (!isClickInside && !isMenuButton) {
        toggleMobileMenu(sideMenu, false);
      }
    }
  });
}

/**
 * Toggle mobile menu open/close
 */
function toggleMobileMenu(menu, forceState) {
  const isActive = menu.classList.contains('active');
  const shouldOpen = forceState !== undefined ? forceState : !isActive;
  
  if (shouldOpen) {
    menu.classList.add('active');
    document.body.classList.add('menu-open');
    menu.setAttribute('aria-hidden', 'false');
    // Focus trap - focus first tab
    const firstTab = menu.querySelector('.menu-tab');
    if (firstTab) setTimeout(() => firstTab.focus(), 100);
  } else {
    menu.classList.remove('active');
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Toggle submenu open/close
 */
function toggleSubmenu(trigger) {
  trigger.classList.toggle('active');
  const isExpanded = trigger.classList.contains('active');
  trigger.setAttribute('aria-expanded', isExpanded);
  
  const targetId = trigger.dataset.submenuTrigger;
  const parentItem = trigger.closest('.nav-item');
  const innerChild = parentItem.querySelector(`.inner-child[data-inner-item="${targetId}"]`);
  
  if (innerChild) {
    innerChild.classList.toggle('open');
    
    // Optional: Close other open submenus (accordion behavior)
    // Uncomment for accordion behavior:
    /*
    const siblings = parentItem.closest('ul').querySelectorAll('.inner-child.open');
    siblings.forEach(sibling => {
      if (sibling !== innerChild) {
        sibling.classList.remove('open');
        const siblingTrigger = sibling.closest('.nav-item').querySelector('[data-submenu-trigger]');
        if (siblingTrigger) {
          siblingTrigger.classList.remove('active');
          siblingTrigger.setAttribute('aria-expanded', 'false');
        }
      }
    });
    */
  }
}

/**
 * Close all open submenus
 */
function closeAllSubmenus() {
  document.querySelectorAll('.inner-child.open').forEach(child => {
    child.classList.remove('open');
  });
  document.querySelectorAll('[data-submenu-trigger].active').forEach(trigger => {
    trigger.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Store Details Dropdown (Works on Mobile + Desktop)
 */
function initStoreDetails() {
  const toggle = document.querySelector('[data-store-details-toggle]');
  const dropdown = document.querySelector('[data-storedetails-dropdown]');
  
  if (!toggle || !dropdown) return;
  
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleDropdown(dropdown);
  });
  
  // Keyboard support
  toggle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(dropdown);
    }
  });
  
  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
      dropdown.setAttribute('aria-hidden', 'true');
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      dropdown.setAttribute('aria-hidden', 'true');
      toggle.focus();
    }
  });
}

/**
 * Toggle dropdown
 */
function toggleDropdown(dropdown) {
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
  dropdown.setAttribute('aria-hidden', isVisible ? 'true' : 'false');
}

/**
 * Cart Count Update
 */
function initCartCount() {
  const countElement = document.querySelector('[data-header-cart-count]');
  if (!countElement) return;
  
  updateCartCount(countElement);
  
  // Listen for cart updates (Shopify AJAX cart)
  document.addEventListener('cart:updated', function() {
    updateCartCount(countElement);
  });
}

/**
 * Update cart count
 */
function updateCartCount(element) {
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      const count = cart.item_count || 0;
      element.textContent = count;
      if (count > 0) {
        element.classList.remove('hidden');
        // Animate count change
        element.style.transform = 'scale(1.3)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 200);
      } else {
        element.classList.add('hidden');
      }
    })
    .catch(() => {
      const initialCount = parseInt(element.textContent) || 0;
      if (initialCount === 0) element.classList.add('hidden');
    });
}

/**
 * Sticky Header with throttle
 */
function initStickyHeader() {
  const header = document.querySelector('.primary-header');
  if (!header) return;
  
  let lastScrollY = window.scrollY;
  let ticking = false;
  
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
          header.classList.add('header-scrolled');
          header.style.transform = currentScrollY > lastScrollY ? 'translateY(-100%)' : 'translateY(0)';
        } else {
          header.classList.remove('header-scrolled');
          header.style.transform = 'translateY(0)';
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
}

/**
 * Close mobile menu on escape key (global handler)
 */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const sideMenu = document.querySelector('.inner-side-outer');
    if (sideMenu && sideMenu.classList.contains('active')) {
      toggleMobileMenu(sideMenu, false);
    }
  }
});
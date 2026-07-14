// ========== LOOKBOOK JAVASCRIPT ==========
// Hotspot popover behavior: one open at a time, close on outside click
// and Escape, aria-expanded kept in sync. Popovers still work without
// this file thanks to native <details> behavior.

(() => {
  const initSection = (section) => {
    if (section.dataset.lookbookInit) return;
    section.dataset.lookbookInit = 'true';

    const hotspots = section.querySelectorAll('[data-lookbook-hotspot]');
    if (!hotspots.length) return;

    const closeAll = (except) => {
      hotspots.forEach((hotspot) => {
        if (hotspot !== except) hotspot.removeAttribute('open');
      });
    };

    hotspots.forEach((hotspot) => {
      const summary = hotspot.querySelector(':scope > summary');
      if (summary) summary.setAttribute('aria-expanded', String(hotspot.open));

      hotspot.addEventListener('toggle', () => {
        if (summary) summary.setAttribute('aria-expanded', String(hotspot.open));
        if (hotspot.open) closeAll(hotspot);
      });
    });

    section.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openHotspot = event.target.closest('details[open]');
      if (openHotspot) {
        openHotspot.removeAttribute('open');
        const summary = openHotspot.querySelector('summary');
        if (summary) summary.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!section.contains(event.target)) closeAll();
    });
  };

  const initAll = (root) => {
    (root || document).querySelectorAll('[data-lookbook]').forEach(initSection);
  };

  initAll();

  // Re-init when the merchant edits the section in the theme editor
  document.addEventListener('shopify:section:load', (event) => {
    initAll(event.target);
  });

  // Open the popover of a hotspot block selected in the theme editor
  document.addEventListener('shopify:block:select', (event) => {
    const hotspot = event.target.closest && event.target.closest('[data-lookbook-hotspot]');
    const target = hotspot || event.target.querySelector('[data-lookbook-hotspot]');
    if (target) target.setAttribute('open', '');
  });

  document.addEventListener('shopify:block:deselect', (event) => {
    const hotspot = event.target.closest && event.target.closest('[data-lookbook-hotspot]');
    const target = hotspot || event.target.querySelector('[data-lookbook-hotspot]');
    if (target) target.removeAttribute('open');
  });
})();
/* Fallback for stores where the Storefront Renderer does not inject
   window.StandardEvents. Provides a no-op createViewEventElement so
   cart.js (CartItems) can be defined. If the real bundle loads, it
   is left untouched. */
(function () {
  if (window.StandardEvents && typeof window.StandardEvents.createViewEventElement === 'function') {
    return; // real bundle present - do nothing
  }

  window.StandardEvents = Object.assign({}, window.StandardEvents, {
    createViewEventElement: function (Base) {
      return class extends Base {
        connectedCallback() {
          if (super.connectedCallback) super.connectedCallback();
        }
        dispatchViewEvent() {
          /* no-op: analytics view events unavailable without the bundle */
        }
      };
    },
  });
})();
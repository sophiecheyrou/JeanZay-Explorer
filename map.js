(() => {
  "use strict";
  function init() {}
  function show() {}
  function focusPlace() {
    const link = document.querySelector('.map-external-link');
    if (link) link.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  window.JZE_MAP = { init, show, focusPlace };
})();

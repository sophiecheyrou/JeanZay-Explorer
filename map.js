(() => {
  'use strict';

  let map = null;
  let markers = [];
  let resizeTimer = null;
  const markerById = new Map();

  function markerIcon(place) {
    return L.divIcon({
      className: 'jze-marker-wrap',
      html: `<div class="jze-marker" aria-label="${place.name}"><span class="jze-marker-emoji">${place.emoji}</span><span class="jze-marker-points">${place.points}</span></div>`,
      iconSize: [46, 50],
      iconAnchor: [23, 48],
      popupAnchor: [0, -44]
    });
  }

  function fitAll() {
    if (!map || !markers.length) return;
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [28, 28], maxZoom: 15 });
  }

  function refreshMap(refit = false) {
    if (!map) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      map.invalidateSize({ animate: false });
      if (refit) fitAll();
    }, 120);
  }

  function init() {
    const el = document.getElementById('placesMap');
    const explorerVisible = document.getElementById('explorer')?.classList.contains('is-active');
    if (!el || !window.L || map || !explorerVisible) return;

    map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false,
      tap: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    (window.JZE_PLACES || []).forEach(place => {
      const lat = Number(place.lat);
      const lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: markerIcon(place),
        title: place.name,
        keyboard: true
      }).addTo(map);

      marker.bindPopup(`
        <div class="map-popup">
          <strong>${place.emoji} ${place.name}</strong>
          <p>${place.description}</p>
          <p><b>${place.points} points</b></p>
          <button type="button" data-map-place="${place.id}">Ouvrir la mission</button>
        </div>
      `);

      markerById.set(String(place.id), marker);
      markers.push(marker);
    });

    map.on('popupopen', event => {
      const button = event.popup.getElement()?.querySelector('[data-map-place]');
      if (!button) return;
      button.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('jze:open-place', {
          detail: button.dataset.mapPlace
        }));
      }, { once: true });
    });

    refreshMap(true);
  }

  function show() {
    if (!map) init();
    refreshMap(true);
  }

  function focusPlace(id) {
    if (!map) init();
    const marker = markerById.get(String(id));
    if (!marker || !map) return;
    refreshMap(false);
    setTimeout(() => {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }, 150);
  }

  document.addEventListener('jze:screen-change', event => {
    if (event.detail === 'explorer') show();
  });

  window.addEventListener('resize', () => refreshMap(false));
  window.JZE_MAP = { init, show, focusPlace };
})();

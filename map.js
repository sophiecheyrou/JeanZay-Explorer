(() => {
  'use strict';
  let map = null;
  let markers = [];
  const markerById = new Map();

  function markerIcon(place) {
    return L.divIcon({
      className: 'jze-marker-wrap',
      html: `<button class="jze-marker" type="button" aria-label="${place.name}">${place.emoji}<span>${place.points}</span></button>`,
      iconSize: [44, 48],
      iconAnchor: [22, 46],
      popupAnchor: [0, -42]
    });
  }

  function init() {
    const el = document.getElementById('placesMap');
    if (!el || !window.L || map) return;
    map = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([48.8515, 2.2605], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    window.JZE_PLACES.forEach(place => {
      if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
      const marker = L.marker([place.lat, place.lng], { icon: markerIcon(place) }).addTo(map);
      marker.bindPopup(`<div class="map-popup"><strong>${place.emoji} ${place.name}</strong><p>${place.description}</p><button type="button" data-map-place="${place.id}">Ouvrir la mission</button></div>`);
      markerById.set(String(place.id), marker);
      markers.push(marker);
    });

    if (markers.length) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.08));
    }

    map.on('popupopen', e => {
      const button = e.popup.getElement()?.querySelector('[data-map-place]');
      if (button) button.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('jze:open-place', { detail: button.dataset.mapPlace }));
      }, { once: true });
    });
  }

  function focusPlace(id) {
    const marker = markerById.get(String(id));
    if (!marker || !map) return;
    map.setView(marker.getLatLng(), 16, { animate: true });
    marker.openPopup();
  }

  window.JZE_MAP = { init, focusPlace };
  document.addEventListener('DOMContentLoaded', init);
})();

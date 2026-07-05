/* Italië 2026 — routekaart (Leaflet, lokaal gebundeld; tiles: OpenStreetMap).
   Data komt uit het inline JSON-blok #routedata (gegenereerd uit route.json). */
(function(){
  'use strict';
  var el = document.getElementById('routedata');
  var kaartEl = document.getElementById('kaart');
  if (!el || !kaartEl || typeof L === 'undefined') return;

  var route;
  try { route = JSON.parse(el.textContent); } catch (e) { return; }
  var etappes = route.etappes || [];
  var ANKERS = { 5: true, 8: true };

  var kaart = L.map('kaart', { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(kaart);

  var punten = [];
  etappes.forEach(function(e){
    if (!e.coord) return;
    punten.push(e.coord);
    var anker = ANKERS[e.nr];
    var icoon = L.divIcon({
      className: 'knoopicoon' + (anker ? ' anker' : ''),
      html: '<span>' + e.nr + '</span>',
      iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14]
    });
    var hl = (e.highlights || []).slice(0, 3)
      .map(function(h){ return '<li>' + ontsmet(h) + '</li>'; }).join('');
    var popup = '<p class="pdatum">' + ontsmet(e.datum) + '</p>' +
      '<h4>' + e.nr + '. ' + ontsmet(e.naar) + '</h4>' +
      '<ul>' + hl + '</ul>' +
      '<span class="naar-etappe">Zie etappe ' + e.nr + ' hieronder ↓</span>';
    var marker = L.marker(e.coord, { icon: icoon, title: 'Etappe ' + e.nr + ': ' + e.naar,
                                     zIndexOffset: anker ? 1000 : 0 })
      .addTo(kaart).bindPopup(popup);
    marker.on('click', function(){
      var doel = document.getElementById('etappe-' + e.nr);
      if (doel) doel.scrollIntoView({ block: 'start' });
    });
  });

  // Routelijn: thuisbasis → alle etappes in volgorde (start = Nijmegen).
  var NIJMEGEN = [51.8126, 5.8372];
  var lijn = [NIJMEGEN].concat(punten.filter(function(p, i){
    // laatste etappe eindigt weer in Nijmegen (coord = Nijmegen), geen dubbel startpunt
    return !(i === punten.length - 1 && p[0] === NIJMEGEN[0] && p[1] === NIJMEGEN[1]);
  })).concat([NIJMEGEN]);
  L.polyline(lijn, { color: '#42573b', weight: 3, dashArray: '7 7', opacity: .85 }).addTo(kaart);

  kaart.fitBounds(L.latLngBounds(lijn).pad(0.08));

  function ontsmet(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();

/* Italië 2026 — taalschakelaar (NL / 中文) + routekaart (Leaflet, lokaal
   gebundeld; tiles: OpenStreetMap). Data uit het inline JSON-blok #routedata. */

/* ---- 1. Taalschakelaar (rechtsboven); keuze wordt onthouden ---- */
(function(){
  'use strict';
  var SLEUTEL = 'it26_lang';
  var geldig = { nl: 1, zh: 1 };
  var opgeslagen;
  try { opgeslagen = localStorage.getItem(SLEUTEL); } catch (e) {}
  var huidig = geldig[opgeslagen] ? opgeslagen : 'nl';

  var knoppen = Array.prototype.slice.call(document.querySelectorAll('.taalknop'));

  function pas_toe(taal, bewaar){
    if (!geldig[taal]) taal = 'nl';
    huidig = taal;
    document.body.classList.toggle('toon-zh', taal === 'zh');
    document.documentElement.setAttribute('lang', taal === 'zh' ? 'zh-CN' : 'nl');
    knoppen.forEach(function(k){
      var aan = k.getAttribute('data-lang') === taal;
      k.classList.toggle('is-actief', aan);
      k.setAttribute('aria-pressed', aan ? 'true' : 'false');
    });
    if (bewaar) { try { localStorage.setItem(SLEUTEL, taal); } catch (e) {} }
  }

  knoppen.forEach(function(k){
    k.addEventListener('click', function(){ pas_toe(k.getAttribute('data-lang'), true); });
  });

  pas_toe(huidig, false);
})();

/* ---- 2. Routekaart ---- */
(function(){
  'use strict';
  var el = document.getElementById('routedata');
  var kaartEl = document.getElementById('kaart');
  if (!el || !kaartEl || typeof L === 'undefined') return;

  var route;
  try { route = JSON.parse(el.textContent); } catch (e) { return; }
  var etappes = route.etappes || [];
  var ANKERS = { 5: true, 8: true };

  function ontsmet(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Tweetalig veld ({nl,zh}) of platte string -> spans die de CSS-taalschakelaar volgt.
  function bi(veld){
    if (veld && typeof veld === 'object'){
      return '<span class="lang lang-nl" lang="nl">' + ontsmet(veld.nl) + '</span>' +
             '<span class="lang lang-zh" lang="zh">' + ontsmet(veld.zh) + '</span>';
    }
    return ontsmet(veld);
  }

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
      .map(function(h){ return '<li>' + bi(h) + '</li>'; }).join('');
    var popup = '<p class="pdatum">' + bi(e.datum) + '</p>' +
      '<h4>' + e.nr + '. ' + ontsmet(e.naar) + '</h4>' +
      '<ul>' + hl + '</ul>' +
      '<span class="naar-etappe">' +
        '<span class="lang lang-nl" lang="nl">Zie etappe ' + e.nr + ' hieronder ↓</span>' +
        '<span class="lang lang-zh" lang="zh">见下方第 ' + e.nr + ' 段 ↓</span>' +
      '</span>';
    var titel = 'Etappe ' + e.nr + ': ' + (e.naar || '');
    var marker = L.marker(e.coord, { icon: icoon, title: titel,
                                     zIndexOffset: anker ? 1000 : 0 })
      .addTo(kaart).bindPopup(popup);
    marker.on('click', function(){
      var doel = document.getElementById('etappe-' + e.nr);
      if (doel) doel.scrollIntoView({ block: 'start' });
    });
  });

  // Routelijn: thuisbasis -> alle etappes in volgorde (start = Nijmegen).
  var NIJMEGEN = [51.8126, 5.8372];
  var lijn = [NIJMEGEN].concat(punten.filter(function(p, i){
    return !(i === punten.length - 1 && p[0] === NIJMEGEN[0] && p[1] === NIJMEGEN[1]);
  })).concat([NIJMEGEN]);
  L.polyline(lijn, { color: '#42573b', weight: 3, dashArray: '7 7', opacity: .85 }).addTo(kaart);

  kaart.fitBounds(L.latLngBounds(lijn).pad(0.08));
})();

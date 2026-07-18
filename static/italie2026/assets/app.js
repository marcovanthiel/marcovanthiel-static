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

/* ---- 2. Sfeervideo's: klik op de facade -> laad pas dan de YouTube-iframe
   (youtube-nocookie; CSP frame-src staat dit toe). Snel + privacyvriendelijk. ---- */
(function(){
  'use strict';
  document.addEventListener('click', function(ev){
    var knop = ev.target && ev.target.closest ? ev.target.closest('.video-facade') : null;
    if (!knop) return;
    var id = knop.getAttribute('data-yt');
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
    var ifr = document.createElement('iframe');
    ifr.className = 'video-iframe';
    ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    ifr.title = knop.getAttribute('aria-label') || 'Video';
    ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    ifr.setAttribute('allowfullscreen', '');
    ifr.setAttribute('loading', 'lazy');
    if (knop.parentNode) knop.parentNode.replaceChild(ifr, knop);
  });
})();

/* ---- 3. Routekaart ---- */
(function(){
  'use strict';
  var el = document.getElementById('routedata');
  var kaartEl = document.getElementById('kaart');
  if (!el || !kaartEl || typeof L === 'undefined') return;

  var route;
  try { route = JSON.parse(el.textContent); } catch (e) { return; }
  var etappes = route.etappes || [];
  var ANKERS = { 3: true, 4: true };

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
    // Permanent dag-label bij de stip (korte plaatsnaam, zonder landcode).
    var kort = String(e.naar || '').split('/')[0].replace(/\s*\([A-Z]{2}\)\s*$/, '').trim();
    if (kort) {
      marker.bindTooltip(kort, { permanent: true, direction: 'right',
        offset: [11, 0], className: 'kaartlabel' + (anker ? ' anker' : '') });
    }
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

/* ---- 4. Aftelteller tot vertrek (31 juli 2026) ---- */
(function(){
  'use strict';
  var el = document.getElementById('aftel');
  if (!el) return;
  var vertrek = new Date(2026, 7, 1);           // maand 0-index: 7 = augustus
  var nu = new Date();
  var vandaag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
  var dagen = Math.round((vertrek - vandaag) / 86400000);
  var html;
  if (dagen > 1)      html = '<span class="lang lang-nl" lang="nl">nog <b>'+dagen+'</b> dagen tot vertrek</span><span class="lang lang-zh" lang="zh">距出发还有 <b>'+dagen+'</b> 天</span>';
  else if (dagen===1) html = '<span class="lang lang-nl" lang="nl">morgen vertrekken we!</span><span class="lang lang-zh" lang="zh">明天出发!</span>';
  else if (dagen===0) html = '<span class="lang lang-nl" lang="nl">vandaag vertrekken we!</span><span class="lang lang-zh" lang="zh">今天出发!</span>';
  else                html = '<span class="lang lang-nl" lang="nl">de reis is begonnen</span><span class="lang lang-zh" lang="zh">旅程已开始</span>';
  el.innerHTML = html;
  el.hidden = false;
})();

/* ---- 5. Printknop (het print-CSS maakt er een A4-reisdocument van) ---- */
(function(){
  'use strict';
  var btn = document.getElementById('printknop');
  if (btn) btn.addEventListener('click', function(){ window.print(); });
})();

/* ---- 6. Scroll-reveal (kaartjes faden in) + count-up van de statbalk ---- */
(function(){
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = Array.prototype.slice.call(
    document.querySelectorAll('.etappe, .praktisch .blok, .statbalk .stat'));

  if (reduced || !('IntersectionObserver' in window)) {
    // Geen animatie: alles gewoon zichtbaar laten (geen .wacht toevoegen).
  } else {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var io = new IntersectionObserver(function(items){
      items.forEach(function(it){
        if (it.isIntersecting){ it.target.classList.add('in-beeld'); io.unobserve(it.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function(t){
      // Al (deels) in beeld bij laden -> meteen tonen, geen flits.
      if (t.getBoundingClientRect().top < vh - 40) { t.classList.add('in-beeld'); }
      else { t.classList.add('wacht'); io.observe(t); }
    });
  }

  // Count-up van de statbalk-getallen wanneer die in beeld komt.
  function telOp(el){
    var doel = parseInt(el.getAttribute('data-telop'), 10);
    if (isNaN(doel)) return;
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    function fmt(n){ return n >= 1000 ? n.toLocaleString('nl-NL') : String(n); }
    var start = null, duur = 1100;
    function stap(ts){
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.round(doel * e)) + suf;
      if (p < 1) requestAnimationFrame(stap);
    }
    requestAnimationFrame(stap);
  }
  var balk = document.querySelector('.statbalk');
  if (balk && !reduced && 'IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(items){
      items.forEach(function(it){
        if (it.isIntersecting){
          balk.querySelectorAll('.statwaarde').forEach(telOp);
          io2.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io2.observe(balk);
  }
})();

/* ---- 7. Voortgangslijn: de routelijn in de tijdlijn 'vult' bij het scrollen ---- */
(function(){
  'use strict';
  var tl = document.querySelector('.tijdlijn');
  var fill = document.querySelector('.tijdlijn-voortgang');
  if (!tl || !fill) return;
  function update(){
    var r = tl.getBoundingClientRect();
    var mid = (window.innerHeight || document.documentElement.clientHeight) * 0.5;
    var gedaan = Math.max(0, Math.min(r.height, mid - r.top));
    fill.style.height = (r.height > 0 ? (gedaan / r.height) * 100 : 0) + '%';
  }
  var bezig = false;
  window.addEventListener('scroll', function(){
    if (!bezig){ bezig = true; requestAnimationFrame(function(){ update(); bezig = false; }); }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

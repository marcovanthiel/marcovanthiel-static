// =====================================================
// Biennale di Venezia 2026 — magazine subpage
// Marco van Thiel · marcovanthiel.nl/biennalevenetie2026
// =====================================================
(function () {
  'use strict';

  var SUPPORTED = ['nl', 'en', 'it', 'de', 'zh'];

  // ----- Date stamps -----
  var months = {
    nl: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    it: ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],
    de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
    zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  };
  var labels = {
    nl: ['Vandaag', 'Laatst bijgewerkt'],
    en: ['Today', 'Last updated'],
    it: ['Oggi', 'Ultimo aggiornamento'],
    de: ['Heute', 'Zuletzt aktualisiert'],
    zh: ['今日', '最后更新']
  };

  function formatDate(lang) {
    var d = new Date();
    if (lang === 'zh') {
      return d.getFullYear() + '年' + months.zh[d.getMonth()] + d.getDate() + '日';
    }
    return d.getDate() + ' ' + months[lang][d.getMonth()] + ' ' + d.getFullYear();
  }

  function updateDates(lang) {
    var t = document.getElementById('today-stamp');
    if (t) t.textContent = labels[lang][0] + ' · ' + formatDate(lang);
    var u = document.getElementById('last-updated');
    if (u) u.textContent = labels[lang][1] + ': ' + formatDate(lang);
  }

  // Huidige taal (zo weet de editorial-renderer naar welke variant
  // hij moet wisselen wanneer setLang() draait).
  var CURRENT_LANG = 'nl';

  // ----- Language switcher -----
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'nl';
    CURRENT_LANG = lang;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);

    // Toggle visible variants
    var nodes = document.querySelectorAll('[data-i18n] [lang]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('lang') === lang) {
        el.setAttribute('data-active', '');
      } else {
        el.removeAttribute('data-active');
      }
    }

    // Buttons
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var j = 0; j < buttons.length; j++) {
      var b = buttons[j];
      b.setAttribute('aria-pressed', b.getAttribute('data-set') === lang ? 'true' : 'false');
    }

    updateDates(lang);
    renderCurrentEditorial();

    try { localStorage.setItem('mvt-biennale-lang', lang); } catch (e) {}
  }

  // =====================================================
  // EDITORIALS — dynamische data-load vanuit JSON
  // =====================================================
  // Laadt het JSON-bestand één keer en houdt de gesorteerde lijst
  // (nieuwste eerst) in module-state. De gebruiker kan via het
  // archief klikken op een oudere editie; ACTIVE_INDEX onthoudt welke
  // editorial momenteel als hoofdartikel zichtbaar is.
  var EDITORIALS = null;       // gesorteerde array (nieuwste eerst)
  var ACTIVE_INDEX = 0;        // 0 = newest

  // Hugo serveert de pagina onder /biennalevenetie2026/. Bij file://
  // tests pakt fetch hetzelfde relatieve pad. We geven het JSON-pad
  // expliciet zodat het ook werkt bij sub-paths.
  function editorialsUrl() {
    // Pak alles tot en met de slug, ongeacht of er een trailing slash
    // of een /index.html in de URL zit.
    var path = window.location.pathname;
    var slug = '/biennalevenetie2026/';
    var idx = path.indexOf(slug);
    var base = idx >= 0 ? path.slice(0, idx + slug.length) : '/biennalevenetie2026/';
    return base + 'data/editorials.json';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Body-HTML in JSON gebruikt <p>, <strong>, <em> — die laten we door.
  // Strong tag-allowlist tegen XSS via toekomstige content.
  function sanitiseBodyHtml(html) {
    if (typeof html !== 'string') return '';
    // Verwijder script/style/link/iframe-tags volledig.
    var cleaned = html.replace(
      /<\s*(script|style|link|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ''
    );
    // Verwijder alle on*-attributen — paranoid maar goedkoop.
    cleaned = cleaned.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // Verwijder javascript:-URLs in href/src.
    cleaned = cleaned.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '');
    return cleaned;
  }

  function formatStamp(dateIso, lang) {
    var d = new Date(dateIso + 'T00:00:00');
    if (isNaN(d.getTime())) return dateIso;
    if (lang === 'zh') {
      return d.getFullYear() + '年' + months.zh[d.getMonth()] + d.getDate() + '日';
    }
    return d.getDate() + ' ' + months[lang][d.getMonth()] + ' ' + d.getFullYear();
  }

  // Eerste alinea een dropcap geven, paragrafen in de columns-2 zetten.
  function buildBodyMarkup(html) {
    var safe = sanitiseBodyHtml(html);
    var firstP = safe.indexOf('<p');
    if (firstP === -1) {
      // Geen paragraphs gevonden — gewoon het geheel in een dropcap-p
      return '<div class="columns-2"><p class="dropcap">' + safe + '</p></div>';
    }
    // Voeg class="dropcap" toe aan de eerste <p>.
    var withDrop;
    var firstClose = safe.indexOf('>', firstP);
    if (firstClose === -1) {
      withDrop = safe;
    } else {
      // Slim: als het al een class-attribuut bevat, voeg hem toe; anders nieuwe class.
      var openTag = safe.slice(firstP, firstClose + 1);
      var newOpen;
      if (/\sclass\s*=/.test(openTag)) {
        newOpen = openTag.replace(/(\sclass\s*=\s*"[^"]*)"/, '$1 dropcap"');
      } else {
        newOpen = openTag.replace('<p', '<p class="dropcap"');
      }
      withDrop = safe.slice(0, firstP) + newOpen + safe.slice(firstClose + 1);
    }
    return '<div class="columns-2">' + withDrop + '</div>';
  }

  function pickLang(map, lang) {
    if (!map) return '';
    if (map[lang] != null) return map[lang];
    if (map.nl != null) return map.nl;
    if (map.en != null) return map.en;
    var first = Object.keys(map)[0];
    return first ? map[first] : '';
  }

  function renderCurrentEditorial() {
    if (!EDITORIALS || EDITORIALS.length === 0) return;
    var ed = EDITORIALS[ACTIVE_INDEX] || EDITORIALS[0];
    var lang = CURRENT_LANG;

    // Sectie-label — overschrijven met datum-versie uit JSON.
    var labelHost = document.querySelector('[data-editorial-label]');
    if (labelHost && ed.label) {
      labelHost.innerHTML =
        '<span lang="nl"' + (lang === 'nl' ? ' data-active' : '') + '>' + escapeHtml(pickLang(ed.label, 'nl')) + '</span>' +
        '<span lang="en"' + (lang === 'en' ? ' data-active' : '') + '>' + escapeHtml(pickLang(ed.label, 'en')) + '</span>' +
        '<span lang="it"' + (lang === 'it' ? ' data-active' : '') + '>' + escapeHtml(pickLang(ed.label, 'it')) + '</span>' +
        '<span lang="de"' + (lang === 'de' ? ' data-active' : '') + '>' + escapeHtml(pickLang(ed.label, 'de')) + '</span>' +
        '<span lang="zh"' + (lang === 'zh' ? ' data-active' : '') + '>' + escapeHtml(pickLang(ed.label, 'zh')) + '</span>';
    }

    var article = document.querySelector('[data-editorial-article]');
    if (!article) return;
    var title = pickLang(ed.title, lang);
    var lede  = pickLang(ed.lede, lang);
    var body  = pickLang(ed.body_html, lang);
    // Lede mag inline <em>/<strong> bevatten (bv. een citaat in italics);
    // sanitiseBodyHtml laat die tags door en strip script/style/on*.
    var safeLede = sanitiseBodyHtml(lede);

    article.innerHTML =
      '<h2 class="head">' + escapeHtml(title) + '</h2>' +
      '<p class="lede">' + safeLede + '</p>' +
      buildBodyMarkup(body) +
      buildMediaMarkup(ed.media, lang);
  }

  // Renderen van een optioneel media-element (video of afbeelding) onder
  // het hoofdartikel. Toont caption in de actieve taal.
  function buildMediaMarkup(media, lang) {
    if (!media || !media.src) return '';
    var src = String(media.src).replace(/^\/+/, ''); // relatief houden
    var caption = media.caption ? escapeHtml(pickLang(media.caption, lang)) : '';
    var poster = media.poster
      ? ' poster="' + escapeHtml(String(media.poster).replace(/^\/+/, '')) + '"'
      : '';
    if (media.type === 'video') {
      // Twee <source>-elementen voor wijdere browser-compat: de meeste
      // .mov-bestanden van iPhone bevatten H.264 die alle moderne
      // browsers afspelen, ongeacht de container-naam.
      return (
        '<figure class="editorial-media editorial-media--video">' +
          '<video controls preload="metadata" playsinline' + poster + '>' +
            '<source src="' + escapeHtml(src) + '" type="video/mp4" />' +
            '<source src="' + escapeHtml(src) + '" type="video/quicktime" />' +
          '</video>' +
          (caption ? '<figcaption>' + caption + '</figcaption>' : '') +
        '</figure>'
      );
    }
    if (media.type === 'image') {
      return (
        '<figure class="editorial-media editorial-media--image">' +
          '<img src="' + escapeHtml(src) + '" alt="' + caption + '" loading="lazy" />' +
          (caption ? '<figcaption>' + caption + '</figcaption>' : '') +
        '</figure>'
      );
    }
    return '';
  }

  function renderEditorialArchive() {
    var host = document.querySelector('[data-editorial-archive]');
    var list = document.querySelector('[data-editorial-archive-list]');
    if (!host || !list || !EDITORIALS) return;
    if (EDITORIALS.length <= 1) {
      host.setAttribute('hidden', '');
      return;
    }
    host.removeAttribute('hidden');
    list.innerHTML = '';
    for (var i = 0; i < EDITORIALS.length; i++) {
      var ed = EDITORIALS[i];
      var li = document.createElement('li');
      li.className = 'editorial-archive-item' + (i === ACTIVE_INDEX ? ' is-active' : '');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'editorial-archive-btn';
      btn.setAttribute('data-index', String(i));
      btn.innerHTML =
        '<time>' + escapeHtml(formatStamp(ed.date, CURRENT_LANG)) + '</time>' +
        '<span class="editorial-archive-title">' + escapeHtml(pickLang(ed.title, CURRENT_LANG)) + '</span>';
      btn.addEventListener('click', (function (idx) {
        return function () {
          ACTIVE_INDEX = idx;
          renderCurrentEditorial();
          renderEditorialArchive();
          // Scroll de gebruiker terug naar de top van de section.
          var section = document.getElementById('editorial');
          if (section && section.scrollIntoView) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      })(i));
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function loadEditorials() {
    fetch(editorialsUrl(), { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = (data && data.editorials) || [];
        // Sorteer nieuwste eerst.
        items.sort(function (a, b) {
          return (b.date || '').localeCompare(a.date || '');
        });
        EDITORIALS = items;
        ACTIVE_INDEX = 0;
        renderCurrentEditorial();
        renderEditorialArchive();
      })
      .catch(function (err) {
        console.error('editorials laden mislukt:', err);
      });
  }

  // =====================================================
  // FLITS — moderne effecten (scroll progress, particles,
  // scroll-reveal, strap-shadow). Bewust vanilla, geen
  // bibliotheken; respecteert prefers-reduced-motion.
  // =====================================================

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  // ----- Scroll progress bar -----
  function initScrollProgress() {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var scrolled = doc.scrollTop || document.body.scrollTop;
      var height = (doc.scrollHeight - doc.clientHeight) || 1;
      var pct = Math.max(0, Math.min(100, (scrolled / height) * 100));
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // ----- Strap krijgt schaduw bij scroll -----
  function initStrapShadow() {
    var strap = document.querySelector('.strap');
    if (!strap) return;
    function update() {
      if ((window.scrollY || window.pageYOffset) > 4) {
        strap.classList.add('is-scrolled');
      } else {
        strap.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ----- Constellation-particles op de masthead -----
  function initParticles() {
    if (prefersReducedMotion()) return;
    var canvas = document.querySelector('.masthead-particles');
    if (!canvas) return;
    var header = canvas.parentElement;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var dpr = window.devicePixelRatio || 1;
    var W = 0, H = 0;
    var nodes = [];
    var NODE_COUNT = 48;
    var LINK_DISTANCE = 130;

    function resize() {
      var rect = header.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.4 + 0.6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // dots
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 255, 58, 0.55)';
        ctx.fill();
      }
      // links
      ctx.lineWidth = 0.6;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DISTANCE) {
            var alpha = (1 - d / LINK_DISTANCE) * 0.32;
            ctx.strokeStyle = 'rgba(212, 255, 58, ' + alpha + ')';
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize();
    seed();
    draw();
    window.addEventListener('resize', function () {
      resize();
      seed();
    });
  }

  // ----- Scroll-reveal via IntersectionObserver -----
  function initReveal() {
    var els = document.querySelectorAll(
      'section, .card, .review, .update-entry, .pullquote, .gossip, .cover-art, footer.colofon'
    );
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in-view');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  // ----- Init -----
  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (ev) {
        setLang(ev.currentTarget.getAttribute('data-set'));
      });
    }

    // Restore previous selection or detect from browser
    var saved = null;
    try { saved = localStorage.getItem('mvt-biennale-lang'); } catch (e) {}
    if (saved && SUPPORTED.indexOf(saved) !== -1) {
      setLang(saved);
    } else {
      // Check browser language preference
      var nav = (navigator.language || 'nl').toLowerCase().slice(0, 2);
      var detected = SUPPORTED.indexOf(nav) !== -1 ? nav : 'nl';
      setLang(detected);
    }

    // Flits-effecten activeren
    initScrollProgress();
    initStrapShadow();
    initReveal();
    initParticles();

    // Editorial-data ophalen en renderen.
    loadEditorials();
  });
})();

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

  // ----- Language switcher -----
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'nl';
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

    try { localStorage.setItem('mvt-biennale-lang', lang); } catch (e) {}
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
      'section, .card, .review, .update-entry, .pullquote, .gossip, .cover-art, .meta-row, footer.colofon'
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
  });
})();

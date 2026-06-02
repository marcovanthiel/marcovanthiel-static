// =====================================================
// Rotary Nijmegen Stad en Land — fundraising · common.js
// Gedeeld over hub + 3 subsites. Geen frameworks, geen build.
//
// 1. Scroll-reveal via IntersectionObserver
// 2. Count-up animatie
// 3. Veiligheidstimer voor Samsung Internet
// 4. Taal-schakelaar: knoppen, theme-class, persist in localStorage
// =====================================================
(function () {
  'use strict';

  // -----------------------------------------------------
  // Taal-configuratie. Theme volgt taal automatisch.
  // Nieuwe talen toevoegen = entry hier + vertaling in HTML.
  // -----------------------------------------------------
  var LANG_CONFIG = {
    nl: { label: 'NL', theme: 'theme-blue',  title: 'Nederlands'        },
    de: { label: 'DE', theme: 'theme-gold',  title: 'Deutsch'           },
    en: { label: 'EN', theme: '',            title: 'English'           },
    zh: { label: '中', theme: 'theme-jade',  title: '中文 · Chinese'     },
    id: { label: 'ID', theme: 'theme-spice', title: 'Bahasa Indonesia'  }
  };
  var DEFAULT_LANG = 'nl';
  var STORAGE_KEY  = 'mvt-fundraising-lang';

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function revealAll(els) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
  }

  function animateCounter(el) {
    if (el.dataset.counterDone === '1') return;
    el.dataset.counterDone = '1';
    var target = parseFloat(el.getAttribute('data-counter')) || 0;
    var duration = parseInt(el.getAttribute('data-counter-duration'), 10) || 1500;
    var prefix = el.getAttribute('data-counter-prefix') || '';
    var suffix = el.getAttribute('data-counter-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-counter-decimals'), 10) || 0;
    if (prefersReducedMotion()) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var v = (target * eased).toFixed(decimals);
      el.textContent = prefix + v + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var reveals = document.querySelectorAll('[data-reveal]');
    var counters = document.querySelectorAll('[data-counter]');

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      revealAll(reveals);
      for (var i = 0; i < counters.length; i++) animateCounter(counters[i]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        if (e.target.hasAttribute('data-counter')) animateCounter(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    for (var j = 0; j < reveals.length; j++)  io.observe(reveals[j]);
    for (var k = 0; k < counters.length; k++) io.observe(counters[k]);

    // Safety net — sommige mobiele browsers (Samsung Internet) triggeren
    // IO niet voor reeds-zichtbare elementen. Na 1,2 s geforceerd onthullen.
    setTimeout(function () {
      revealAll(reveals);
      for (var m = 0; m < counters.length; m++) animateCounter(counters[m]);
    }, 1200);

    initLangSwitch();
  });

  // =====================================================
  // Taal-schakelaar
  // - Bouwt knoppen in [data-lang-switch] containers.
  // - Past <html lang="..."> en body theme-class toe.
  // - Persist in localStorage; eerste bezoek leest browserkeuze.
  // - Stuurt 'languagechange' event af zodat andere modules
  //   (zoals glass.js) kunnen reageren.
  // =====================================================
  function getInitialLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANG_CONFIG[saved] && !LANG_CONFIG[saved].disabled) return saved;
    } catch (e) {}
    var nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (LANG_CONFIG[nav] && !LANG_CONFIG[nav].disabled) return nav;
    return DEFAULT_LANG;
  }

  function applyLang(lang) {
    var cfg = LANG_CONFIG[lang];
    if (!cfg || cfg.disabled) return;
    document.documentElement.setAttribute('lang', lang);
    var body = document.body;
    // Verwijder alle theme-* classes, voeg de juiste toe
    body.classList.remove('theme-blue', 'theme-red', 'theme-gold', 'theme-jade', 'theme-spice');
    if (cfg.theme) body.classList.add(cfg.theme);
    // Update knop-toestand
    var btns = document.querySelectorAll('[data-lang-switch] button[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-lang') === lang ? 'true' : 'false');
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  }

  function initLangSwitch() {
    var hosts = document.querySelectorAll('[data-lang-switch]');
    if (!hosts.length) return;
    var keys = Object.keys(LANG_CONFIG);

    hosts.forEach(function (host) {
      host.innerHTML = ''; // start schoon
      host.setAttribute('role', 'group');
      host.setAttribute('aria-label', 'Language');
      keys.forEach(function (k) {
        var cfg = LANG_CONFIG[k];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = cfg.label;
        btn.setAttribute('data-lang', k);
        btn.setAttribute('title', cfg.title);
        btn.setAttribute('aria-pressed', 'false');
        if (cfg.disabled) btn.setAttribute('disabled', '');
        btn.addEventListener('click', function () { applyLang(k); });
        host.appendChild(btn);
      });
    });

    applyLang(getInitialLang());
  }
})();
